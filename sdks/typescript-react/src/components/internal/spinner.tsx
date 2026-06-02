import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { memo } from 'react'

type SpinnerProps = {
  size?: 'sm' | 'md'
  label?: string
}

export const Spinner = memo(function Spinner({ size = 'sm', label = 'Loading' }: SpinnerProps) {
  return (
    <output data-conjoin-spinner="" data-size={size}>
      <VisuallyHidden.Root>{label}</VisuallyHidden.Root>
    </output>
  )
})
