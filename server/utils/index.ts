import type { PublicRuntimeConfig } from '@nuxt/schema'
import { createHooks } from 'hookable'

export { randomUUID } from 'uncrypto'

type InternalChannels = PublicRuntimeConfig['ws']['channels']['internal'][number]
type AllChannels = PublicRuntimeConfig['ws']['channels']['available'][number] | InternalChannels

type WSMessage<D extends AllChannels = AllChannels, T = unknown> = {
  channel: D
  from?: string
  data: T
}

type ChannelHooks = {
  [K in AllChannels]: (...messages: WSMessage<K>[]) => void | Promise<void>
}

export interface WSHooks extends ChannelHooks {
  all(...message: { channel: AllChannels, from?: string, data: unknown }[]): void | Promise<void>
  internal(...message: { channel: InternalChannels, from?: string, data: unknown }[]): void | Promise<void>
}

export const wsHooks = createHooks<WSHooks>()
