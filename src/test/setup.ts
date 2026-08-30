import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { server } from '@/test/server'

/**
 * Shared setup for both test environments.
 *
 * Component tests run under jsdom; repository tests declare
 * `@vitest-environment node` so that multipart uploads are parsed by the
 * same fetch implementation Node ships with. jsdom's Blob cannot be streamed
 * by it, and mixing the two silently drops the filename from a FormData
 * entry. Anything jsdom-specific below is therefore applied conditionally.
 */
const isDom = typeof window !== 'undefined'

if (!isDom) {
  // tokenStorage reads localStorage, which the node environment has no
  // notion of. A Map-backed stand-in is enough for what the tests exercise.
  const store = new Map<string, string>()

  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size
    },
  } as Storage
}

beforeAll(() => {
  if (isDom) {
    // PrimeReact's overlays measure the DOM on open; jsdom has no layout
    // engine, so these are stubbed rather than left to throw.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Element.prototype.scrollIntoView ??= vi.fn()
  }

  // An unexpected call is a failure, not a silent miss: that is what makes
  // these tests catch a repository drifting onto the wrong route.
  server.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  if (isDom) cleanup()
  server.resetHandlers()
  localStorage.clear()
  vi.clearAllMocks()
})

afterAll(() => {
  server.close()
})
