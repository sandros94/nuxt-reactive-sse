import type { Peer } from 'crossws'
import { getQuery } from 'ufo'

const DEFAULT_KV_BASE = 'ws'

export default defineWebSocketHandler({
  async open(peer) {
    peer.subscribe('system')
    const kv = useKV(DEFAULT_KV_BASE)
    const channels = getChannels(peer.websocket.url)

    for (const channel of channels) {
      peer.subscribe(channel)
      const data = await kv.getItem(channel)
      if (data) peer.send(JSON.stringify(data), { compress: true })
    }

    logger.info('`ws [open]`:', peer.id)
    if (channels.length > 0)
      peer.send(JSON.stringify({
        type: 'system',
        data: {
          channels,
          message: `Subscribed to: "${channels.join().replace(/,/g, ', ')}"`,
        },
      }))
    else
      peer.send(JSON.stringify({
        type: 'system',
        data: {
          message: 'No channels subscribed',
        },
      }))

    wsHooks.hook('notifications', (...messages) => {
      for (const message of messages) {
        publishToAll(peer, message.type, message, { compress: true })
      }
    })
  },

  async message(peer, message) {
    const channels = getChannels(peer.websocket.url)
    const validated = v.safeParse(v.object({ type: v.picklist(channels), data: v.any() }), message.json())
    if (validated.success) {
      logger.info('`ws [message]`:', peer.id, message.text())
      peer.publish(validated.output.type, JSON.stringify(validated.output), { compress: true })
    }
  },

  async close(peer) {
    peer.unsubscribe('system')
    const channels = getChannels(peer.websocket.url)
    channels.forEach((channel) => {
      peer.unsubscribe(channel)
    })
    logger.info('`ws [close]`:', peer.id)
  },
})

function getChannels(url?: string) {
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

function publishToAll(
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
    logger.info('Publishing message by peer:', firstPeer.id)
    firstPeer.send(message, options)
    firstPeer.publish(topic, message, options)
  }
}
