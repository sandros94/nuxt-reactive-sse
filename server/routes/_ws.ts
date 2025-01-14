import type { Storage } from 'unstorage'
import type { Peer } from 'crossws'

interface Cursors {
  [user: string]: { x: number, y: number }
}

export default useWebSocketHandler({
  async open(peer, { channels }) {
    const cache = useStorage('ws')
    const user = await getUserId(cache, peer)
    if (!user) {
      logger.error('Unable to uniquely identify user', { ip: peer.remoteAddress })
      peer.close(4008, 'Unable to uniquely identify user')
      return
    }

    // Subscribe users to requested channels (those not defined in `nuxt.config.ts`)
    for (const channel of channels) {
      peer.subscribe(channel)
    }

    // Send `_internal` communications
    const activeChannels = Array.from(peer['_topics'])
    peer.send(JSON.stringify({
      channel: '_internal',
      data: {
        id: user,
        channels: activeChannels,
        message: activeChannels.length
          ? `Subscribed to ${activeChannels.length} channels`
          : 'Not subscribed to any channel',
      },
    }), { compress: true })

    // Send the current cursor positions
    const cursors = await cache.getItem<Cursors>('cursors') || {}

    // Update everyone else
    peer.send(
      JSON.stringify({
        channel: 'cursors',
        data: getArrayFromCursors(cursors),
      }),
      { compress: true },
    )

    // Update everyone's `session` state and notify
    const data = JSON.stringify({ channel: 'session', data: { users: peer.peers.size } })
    peer.send(data, { compress: true })
    peer.publish('session', data, { compress: true })
    peer.publish(
      'notifications',
      JSON.stringify({
        channel: 'notifications',
        data: {
          title: 'New connection',
          description: 'A new user has joined the session',
          color: 'info',
        },
      }),
      { compress: true },
    )
  },

  async message(peer, message) {
    // Validate the incoming message
    const parsedMessage = v.safeParse(
      v.object({
        x: v.number(),
        y: v.number(),
      }),
      message.json(),
    )
    if (!parsedMessage.success) return
    const cache = useStorage('ws')
    const user = (await getUserId(cache, peer))!

    // Update the cursor position
    const cursors = await cache.getItem<Cursors>('cursors') || {}
    cursors[user] = parsedMessage.output

    // Update everyone else
    cache.setItem('cursors', cursors)
    peer.publish(
      'cursors',
      JSON.stringify({
        channel: 'cursors',
        data: getArrayFromCursors(cursors),
      }),
      { compress: true },
    )
  },

  async close(peer) {
    peer.publish(
      'session',
      JSON.stringify({
        channel: 'session',
        data: {
          users: peer.peers.size,
        },
      }),
      { compress: true },
    )

    // Remove the user from lists
    const cache = useStorage('ws')
    const user = (await getUserId(cache, peer))!
    const cursors = await cache.getItem<Cursors>('cursors') || {}
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete cursors[user]

    // Update everyone else
    cache.setItem('cursors', cursors)
    peer.publish(
      'cursors',
      JSON.stringify({
        channel: 'cursors',
        data: getArrayFromCursors(cursors),
      }),
      { compress: true },
    )
    peer.publish(
      'notifications',
      JSON.stringify({
        channel: 'notifications',
        data: {
          title: 'Connection closed',
          description: 'A user has left the session',
          color: 'warning',
        },
      }),
      { compress: true },
    )
  },
})

async function getUserId(storage: Storage, peer: Peer) {
  if (import.meta.dev) {
    const ip = peer.id
    const id = await storage.getItem<string>(ip)
    if (id) return id

    const newId = randomUUID()
    await storage.setItem(ip, newId)

    return newId
  }
  if (!peer.remoteAddress) return

  const id = await storage.getItem<string>(peer.remoteAddress)
  if (id) return id

  const newId = randomUUID()
  await storage.setItem(peer.remoteAddress, newId)

  return newId
}

function getArrayFromCursors(cursors: Cursors) {
  const map = new Map(Object.entries(cursors))
  return Array.from(map, ([user, { x, y }]) => ({ user, x, y }))
}
