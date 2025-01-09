import { randomUUID } from 'uncrypto'

export default defineEventHandler(async (event) => {
  const body = await useValidatedBody(event,
    v.optional(
      v.record(v.string(), v.optional(v.string(), randomUUID())),
      { global: randomUUID() },
    ),
  )

  for (const item in body) {
    await useKV('sse').setItem(item, body[item])
  }

  return { success: true }
})
