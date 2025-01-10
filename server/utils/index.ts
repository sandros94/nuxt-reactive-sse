import { createHooks } from 'hookable'

export { randomUUID } from 'uncrypto'

export interface WSHooks {
  notifications(...message: { type: string, data: any }[]): void | Promise<void>
}

export const wsHooks = createHooks<WSHooks>()
