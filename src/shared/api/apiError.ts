import { isAxiosError } from 'axios'

/**
 * RFC 7807 problem details, as rendered by the API's `ApiControllerBase`.
 * `title` is display text; `code` is the stable identifier the backend
 * documents as the thing clients should branch on.
 */
export interface ProblemDetails {
  title?: string
  status?: number
  detail?: string
  code?: string
}

export interface ApiError {
  /** Human-readable message, safe to show in a toast. */
  message: string
  /** Stable backend error code, e.g. "user.email_taken". Absent on network failures. */
  code: string | null
  /** HTTP status, absent when the request never reached the server. */
  status: number | null
}

const NETWORK_MESSAGE = 'Could not reach the server. Check that the API is running.'

/**
 * Normalises anything thrown by a repository call into one predictable
 * shape, so components never inspect Axios internals or guess at payloads.
 */
export function toApiError(error: unknown, fallback = 'Something went wrong.'): ApiError {
  if (isAxiosError(error)) {
    if (!error.response) {
      return { message: NETWORK_MESSAGE, code: null, status: null }
    }

    const { status, data } = error.response

    if (data && typeof data === 'object') {
      const problem = data as ProblemDetails
      if (problem.title || problem.detail) {
        return {
          message: problem.title ?? problem.detail ?? fallback,
          code: problem.code ?? null,
          status,
        }
      }
    }

    if (typeof data === 'string' && data.trim()) {
      return { message: data, code: null, status }
    }

    return { message: statusFallback(status, fallback), code: null, status }
  }

  if (error instanceof Error) {
    return { message: error.message, code: null, status: null }
  }

  return { message: fallback, code: null, status: null }
}

/** Convenience for call sites that only need the text. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  return toApiError(error, fallback).message
}

function statusFallback(status: number, fallback: string): string {
  switch (status) {
    case 401:
      return 'Your session has expired. Please sign in again.'
    case 403:
      return 'You do not have permission to do that.'
    case 404:
      return 'That record no longer exists.'
    case 409:
      return 'That change conflicts with existing data.'
    default:
      return fallback
  }
}
