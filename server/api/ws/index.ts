export default defineEventHandler(() => {
  // The `all` hook is a special hook that can be used
  // to send messages to any channel. Use with caution.
  wsHooks.callHook('all', {
    channel: 'notifications',
    data: {
      message: 'WS is up and running',
    },
  })
})
