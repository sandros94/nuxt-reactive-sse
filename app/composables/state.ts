import type { Ref, MaybeRefOrGetter } from '#imports'
import { useState, toValue } from '#imports'

// Type helper for state object with specific value types per key
type StateObject<T extends Record<string, any>> = {
  [K in keyof T]: Ref<T[K] | undefined>
}

/**
 * Creates multiple reactive states from an array of keys
 * @param keys Array of keys matching the generic type object
 * @param options Configuration options
 * @returns Object containing reactive states for each key
 */
export function useMultiState<T extends Record<string, any>>(
  keys: MaybeRefOrGetter<keyof T | Array<keyof T>>,
  options?: {
    prefix?: string
  },
): StateObject<T> {
  const states = {} as StateObject<T>
  const k = toValue(keys)
  const _keys = Array.isArray(k) ? k : [k]

  for (const key of _keys) {
    states[key] = useState<T[typeof key] | undefined>(
      options?.prefix
        ? `${options.prefix}-${String(key)}`
        : String(key),
      () => undefined,
    )
  }

  return states
}
