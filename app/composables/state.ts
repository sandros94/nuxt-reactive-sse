import type { Ref, MaybeRef } from '#imports'
import { isRef, watch, useState } from '#imports'

// Type helper for state object with specific value types per key
export type StateObject<T extends Record<string, any>> = {
  [K in keyof T]: Ref<T[K] | undefined>
}

/**
 * Creates multiple reactive states from an array of keys
 * @param keys Array of keys matching the generic type object
 * @param options Configuration options
 * @param options.prefix Optional prefix for state keys
 * @returns Object containing reactive states for each key
 */
export function useMultiState<T extends Record<string, any>>(
  keys: MaybeRef<Array<keyof T>>,
  options?: {
    prefix?: string
  },
): StateObject<T> {
  const states = {} as StateObject<T>

  if (isRef(keys)) {
    watch(keys, (newKeys) => {
      getStates(states, newKeys, options?.prefix)
    }, { immediate: true })
  }
  else {
    getStates(states, keys, options?.prefix)
  }

  return states
}

function getStates<T extends Record<string, any>>(states: StateObject<T>, keys: Array<keyof T>, prefix?: string) {
  for (const key of keys) {
    if (!key || typeof key !== 'string') {
      throw new TypeError('[useMultiState] key must be a string: ' + String(key))
    }

    states[key as keyof T] = useState<T[typeof key] | undefined>(
      prefix
        ? `${prefix}-${String(key)}`
        : String(key),
      () => undefined,
    )
  }
}
