import { consola } from 'consola'

const logger = consola.create({}).withTag('WS')

export default useWebSocketHandler({
  async open(peer, { channels }) {
    logger.log('New connection:', peer.id)
    const session = await getUserSession(peer)
    const _user = session.user
      ? { login: session.user.login, avatar_url: session.user.avatar_url }
      : undefined

    // Subscribe users to requested channels (those not defined in `nuxt.config.ts`)
    for (const channel of channels) {
      peer.subscribe(channel)
    }

    // Send `_internal` communications
    const activeChannels = Array.from(peer['_topics'])
    peer.send(JSON.stringify({
      channel: '_internal',
      data: {
        id: peer.id,
        channels: activeChannels,
        message: activeChannels.length
          ? `Subscribed to ${activeChannels.length} channels`
          : 'Not subscribed to any channel',
        user: _user,
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
    const sessionData = JSON.stringify({ channel: 'session', data: { users: peer.peers.size } })
    peer.send(sessionData, { compress: true })
    peer.publish('session', sessionData, { compress: true })
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
    const session = await getUserSession(peer)

    // Update the cursor position
    const cursors = await updateCursor(
      peer.id,
      parsedMessage.output.x,
      parsedMessage.output.y,
      session.user,
    )
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
    logger.log('Connection closed:', peer.id)

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
    const cursors = await deleteCursor(peer.id)
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

  error(peer, error) {
    logger.error('Peer', peer.id, 'connection error:', error)
  },
})

// Cursors utility functions

interface Cursors {
  [peerId: string]: { x: number, y: number, avatar_url?: string, login?: string }
}

async function getCursors() {
  return useStorage('ws').getItem<Cursors>('cursors')
}

async function updateCursor(peerId: string, x: number, y: number, user?: User) {
  const storage = useStorage('ws')
  const { avatar_url, login } = user || {}

  const cursors = await storage.getItem<Cursors>('cursors') || {}
  cursors[peerId] = { x, y, avatar_url, login }
  await storage.setItem('cursors', cursors)

  return cursors
}

async function deleteCursor(peerId: string) {
  const storage = useStorage('ws')

  const cursors = await storage.getItem<Cursors>('cursors') || {}
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete cursors[peerId]
  await storage.setItem('cursors', cursors)

  return cursors
}

function getArrayFromCursors(cursors: Cursors) {
  const map = new Map(Object.entries(cursors))
  return Array.from(map,
    ([peerId, { x, y, login, avatar_url }]) => ({ peerId, x, y, login, avatar_url }),
  )
}
