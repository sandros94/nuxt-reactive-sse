import type { PublicRuntimeConfig } from '@nuxt/schema'
import type { Peer, Hooks, Message } from 'crossws'
import { getQuery } from 'ufo'

export default useWebSocketHandler({
  async open(peer, { channels, config }) {
    config.channels.available.forEach(channel => peer.subscribe(channel))
    for (const channel of channels) {
      peer.subscribe(channel)
      const data = await useKV('ws').getItem(channel)
      if (data)
        peer.send(JSON.stringify(data), { compress: true })
    }

    // Send connection status
    const activeChannels = Array.from(peer['_topics'])
    peer.send(JSON.stringify({
      channel: '_internal',
      data: {
        channels: activeChannels,
        message: activeChannels.length
          ? `Subscribed to: "${activeChannels.join(', ')}"`
          : 'No channels subscribed',
      },
    }))
  },
  message(peer, message, { config }) {
    const parsedMessage = v.safeParse(
      v.object({
        channel: v.string(),
        data: v.any(),
      }),
      message.json(),
    )
    if (!parsedMessage.success) return
    if (config.channels.internal.includes(parsedMessage.output.channel)) return

    const { channel, data } = parsedMessage.output
    peer.publish(
      channel,
      JSON.stringify({
        channel,
        data: {
          ...data,
          from: peer.id,
        },
      }),
      { compress: true },
    )
  },
})

type WSConfig = PublicRuntimeConfig['ws']

type MaybePromise<T> = T | Promise<T>
// TODO: add to each hook a merged runtimeConfig
interface WSHooks extends Partial<Omit<Hooks, 'open' | 'close' | 'message'>> {
  /** A socket is opened */
  open: (peer: Peer, config: { channels: string[], config: WSConfig }) => MaybePromise<void>

  /** A message is received */
  message: (peer: Peer, message: Message, config: { channels: string[], config: WSConfig }) => MaybePromise<void>

  /** A socket is closed */
  close: (peer: Peer, details: {
    code?: number
    reason?: string
  }, config: { channels: string[], config: WSConfig }) => MaybePromise<void>
}

export function useWebSocketHandler(options: Partial<WSHooks>) {
  let config: WSConfig

  const getConfig = () => {
    if (config) return config
    return config = useRuntimeConfig().public.ws
  }

  // TODO: get runtimeConfig channels and merge them with defaultChannels

  return defineWebSocketHandler({
    upgrade: req => options.upgrade?.(req),

    async open(peer) {
      const config = getConfig()

      // Automatically subscribe to internal channels
      config.channels.internal.forEach(channel => peer.subscribe(channel))

      // Get channels
      const channels = getWSChannels(peer.websocket.url)

      // Setup notification hooks
      wsHooks.hook('all', (...messages) => {
        for (const { channel, data } of messages) {
          wsPublishToAll(
            peer,
            channel,
            JSON.stringify({
              channel,
              data,
            }),
            { compress: true },
          )
        }
      })
      wsHooks.hook('internal', (...messages) => {
        for (const { channel, data } of messages) {
          if (!config.channels.internal.includes(channel)) return
          wsPublishToAll(
            peer,
            channel,
            JSON.stringify({
              channel,
              data,
            }),
            { compress: true },
          )
        }
      })

      return options.open?.(peer, { channels, config })
    },

    message: (peer, message) => options.message?.(peer, message, {
      channels: getWSChannels(peer.websocket.url),
      config: getConfig(),
    }),

    async close(peer, details) {
      // TODO: is it really needed to unsubscribe from all channels?
      const config = getConfig()
      const channels = getWSChannels(peer.websocket.url)
      const _channels = [...config.channels.available, ...config.channels.internal, ...channels]
      _channels.forEach(c => peer.unsubscribe(c))

      logger.info('`ws [close]`:', peer.id)
      return options.close?.(peer, details, { channels, config })
    },

    error: (peer, error) => options.error?.(peer, error),
  })
}

function getWSChannels(url?: string): string[] {
  if (!url) return []

  const { channels } = getQuery<{
    channels?: string | string[]
  }>(url)

  return channels === undefined
    ? []
    : Array.isArray(channels)
      ? channels
      : [channels]
}

function wsPublishToAll(
  peer: Peer,
  topic: string,
  message: any,
  options?: {
    compress?: boolean
  },
) {
  let firstPeer: Peer | null = null

  for (const _peer of peer.peers) {
    if (_peer['_topics'].has(topic)) {
      firstPeer = _peer
      break
    }
  }

  if (firstPeer?.id === peer.id) {
    firstPeer.send(message, options)
    firstPeer.publish(topic, message, options)
  }
}
