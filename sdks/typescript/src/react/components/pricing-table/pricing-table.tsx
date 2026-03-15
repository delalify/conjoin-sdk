import { useCallback, useState } from 'react'
import { useBundles } from '../../hooks/use-bundles'
import { useCheckout } from '../../hooks/use-checkout'

type PricingTableProps = {
  entityId: string
  referenceId: string
  highlightedBundleId?: string
  onCheckoutComplete?: () => void
}

export function PricingTable({ entityId, referenceId, highlightedBundleId, onCheckoutComplete }: PricingTableProps) {
  const { bundles, isLoading, error } = useBundles(entityId, referenceId)
  const checkout = useCheckout()
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const handleActivate = useCallback(
    async (bundleReferenceId: string) => {
      if (activatingId) return
      setActivatingId(bundleReferenceId)
      try {
        await checkout.activate({
          entityId,
          referenceId: bundleReferenceId,
          data: { customer_id: '' },
        })
        onCheckoutComplete?.()
      } catch {
        // Error surfaced via checkout.error
      } finally {
        setActivatingId(null)
      }
    },
    [entityId, checkout, onCheckoutComplete, activatingId],
  )

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <span data-conjoin-spinner="" data-size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div data-conjoin-card="" style={{ textAlign: 'center' }} role="alert">
        <p style={{ color: 'var(--conjoin-danger)' }}>Failed to load pricing</p>
      </div>
    )
  }

  if (bundles.length === 0) {
    return (
      <div data-conjoin-card="" style={{ textAlign: 'center' }}>
        <p style={{ color: 'var(--conjoin-subtle-text)' }}>No pricing plans available</p>
      </div>
    )
  }

  const columns = Math.min(bundles.length, 3)

  return (
    <div data-conjoin-pricing-grid="" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {bundles.map(bundle => {
        const bundleRecord = bundle as Record<string, unknown>
        const id = bundleRecord.id as string
        const name = (bundleRecord.name as string) ?? ''
        const description = (bundleRecord.description as string) ?? ''
        const features = Array.isArray(bundleRecord.features) ? (bundleRecord.features as string[]) : []
        const price = bundleRecord.price as { amount: number; currency: string; interval: string } | undefined
        const isHighlighted = id === highlightedBundleId
        const isActivating = activatingId === id
        const isDisabled = !!activatingId || checkout.isLoading

        return (
          <div key={id} data-conjoin-pricing-card="" data-highlighted={isHighlighted ? 'true' : undefined}>
            <h3 data-conjoin-heading="" style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              {name}
            </h3>

            {description && (
              <p style={{ color: 'var(--conjoin-subtle-text)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {description}
              </p>
            )}

            {price && (
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700 }}>
                  {new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: price.currency,
                    minimumFractionDigits: 0,
                  }).format(price.amount / 100)}
                </span>
                <span style={{ color: 'var(--conjoin-subtle-text)', fontSize: '0.875rem' }}>/{price.interval}</span>
              </div>
            )}

            {features.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem', flex: 1 }}>
                {features.map(feature => (
                  <li
                    key={`${id}-${feature}`}
                    style={{
                      padding: '0.375rem 0',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ color: 'var(--conjoin-success)' }} aria-hidden="true">
                      &#10003;
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              data-conjoin-button=""
              data-variant={isHighlighted ? 'primary' : 'outline'}
              style={{ width: '100%', marginTop: 'auto' }}
              disabled={isDisabled}
              aria-busy={isActivating}
              onClick={() => handleActivate(id)}
            >
              {isActivating ? <span data-conjoin-spinner="" data-size="sm" /> : 'Get started'}
            </button>
          </div>
        )
      })}

      {checkout.error && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center' }} role="alert">
          <p data-conjoin-field-error="">Checkout failed. Please try again.</p>
        </div>
      )}
    </div>
  )
}
