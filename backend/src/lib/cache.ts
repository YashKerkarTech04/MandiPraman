// Tiny in-memory TTL cache. The public Tiramisu RPC is rate limited, so identical reads
// within a few seconds are served from memory. Any write clears it.

const store = new Map<string, { at: number; value: unknown }>()

export async function cached<T>(keyName: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(keyName)
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T
  const value = await load()
  store.set(keyName, { at: Date.now(), value })
  return value
}

export function clearCache() {
  store.clear()
}
