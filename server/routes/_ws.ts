import type { Peer } from 'crossws'

interface Cursors {
  [user: string]: { x: number, y: number }
}

export default useWebSocketHandler({
  async open(peer, { channels }) {
    // Ensure the user is uniquely identified
    const user = await getUserId(peer)
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

    // Send the current cursors to the user
    const cursors = await getCursors() || {}
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

    // Update the cursor position
    const user = (await getUserId(peer))!
    const cursors = await updateCursor(user, parsedMessage.output.x, parsedMessage.output.y)
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

    // Remove the user from the active cursors and notify
    const user = (await getUserId(peer))!
    const cursors = await deleteCursor(user)
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

// User utility functions

async function getUserId(peer: Peer) {
  const storage = useStorage('ws')

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

// Cursors utility functions

async function getCursors() {
  return useStorage('ws').getItem<Cursors>('cursors')
}

async function updateCursor(user: string, x: number, y: number) {
  const storage = useStorage('ws')

  const cursors = await storage.getItem<Cursors>('cursors') || {}
  cursors[user] = { x, y }
  await storage.setItem('cursors', cursors)

  return cursors
}

async function deleteCursor(user: string) {
  const storage = useStorage('ws')

  const cursors = await storage.getItem<Cursors>('cursors') || {}
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete cursors[user]
  await storage.setItem('cursors', cursors)

  return cursors
}

function getArrayFromCursors(cursors: Cursors) {
  const map = new Map(Object.entries(cursors))
  return Array.from(map, ([user, { x, y }]) => ({ user, x, y }))
}
