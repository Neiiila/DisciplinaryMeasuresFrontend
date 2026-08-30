# Disciplinary Measures — Frontend

A React 19 single-page application for managing employee disciplinary procedures: raising sanction
requests against employees, routing them through a supervisor approval chain, administering user
accounts, and browsing the employee directory.

It is a ground-up rewrite of an Angular 15 client, built against the .NET 10 API in the sibling
`DisciplinaryMeasures` repository.

---

## Table of contents

- [Stack](#stack)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [Architecture](#architecture)
  - [Repository pattern](#repository-pattern-for-data-access)
  - [Typed vocabulary shared with the backend](#typed-vocabulary-shared-with-the-backend)
  - [Normalised error handling](#normalised-error-handling)
  - [Authentication and session](#authentication-and-session)
  - [Authorisation](#authorisation)
  - [Composition over duplication](#composition-over-duplication)
- [The domain](#the-domain)
- [Testing](#testing)
- [Continuous integration](#continuous-integration)
- [Relationship to the legacy application](#relationship-to-the-legacy-application)
- [Genericization](#genericization)
- [Known gaps](#known-gaps)

---

## Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **React 19.2** | — |
| Build | **Vite 8** | Fast dev server, native ESM, first-class TS |
| Language | **TypeScript** (strict) | The API contract is the main source of risk; types make drift visible |
| Routing | **React Router 7** | Nested layout routes map cleanly onto the dashboard shell |
| Server state | **Axios** + repositories | One configured client, one place per domain for endpoints |
| Session state | **Zustand** | The only genuinely global state is the session; a store beats context here |
| Forms | **React Hook Form** + **Zod** | Uncontrolled inputs, schema-derived types, no re-render per keystroke |
| UI kit | **PrimeReact 10** | Tables, dialogs, timelines and overlays out of the box |
| Charts | **ApexCharts** | Only used on the dashboard |
| Tests | **Vitest** + **Testing Library** + **MSW** | Network-level mocking, so tests assert the real contract |

---

## Getting started

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run dev
```

The app expects the API at the URL in `VITE_API_BASE_URL` (default `https://localhost:7113`). To run
the backend alongside it, from the `DisciplinaryMeasures` repository:

```bash
dotnet run --project src/DisciplinaryMeasures.Api --launch-profile https
```

Two things to know when running both locally:

- **CORS.** The API only allows origins listed under `Cors:AllowedOrigins`, which ships as
  `http://localhost:4200`. Add Vite's origin (`http://localhost:5173`) there, or the browser will
  block every request.
- **The dev certificate.** The `https` profile uses ASP.NET's self-signed certificate. Run
  `dotnet dev-certs https --trust` once, or point `VITE_API_BASE_URL` at `http://localhost:5113`.

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Typecheck, then production bundle into `dist/` |
| `npm run preview` | Serve the built bundle |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b`, no emit |
| `npm test` | Run the suite once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Suite plus a V8 coverage report |

---

## Configuration

All configuration is read once, in `src/shared/config/env.ts`. Nothing else reads `import.meta.env`.

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `https://localhost:7113` | API origin |
| `VITE_COMPANY_NAME` | `Your Company` | Shown on the sign-in screen and in the sidebar |
| `VITE_EMPLOYEE_ID_PREFIX` | *(empty)* | When set, matriculation numbers must start with it |
| `VITE_COMPANY_EMAIL_DOMAIN` | *(empty)* | When set, company emails must end with it |

---

## Project structure

Organised by **feature**, not by technical layer. Everything that belongs to sanction requests lives
under `features/sanctions`, rather than being scattered across `components/`, `services/` and
`models/` directories as it was in the Angular original.

```
src/
  app/
    AppRoutes.tsx          Route table and route-level authorisation
  features/
    auth/                  Sign-in, registration, session store
    users/                 User administration and account lifecycle
    employees/             Read-only directory
    sanctions/             The request workflow
    dashboard/             Landing page and its derived figures
    notifications/         Notification feed
  shared/
    api/                   Axios instance, error normalisation
    config/                Environment values, roles and enums
    lib/                   JWT decoding, token storage, form-data, dates
    ui/                    App shell, route guards, toasts, status pages
  test/                    Harness: MSW server, factories, render helpers
```

Within a feature:

| Folder | Contains |
|---|---|
| `api/` | The repository — the only place that talks to `httpClient` |
| `types.ts` | The domain model, mirroring the API contracts |
| `pages/` | Route-level components |
| `components/` | Pieces reused within the feature |
| `hooks/` | Feature-scoped hooks |
| `lib/` | Pure functions — the most heavily tested code in the app |

---

## Architecture

### Repository pattern for data access

Every domain exposes a repository object; components never call Axios directly.

```ts
// features/sanctions/api/sanctionRepository.ts
export const sanctionRepository = {
  async getMine(): Promise<SanctionRequestSummary[]> {
    const { data } = await httpClient.get<SanctionRequestSummary[]>('/api/sanction-requests/mine')
    return data
  },
  // ...
}
```

**The problem it solves.** The Angular original had fifteen services, each hardcoding
`https://localhost:7155` and each building requests inline; a handful of components also called the
API directly. When the backend was rewritten and every route changed, there was no single place to
change — the URLs were spread across the codebase, and some of them only surfaced at runtime.

Now each domain has exactly one file that knows about HTTP. A route change touches one function, and
because the repositories are tested against MSW at the network level, a mistake shows up as a failing
test rather than a 404 in production.

### Typed vocabulary shared with the backend

The API is configured with `JsonStringEnumConverter`, so its enums travel as names. The client
declares the same spellings:

```ts
export const ROLES = {
  GUEST: 'Guest',
  EMPLOYEE: 'Employee',
  ADMINISTRATOR: 'Administrator',
} as const
```

**The problem it solves.** The legacy client compared free-text French status strings (`"Active"`,
`"Supprimé"`) that the legacy backend stored as free text — every comparison was one typo away from
silently failing, and nothing caught it. Matching the enum names exactly means a role or status can be
compared directly, and `isRole()` rejects anything the client does not recognise rather than trusting
it.

### Normalised error handling

Every failure — a rejected request, a validation error, an unreachable server — is funnelled through
one function that returns one shape:

```ts
export interface ApiError {
  message: string       // safe to show in a toast
  code: string | null   // the API's stable error code, for branching
  status: number | null // null when the request never reached the server
}
```

**The problem it solves.** The API renders failures as RFC 7807 problem details with a display `title`
and a stable `code`. Without normalisation, every call site would need to know that, plus how Axios
reports a network failure (no `response` at all), plus what to show for a bare 401. Centralising it
means a component writes `toApiError(error).message` and gets something the user can act on —
including *"Could not reach the server"*, which is the single most common failure in local
development and was previously indistinguishable from a rejected request.

### Authentication and session

Sign-in posts to `/api/authentication/login` and receives a JWT plus the caller's identity. The token
is stored in `localStorage`; the session is rehydrated from it on boot.

```
POST /api/authentication/login
  → { token, expiresOn, userId, displayName, role, photoPath }
  → tokenStorage.set(token)
  → useAuthStore: { user, isAuthenticated: true }
```

Two deliberate behaviours:

- **`httpClient` attaches `Authorization: Bearer <token>` to every request.** The legacy Angular
  services never sent the header at all. That went unnoticed only because the legacy controllers had
  no `[Authorize]` attribute either — the entire user API was reachable anonymously. Every route on
  the current API except the two authentication endpoints requires the header.
- **An expired token is discarded at boot, not on first use.** `restoreSession()` checks `exp` before
  trusting a stored token, so a returning user with a stale session lands on the sign-in page instead
  of a dashboard that fails to load.

A `401` from any call clears the token and redirects to `/login`, in-app.

### Authorisation

One component, configured per route:

```tsx
<ProtectedRoute allowedRoles={[ROLES.ADMINISTRATOR]}>
  <UserListPage />
</ProtectedRoute>
```

**The problem it solves.** The Angular app had five guards — `AuthGuardGuard`, `RoleGuard`,
`AdminGuard`, `ChiefGuard`, `SuperAdminGuard` — with overlapping responsibilities. Three of them
redirected rejected users to `/access-denied`, a path the router never registered, so the redirect
fell through to the catch-all and showed a 404 instead of an explanation. One configurable component
removes both the duplication and the inconsistency, and a test pins the redirect target down.

The guard is a convenience, not the enforcement point: the API applies its own `Administrator` policy
regardless. Route roles are chosen to agree with the policies on the corresponding endpoints, so the
UI does not offer actions that are guaranteed to be refused.

### Composition over duplication

The three request lists (all / mine / addressed to me) share one table component and one loading hook,
parameterised by the repository call and by which columns apply.

**The problem it solves.** The legacy app had four near-identical list components, each with its own
copy of the status-label mapping and progress calculation. They had drifted: the same request state
rendered under different labels on different screens. The shared table means there is one rendering of
a request, and `stateOf()` is the single place the three state booleans are collapsed into a label.

---

## The domain

A **sanction request** is raised by one user against an employee, citing a **fault** — either one from
the catalogue or a new one proposed inline, which an administrator later validates.

The request then travels up an **approval chain**. At any moment it is awaiting exactly one validator,
identified by `currentValidatorId`. Each validator records a **decision** — `Approved`, `Refused` or
`Missed` (the step elapsed) — and progress advances (`2/3`). A refusal closes the request; enough
approvals close it too. The requester may **cancel** their own request while it is still open.

The API returns three independent booleans — `isCancelled`, `isRefused`, `isClosed` — which the client
collapses into a single displayed state:

```ts
export function stateOf(request): RequestState {
  if (request.isCancelled) return 'cancelled'
  if (request.isRefused) return 'refused'   // set alongside isClosed; the more informative of the two
  if (request.isClosed) return 'approved'
  return 'inProgress'
}
```

**Roles.** `Guest` is read-only and is what a freshly registered account gets. `Employee` may raise
requests and answer the ones addressed to them. `Administrator` additionally manages users, activates
accounts, and sees every request.

**Account lifecycle.** Registration creates a `Pending` account and issues no token — an administrator
must activate it before first sign-in. Access can later be `Revoked` without deleting the employee
record.

---

## Testing

77 tests, covering the places where a regression would be silent or expensive.

```bash
npm test
```

### Approach

**Network-level mocking, not module stubbing.** MSW intercepts HTTP, so tests assert against real
URLs, verbs and payloads:

```ts
it('posts a decision as the enum name the API expects', async () => {
  let body: unknown = null
  server.use(
    http.post(api('/api/sanction-requests/100/decisions'), async ({ request }) => {
      body = await request.json()
      return HttpResponse.json(aRequestDetail())
    }),
  )

  await sanctionRepository.recordDecision(100, VALIDATION_DECISIONS.REFUSED, 'Not substantiated')

  expect(body).toEqual({ decision: 'Refused', note: 'Not substantiated' })
})
```

Stubbing the repository module would have asserted only that a function was called. This asserts the
contract: if a route is renamed, or a payload field changes shape, the test fails. Unhandled requests
are configured to **error**, so a repository quietly calling the wrong URL cannot pass.

**Two environments, deliberately.** Component tests run under jsdom; repository tests declare
`// @vitest-environment node`. This is not arbitrary: jsdom's `Blob` cannot be streamed by the fetch
implementation MSW uses, so parsing a multipart upload under jsdom **hangs indefinitely** rather than
failing, and mixing jsdom's `FormData` with Node's `File` silently drops the filename. Running
repository tests in `node` uses one coherent implementation, and is faster besides.

**Factories with override patches**, so each test states only what it cares about:

```ts
aRequestSummary({ isRefused: true, isClosed: true })
```

### What is covered

| Area | Guards against |
|---|---|
| **Repository contracts** | Route, verb or payload drift against the .NET controllers — including the exactly-one-of `faultId`/`proposedFault` rule and the dotted form keys ASP.NET needs to bind nested `Employment` |
| **`stateOf` / `progressPercent`** | Mislabelled request states; the `isRefused + isClosed` case where "Refused" must win; divide-by-zero on a request with no validators |
| **`isAwaiting`** | Offering Approve/Refuse to the wrong person, or on a settled request |
| **`SanctionDetailsDialog`** | The same rule end-to-end through the UI, plus an empty note travelling as `null` rather than `""` |
| **`ProtectedRoute`** | Anonymous access; the wrong-role redirect target the legacy guards got wrong |
| **`LoginPage`** | Token persistence; a `403` on a not-yet-activated account showing its actual reason; no token left behind on failure |
| **`RaiseSanctionRequestPage`** | The branch between citing a catalogued fault and proposing a new one |
| **JWT decoding** | An unknown role or missing subject being treated as a valid session |
| **Error normalisation** | Problem details, bare statuses, and an unreachable server |
| **Dashboard maths** | Miscounted totals; a malformed timestamp taking down the chart |

### What is not covered, and why

Presentational components with no logic (`RequestsTrendChart`, `StateDonutChart`) are excluded from
coverage: they are declarative configuration around ApexCharts, and the data they render is produced by
`summarise.ts`, which is tested directly. Testing them would assert that ApexCharts works.

---

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`.

```
        ┌── Lint ──────┐
push ───┼── Typecheck ─┼──► Build ──► dist artifact
        └── Tests ─────┘
             │
             └──► coverage artifact
```

The three quality gates run in parallel as a matrix with `fail-fast: false`, so one failure does not
hide the others — a pull request surfaces every problem in a single run. `Build` runs only once all
three pass, and uploads the bundle.

`.github/dependabot.yml` opens weekly npm updates, grouped by area (React, tooling, testing) so routine
patch bumps arrive as one pull request rather than a dozen.

---

## Relationship to the legacy application

The rewrite happened in two stages, and the second was substantial.

The client was first rebuilt in React from the Angular source, with its API layer reverse-engineered
from what the old components called. It was then **adapted to the rewritten .NET 10 backend**, whose
contract turned out to differ fundamentally — not in field names, but in what the system does.

**Every route changed:**

| Legacy | Current |
|---|---|
| `POST /api/Auth/login` | `POST /api/authentication/login` |
| `GET /api/User`, `/api/User/BU?bu=` | `GET /api/users` |
| `GET /api/Employee`, `/api/Employee/BU?bu=` | `GET /api/employees` |
| `GET /usersRequests?userId=` | `GET /api/sanction-requests/mine` |
| `GET /GetRecievedRequests?userId=` | `GET /api/sanction-requests/addressed-to-me` |
| `GET /Notifications?id=` | `GET /api/users/me/notifications` |

**Features removed, because their endpoints no longer exist.** The HR decision wizard, PDF letter
generation, the meeting calendar and the statistics dashboard were all built on endpoints
(`postDecision`, `postMeeting`, `/api/Statistics/*`) that the backend rewrite did not carry forward.
The current domain has no notion of an employee sanction status, a preliminary meeting, or a generated
letter. These screens could not have functioned, so they were removed rather than left calling routes
that 404. The dashboard was rebuilt from data that does exist.

**Concepts that changed shape:**

- Roles went from four (`superadmin`/`admin`/`chief`/`guest`) to three (`Guest`/`Employee`/
  `Administrator`).
- Business-unit scoping is gone: there is no BU claim on the token and no scoped endpoint.
- A "decision" now means a validator's `Approved`/`Refused` answer, not an HR sanction outcome.
- `ValidationDecision` replaced a `bool?` whose meaning was documented only in a trailing comment.
- Field naming moved from `first_Name`/`business_Unit` to clean camelCase with nested `employment`,
  so the hand-written mappers were deleted rather than rewritten.

**Security defects that did not survive the rewrite.** Several were structural rather than incidental:
the legacy user API carried no `[Authorize]` attribute at all and was reachable anonymously; the
notifications endpoint took a user id as a query parameter, so anyone could read anyone's; and
`GET /api/User` serialised the `User` entity directly, shipping every user's PBKDF2 password hash to
the browser. The current API fixes all three, and this client is built to match: it sends the bearer
token on every request and reads notifications from the token-scoped `/me` route.

---

## Genericization

The original codebase hardcoded one employer's conventions throughout — a logo asset and the literal
string "TE Connectivity Morocco" on generated documents, an identifier convention (`^te`) and an email
domain (`@te\.com$`) baked into regular expressions across several components, and a `representantTE`
field in the shared state model. That made the application unusable anywhere else.

None of it remains. What survived as a genuine requirement is configuration, and each rule is only
enforced when a value is actually set — so the default build accepts any identifier and any email
domain:

```ts
export function employeeIdSchema() {
  const base = z.string().min(1, 'Matriculation number is required.')
  if (!env.employeeIdPrefix) return base
  return base.regex(new RegExp(`^${escapeRegExp(env.employeeIdPrefix)}`, 'i'), /* ... */)
}
```

---

## Known gaps

- **Notifications poll** every 30 seconds rather than using the SignalR hub the backend exposes at
  `/hubs/notifications`. Polling needs no extra dependency and is trivially testable; moving to the hub
  is a change to `useNotifications` alone, since the header consumes only its return value.
- **Arabic profiles** (`PUT /api/employees/{id}/arabic-profile`) have a repository method but no UI.
- **Password change** (`PUT /api/users/{id}/password`) likewise — the endpoint is wired, the screen is
  not.
- **Fault validation.** Proposed faults are created unvalidated, and the API has no endpoint for an
  administrator to validate one; they can only be edited directly in the database today.
