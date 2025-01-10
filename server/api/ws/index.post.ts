export default defineEventHandler(async (event) => {
  const body = await useValidatedBody(event,
    v.optional(
      v.record(v.string(), v.optional(v.string(), randomUUID())),
      { global: randomUUID() },
    ),
  )
  const _body = Object.keys(body)
    .map(key => ({ type: key, data: body[key] }))

  wsHooks.callHookParallel('notifications', ..._body)
  return { success: true }
})
