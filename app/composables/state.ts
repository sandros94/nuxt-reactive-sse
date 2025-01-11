import type { Ref, MaybeRef } from '#imports'
import { toRef, watch, useState } from '#imports'

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
  keys: MaybeRef<Array<keyof T>>,
  options?: {
    prefix?: string
  },
): StateObject<T> {
  const states = {} as StateObject<T>
  const _keys = toRef(keys) as Ref<Array<keyof T>>

  watch(_keys, (newKeys) => {
    for (const key of newKeys) {
      if (!key || typeof key !== 'string') {
        throw new TypeError('[useMultiState] key must be a string: ' + String(key))
      }

      states[key as keyof T] = useState<T[typeof key] | undefined>(
        options?.prefix
          ? `${options.prefix}-${String(key)}`
          : String(key),
        () => undefined,
      )
    }
  }, { immediate: true })

  return states
}
