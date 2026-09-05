import "server-only"

// Per-process, best-effort cache: survives while Vercel keeps this
// serverless instance warm across requests, gone on cold start or a
// different instance. No eviction sweep — this app has a handful of
// appUserIds at most, so the map never grows enough to matter.
interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function memoize<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  options: {
    ttlMs: number
    keyFn: (...args: Args) => string
    shouldCache?: (value: T) => boolean
  },
) {
  return async (...args: Args): Promise<T> => {
    const key = options.keyFn(...args)
    const cached = store.get(key)

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T
    }

    const value = await fn(...args)

    if (options.shouldCache?.(value) ?? true) {
      store.set(key, { value, expiresAt: Date.now() + options.ttlMs })
    }

    return value
  }
}
