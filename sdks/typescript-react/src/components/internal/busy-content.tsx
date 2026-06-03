import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { memo } from 'react'
import { Spinner } from './spinner'

type BusyContentProps = {
  busy: boolean
  label: string
  busyLabel?: string
}

export const BusyContent = memo(function BusyContent({ busy, label, busyLabel }: BusyContentProps) {
  if (busy) {
    return (
      <>
        <Spinner size="sm" label={busyLabel ?? label} />
        <VisuallyHidden.Root>{label}</VisuallyHidden.Root>
      </>
    )
  }
  return <>{label}</>
})
