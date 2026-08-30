# Disciplinary Measures — Frontend

A React 19 + TypeScript rewrite of the disciplinary-measures management console: track sanction requests
against employees, route them through an approval chain, record HR decisions, schedule follow-up
meetings, manage employees/user accounts, and view activity on a statistics dashboard.

This is a rewrite of a previous Angular 15 application. It targets the same ASP.NET backend API but
replaces the client entirely — architecture, state management and UI layer — while removing every
company-specific assumption the original codebase had baked in (see [Genericization](#genericization)).

## Stack

- **React 19** + **TypeScript**, built with **Vite**
- **React Router 7** for routing and role-based route protection
- **Zustand** for the authentication store
- **React Hook Form** + **Zod** for forms and validation
- **PrimeReact** for the component library (tables, dialogs, steps, timeline, calendar, file upload)
- **Axios** for HTTP, **ApexCharts** for the dashboard, **jsPDF** + **html2canvas** for document generation

## Getting started

```bash
npm install
cp .env.example .env   # then adjust values for your environment
npm run dev
```

The dev server proxies `/api` to the backend configured in `vite.config.ts` (defaults to
`https://localhost:7155`, matching the original backend's dev port).

## Project structure

```
src/
  app/            Route table
  features/       One folder per domain: auth, employees, users, sanctions, meetings, dashboard, notifications
    <feature>/
      api/          Repository: the only place that talks to httpClient for this domain
      types.ts       Domain model (+ wire-format DTOs where the backend shape differs)
      pages/         Route-level components
      components/    Reusable pieces scoped to the feature
  shared/
    api/          Axios instance, error helpers
    config/       Environment values, roles
    lib/          Cross-feature utilities (JWT decoding, form-data building, PDF rendering, ...)
    ui/           App shell (sidebar/header), route guards, toast provider
```

## Architecture & design decisions

**Repository pattern for data access.** Every domain exposes a `*Repository` object (e.g.
`employeeRepository`, `sanctionRepository`) that wraps `httpClient` calls. Components never call Axios
directly. The original app scattered `HttpClient` calls and hardcoded URLs across ~15 services and
several components; centralizing each domain's endpoints in one file means a backend contract change
only ever touches one place, and components stay focused on presentation.

**Data Mapper for wire-format translation.** The backend returns PascalCase/underscore field names
(`first_Name`, `business_Unit`, `hiring_Date`). Rather than let that leak into the UI, each repository
that needs it (`employees`, `users`) has a small mapper (`toEmployee`/`toEmployeeDto`) that converts to
and from a clean camelCase domain model. The rest of the app — forms, tables, charts — only ever sees the
camelCase shape.

**A typed reducer replaces the shared mutable state bus.** The original app coordinated its multi-step
HR decision workflow (review request → choose new status → confirm & generate the letter) through a
`GlobalDataService` holding several RxJS `BehaviorSubject`s, shared across sibling routed components. One
of its two "invoke" channels was accidentally wired to the same subject as the other, so completing the
sanction wizard could silently also fire the meeting wizard's handler. The rewrite models this as an
explicit `useReducer` state machine (`decisionWizardReducer`) inside a `DecisionWizardProvider` created
fresh per sanction id — every transition is a typed action, and two wizard instances can never cross-talk
because they don't share a subject.

**A single configurable route guard.** The Angular app had five overlapping guards
(`AuthGuardGuard`, `RoleGuard`, `AdminGuard`, `ChiefGuard`, `SuperAdminGuard`), and some of them redirected
to a route (`/access-denied`) that was never actually registered in the router (the real route was
`/unauthorized`). `ProtectedRoute` replaces all of them with one component that takes an optional
`allowedRoles` list, and the redirect target is now consistent.

**PDF generation as an adapter.** `renderElementToPdfFile` (in `shared/lib/pdfFromElement.ts`) wraps
`html2canvas` + `jsPDF` behind one function. Both PDF-producing screens in the original app
(`SanctionPdfGeneratorComponent`, `SanctionReportPdfGeneratorComponent`) had independently implemented
this canvas-to-PDF plumbing; here they render their own hidden template and call the same adapter.

**Attachment type detection, consolidated.** Guessing a file's kind from its extension was implemented
twice in the legacy code (`DetailsSanctionComponent`, `HrSanctionDetailsComponent`) and had drifted
slightly between the two. It now lives once in `features/sanctions/lib/attachments.ts`.

## Authentication

JWT-based, same as the original backend: `POST /api/Auth/login` returns a token, decoded client-side to
read the role, business unit, and photo claims. Unlike the legacy app, `httpClient` centrally attaches
`Authorization: Bearer <token>` to every request (the original Angular services never actually did this),
and a `401` response clears the stored token and redirects to `/login`.

## Genericization

The original codebase hardcoded its employer's conventions throughout: a logo asset and the literal text
"TE Connectivity Morocco" on generated documents, an employee-id convention ("must start with `te`"), and
an email-domain convention ("must end with `@te.com`") baked into regular expressions in several
components. These are now configuration:

| Setting | Purpose |
|---|---|
| `VITE_COMPANY_NAME` | Shown on the login screen and generated letters/reports |
| `VITE_EMPLOYEE_ID_PREFIX` | Enforced on employee-id fields when set; disabled when empty |
| `VITE_COMPANY_EMAIL_DOMAIN` | Enforced on company email fields when set; disabled when empty |

See `.env.example`.

## Known simplifications

Ported faithfully in behavior, but intentionally scoped down from the original where the legacy
implementation was itself a workaround worth replacing rather than reproducing:

- **Notifications** poll the existing REST endpoint every 30s instead of holding a permanent SignalR
  connection. The original SignalR client was wired to a hardcoded placeholder user id rather than the
  signed-in user, so it never actually worked as "real-time per-user notifications." A real push channel
  can be added behind `useNotifications` without touching the header component that consumes it.
- **Meetings** has a list view; the full "record a meeting outcome" wizard (map / licenciement) mirrors
  the sanction decision wizard's pattern and was left as a follow-up rather than duplicated ahead of need.
- Several sanction/meeting API response shapes were reverse-engineered from how the Angular components
  consumed them (the original used `any` throughout, with no formal contract). Confirm field names in
  `features/sanctions/api/sanctionRepository.ts` against the real backend before relying on them.
- `UserService.verifyAccount`'s legacy URL (`/api/User/id?id={id}`) looked like a copy-paste bug; the
  rewrite calls `/api/User/verifyAccount/{id}` — confirm against the backend and adjust if needed.
