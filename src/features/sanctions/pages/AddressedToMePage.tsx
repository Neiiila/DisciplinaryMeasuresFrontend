import { Message } from 'primereact/message'
import { useCallback, useMemo, useState } from 'react'
import { useAuthStore } from '@/features/auth/store/authStore'
import { sanctionRepository } from '@/features/sanctions/api/sanctionRepository'
import { SanctionDetailsDialog } from '@/features/sanctions/components/SanctionDetailsDialog'
import { SanctionRequestTable } from '@/features/sanctions/components/SanctionRequestTable'
import { useSanctionList } from '@/features/sanctions/hooks/useSanctionList'
import { isAwaiting } from '@/features/sanctions/lib/sanctionStatus'

/**
 * Requests routed to the signed-in user as a validator: the ones still
 * waiting on them, and the ones they have already answered.
 */
export function AddressedToMePage() {
  const user = useAuthStore((state) => state.user)
  const fetcher = useCallback(() => sanctionRepository.getAddressedToMe(), [])
  const { requests, isLoading, refresh } = useSanctionList(fetcher, 'Could not load requests')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { awaitingMe, answered } = useMemo(() => {
    if (!user) return { awaitingMe: [], answered: requests }

    return {
      awaitingMe: requests.filter((request) => isAwaiting(request, user.userId)),
      answered: requests.filter((request) => !isAwaiting(request, user.userId)),
    }
  }, [requests, user])

  return (
    <div className="page">
      <div className="page-header">
        <h1>Requests addressed to me</h1>
      </div>

      <section className="page-section">
        <h2>Awaiting your decision</h2>
        {!isLoading && awaitingMe.length === 0 ? (
          <Message severity="success" text="Nothing is waiting on you." />
        ) : (
          <SanctionRequestTable
            requests={awaitingMe}
            isLoading={isLoading}
            showRequester
            emptyMessage="Nothing is waiting on you."
            onSelect={(request) => setSelectedId(request.id)}
          />
        )}
      </section>

      <section className="page-section">
        <h2>Already answered</h2>
        <SanctionRequestTable
          requests={answered}
          isLoading={isLoading}
          showRequester
          emptyMessage="You have not answered any requests yet."
          onSelect={(request) => setSelectedId(request.id)}
        />
      </section>

      {selectedId !== null && (
        <SanctionDetailsDialog
          sanctionId={selectedId}
          onHide={() => setSelectedId(null)}
          onChanged={refresh}
        />
      )}
    </div>
  )
}
