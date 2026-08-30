/**
 * Single source of truth for where the JWT lives on the client.
 *
 * Kept separate from the auth store and the HTTP client so neither has to
 * import the other just to read the token: the store owns the decoded user,
 * the HTTP client only needs the raw string to build the `Authorization`
 * header (something the original Angular services never actually did).
 */
const TOKEN_KEY = 'disciplinary-measures.token'

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY)
  },
}
