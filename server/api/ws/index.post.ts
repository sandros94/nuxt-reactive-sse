export default defineEventHandler(async (event) => {
  const body = await useValidatedBody(event,
    v.optional(
      v.object({ channel: v.string(), data: v.optional(v.any(), randomUUID()) }),
      { channel: '_internal', data: randomUUID() },
    ),
  )

  wsHooks.callHookParallel('all', body)
  return { success: true }
})
