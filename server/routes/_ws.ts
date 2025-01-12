export default useWebSocketHandler({
  async open(peer, { channels }) {
    // Subscribe users to requested channels and init data from KV
    for (const channel of channels) {
      peer.subscribe(channel)
      const data = await useKV('ws').getItem(channel)
      if (data)
        peer.send(JSON.stringify({ channel, data }), { compress: true })
    }

    // Send `_internal` communications
    const activeChannels = Array.from(peer['_topics'])
    peer.send(JSON.stringify({
      channel: '_internal',
      data: {
        connectionId: peer.id,
        channels: activeChannels,
        message: activeChannels.length
          ? `Subscribed to ${activeChannels.length} channels`
          : 'Not subscribed to any channel',
      },
    }), { compress: true })

    // Update everyone's session metadata
    const data = JSON.stringify({ channel: 'session', data: { users: peer.peers.size } })
    peer.send(data, { compress: true })
    peer.publish('session', data, { compress: true })
  },

  async message(peer, message) {
    // Validate the incoming message
    const parsedMessage = v.safeParse(
      v.object({
        channel: v.string(),
        data: v.any(),
      }),
      message.json(),
    )
    if (!parsedMessage.success) return
    const kv = useKV('ws')
    const { channel, data } = parsedMessage.output

    // Update data from the KV (or init it)
    const _data = await kv.getItem<Record<string, string>>(channel) || {}
    const newData = { ..._data, ...data }
    await kv.setItem(channel, newData)

    // Update everyone else with the new data
    peer.publish(
      channel,
      JSON.stringify({
        channel,
        data: newData,
      }),
      { compress: true },
    )
  },

  close(peer) {
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
  },
})
