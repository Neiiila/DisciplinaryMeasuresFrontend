import { useCallback, useEffect, useState } from 'react'
import type { SanctionRequestSummary } from '@/features/sanctions/types'
import { toApiError } from '@/shared/api/apiError'
import { useToast } from '@/shared/ui/ToastProvider'

/**
 * Shared loading/error/refresh plumbing for the three request lists.
 *
 * Each list differs only in which repository call it makes, so that call is
 * the parameter; everything around it — the loading flag, the error toast,
 * the refresh handle a dialog needs after it changes something — is common.
 */
export function useSanctionList(
  fetcher: () => Promise<SanctionRequestSummary[]>,
  errorSummary: string,
) {
  const toast = useToast()
  const [requests, setRequests] = useState<SanctionRequestSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setRequests(await fetcher())
    } catch (error) {
      toast.error(errorSummary, toApiError(error).message)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher, errorSummary])

  useEffect(() => {
    void load()
  }, [load])

  return { requests, isLoading, refresh: load }
}
