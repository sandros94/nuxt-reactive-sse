export default defineEventHandler(() => {
  // The `all` hook is a special hook that can be used
  // to send messages to any channel. Use with caution.
  wsHooks.callHook('all', {
    channel: 'notifications',
    data: {
      title: 'Server',
      message: 'WebSocket is up and running!',
    },
  })

  return { success: true }
})
