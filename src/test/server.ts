import { setupServer } from 'msw/node'

/**
 * A request-level mock of the API.
 *
 * Tests assert against real URLs, verbs and payloads rather than against
 * stubbed repository modules, so a repository that starts calling the wrong
 * route fails the suite. `onUnhandledRequest: 'error'` in the setup file
 * means an unexpected call is a failure rather than a silent miss.
 */
export const server = setupServer()
