export function serializeQuery(params: Record<string, unknown>): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    appendParam(parts, key, value)
  }

  return parts.join('&')
}

function appendParam(parts: string[], prefix: string, value: unknown): void {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    for (const item of value) {
      parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(item))}`)
    }
    return
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      appendParam(parts, `${prefix}[${key}]`, nested)
    }
    return
  }

  parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`)
}
