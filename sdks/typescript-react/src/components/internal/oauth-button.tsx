import { memo, useCallback } from 'react'

type OAuthButtonProps = {
  provider: string
  onSelect: (provider: string) => void
}

function formatProviderName(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

export const OAuthButton = memo(function OAuthButton({ provider, onSelect }: OAuthButtonProps) {
  const handleClick = useCallback(() => onSelect(provider), [onSelect, provider])

  return (
    <button type="button" data-conjoin-social-button="" onClick={handleClick}>
      Continue with {formatProviderName(provider)}
    </button>
  )
})
