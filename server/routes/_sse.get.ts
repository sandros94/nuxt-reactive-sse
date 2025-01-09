export default defineEventHandler(async (event) => {
  const { id } = await useValidatedQuery(event, v.object({
    id: v.optional(v.union([v.string(), v.array(v.string())])),
  }))
  const _id = Array.isArray(id) ? id : [id]
  const stream = createEventStream(event)
  const kv = useKV('sse')

  const unwatch = kv.watch(async (action, _key) => {
    const key = d(_key)
    if (!key) return
    logger.log('SSE', action, key)

    if (action === 'update' && key === 'global') {
      const data = await kv.getItem(key)
      await stream.push(JSON.stringify(data))
      return
    }
    else if (action === 'remove' && key === 'global') {
      await stream.push(JSON.stringify(null))
      return
    }

    const isId = _id.some(i => i === key)
    if (action === 'update' && isId) {
      const data = await kv.getItem(key)
      stream.push({ event: key, data: JSON.stringify(data) })
    }
    if (action === 'remove' && isId) {
      stream.push({ event: key, data: JSON.stringify(null) })
    }
  })

  const data = await kv.getItem('global')
  const init = []
  for (const key of _id) {
    if (!key) continue
    const value = await kv.getItem(key)
    init.push({ event: key, data: JSON.stringify(value) })
  }
  stream.push([
    { data: JSON.stringify(data) },
    ...init,
  ])

  stream.onClosed(async () => {
    await unwatch
      .then(() => logger.info('SSE closed'))
  })

  return stream.send()
})

// `useKV` is based on Nuxt's `CACHE`
const DEFAULT_GLOBAL_BASE = /^CACHE:sse:/
const d = (key: string) => key.match(DEFAULT_GLOBAL_BASE)
  ? key.replace(DEFAULT_GLOBAL_BASE, '')
  : null
