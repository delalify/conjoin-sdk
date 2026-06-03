import { type PriceBundleItem, useBundles, useCheckout } from '@conjoin-cloud/react-core'
import { memo, useCallback, useMemo, useState } from 'react'
import { BusyContent } from '../internal/busy-content'
import { Spinner } from '../internal/spinner'

type PricingTableProps = {
  entityId: string
  referenceId: string
  highlightedBundleId?: string
  onCheckoutComplete?: () => void
}

type ManagedCatalog = NonNullable<PriceBundleItem['managed_catalog']>
type CatalogPrice = ManagedCatalog['prices'][number]

type DisplayPrice = {
  amount: number
  currency: string
  interval: string | null
}

type DisplayBundle = {
  bundleId: string
  referenceId: string
  name: string
  description: string
  features: string[]
  price: DisplayPrice | undefined
}

function selectPrice(prices: CatalogPrice[]): CatalogPrice | undefined {
  return prices.find(price => price.type === 'recurring') ?? prices[0]
}

function toIntervalLabel(price: CatalogPrice): string | null {
  if (price.type !== 'recurring' || !price.recurring) return null
  const { interval, interval_count: count } = price.recurring
  if (count && count > 1) return `${count} ${interval}`
  return interval
}

function toDisplayPrice(catalog: ManagedCatalog): DisplayPrice | undefined {
  const selected = selectPrice(catalog.prices)
  if (!selected) return undefined
  return {
    amount: selected.amount,
    currency: selected.currency,
    interval: toIntervalLabel(selected),
  }
}

function toFeatureNames(catalog: ManagedCatalog): string[] {
  const features = catalog.product.features
  if (!features) return []
  return features.map(feature => feature.name)
}

function toDisplayBundle(bundle: PriceBundleItem): DisplayBundle {
  const catalog = bundle.managed_catalog ?? null
  return {
    bundleId: bundle.price_bundle_id,
    referenceId: bundle.reference_id,
    name: bundle.name,
    description: bundle.description ?? '',
    features: catalog ? toFeatureNames(catalog) : [],
    price: catalog ? toDisplayPrice(catalog) : undefined,
  }
}

function resolveFractionDigits(currency: string): number {
  try {
    const resolved = new Intl.NumberFormat(undefined, { style: 'currency', currency }).resolvedOptions()
    return resolved.maximumFractionDigits ?? 2
  } catch {
    return 2
  }
}

function formatPrice(price: DisplayPrice): string {
  const digits = resolveFractionDigits(price.currency)
  const major = price.amount / 10 ** digits
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: price.currency }).format(major)
  } catch {
    return `${major} ${price.currency}`
  }
}

type PricingCardProps = {
  bundle: DisplayBundle
  isHighlighted: boolean
  isActivating: boolean
  isDisabled: boolean
  onActivate: (bundleId: string) => void
}

const PricingCard = memo(function PricingCard({
  bundle,
  isHighlighted,
  isActivating,
  isDisabled,
  onActivate,
}: PricingCardProps) {
  const handleActivate = useCallback(() => onActivate(bundle.referenceId), [onActivate, bundle.referenceId])

  return (
    <div data-conjoin-pricing-card="" data-highlighted={isHighlighted ? 'true' : undefined}>
      <h3 data-conjoin-heading="" data-level="plan">
        {bundle.name}
      </h3>

      {bundle.description ? <p data-conjoin-plan-description="">{bundle.description}</p> : null}

      {bundle.price ? (
        <div data-conjoin-price="">
          <span data-conjoin-price-amount="">{formatPrice(bundle.price)}</span>
          {bundle.price.interval ? <span data-conjoin-price-interval="">/{bundle.price.interval}</span> : null}
        </div>
      ) : null}

      {bundle.features.length > 0 ? (
        <ul data-conjoin-feature-list="">
          {bundle.features.map(feature => (
            <li key={`${bundle.bundleId}-${feature}`}>
              <span data-conjoin-feature-check="" aria-hidden="true">
                &#10003;
              </span>
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        data-conjoin-button=""
        data-variant={isHighlighted ? 'primary' : 'outline'}
        data-block="true"
        disabled={isDisabled}
        aria-busy={isActivating}
        onClick={handleActivate}
      >
        <BusyContent busy={isActivating} label="Get started" busyLabel="Starting checkout" />
      </button>
    </div>
  )
})

export function PricingTable({ entityId, referenceId, highlightedBundleId, onCheckoutComplete }: PricingTableProps) {
  const { bundles, isLoading, error } = useBundles(entityId, referenceId)
  const checkout = useCheckout()
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const displayBundles = useMemo(() => bundles.map(toDisplayBundle), [bundles])

  const handleActivate = useCallback(
    async (bundleReferenceId: string) => {
      if (activatingId) return
      setActivatingId(bundleReferenceId)
      try {
        await checkout.activate({
          entityId,
          referenceId: bundleReferenceId,
        })
        onCheckoutComplete?.()
      } catch {
        // Failure is surfaced through checkout.error below.
      } finally {
        setActivatingId(null)
      }
    },
    [entityId, checkout, onCheckoutComplete, activatingId],
  )

  if (isLoading) {
    return (
      <div data-conjoin-state="" data-pad="loose">
        <Spinner size="md" label="Loading pricing" />
      </div>
    )
  }

  if (error) {
    return (
      <div data-conjoin-card="" data-conjoin-center="" role="alert">
        <p data-conjoin-field-error="">Failed to load pricing</p>
      </div>
    )
  }

  if (displayBundles.length === 0) {
    return (
      <div data-conjoin-card="" data-conjoin-center="">
        <p data-conjoin-muted="">No pricing plans available</p>
      </div>
    )
  }

  const columns = Math.min(displayBundles.length, 3)
  const isDisabled = activatingId !== null || checkout.isLoading

  return (
    <div data-conjoin-pricing-grid="" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {displayBundles.map(bundle => (
        <PricingCard
          key={bundle.bundleId}
          bundle={bundle}
          isHighlighted={bundle.referenceId === highlightedBundleId}
          isActivating={activatingId === bundle.referenceId}
          isDisabled={isDisabled}
          onActivate={handleActivate}
        />
      ))}

      {checkout.error ? (
        <div data-conjoin-center="" style={{ gridColumn: '1 / -1' }} role="alert">
          <p data-conjoin-field-error="">Checkout failed. Please try again.</p>
        </div>
      ) : null}
    </div>
  )
}
