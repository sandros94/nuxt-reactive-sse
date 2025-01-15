export default useWebSocketHandler({
  async open(peer, { channels }) {
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
    const cursors = await updateCursor(peer.id, parsedMessage.output.x, parsedMessage.output.y)
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
})

// Cursors utility functions

interface Cursors {
  [user: string]: { x: number, y: number }
}

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
