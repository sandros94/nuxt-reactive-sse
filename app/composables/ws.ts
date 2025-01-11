import type { UseWebSocketOptions } from '@vueuse/core'
import { joinURL, withProtocol, withQuery } from 'ufo'
import { destr } from 'destr'

import type { MaybeRefOrGetter } from '#imports'
import { toRef, useMultiState } from '#imports'
import { merge } from '#lab/utils'

const stateKeyPrefix = ':ws:'
const reservedChannels = ['data', 'status', 'send', '_send', 'open', 'close', 'ws']

interface WSConfig extends UseWebSocketOptions {
  query?: Record<string, any>
}

interface WSMessage<T extends Record<string, any>> {
  channel: keyof T
  data: T[keyof T]
}

export const useWSState = useMultiState

// TODO: add runtimeConfig channel types for auto-completion
export function useWS<T extends Record<string, any>>(channels: MaybeRefOrGetter<string[]>, options?: WSConfig) {
  const wsConfig = useRuntimeConfig().public.ws
  const { query, ...opts } = options || {}
  const _channels = toRef(channels)

  // Check if any channel has a reserved name
  _channels.value.forEach((channel) => {
    if (reservedChannels.includes(channel))
      throw createError({
        message: `[useWS] Channel name "${channel}" is reserved`,
        status: 400,
        fatal: true,
      })
  })

  const mergedChannels = computed(() => merge(wsConfig.channels.internal, [...wsConfig.channels.defaults, ..._channels.value]))
  watchEffect(() => {
    logger.log('[useWS] mergedChannels:', mergedChannels.value)
  })
  const states = useWSState<T>(mergedChannels, { prefix: stateKeyPrefix })

  const _query = reactive({
    ...query,
    channels: _channels,
  })
  const reqUrl = useRequestURL()
  const path = joinURL(reqUrl.origin, wsConfig.path)
  const url = computed(() => {
    return withQuery(
      reqUrl.protocol === 'https:'
        ? withProtocol(path, 'wss://')
        : withProtocol(path, 'ws://'),
      _query,
    )
  })

  const {
    status,
    data,
    send: _send,
    open,
    close,
    ws,
  } = useWebSocket(url, {
    ...opts,
    onMessage(_, message) {
      const parsed = destr<WSMessage<T>>(message.data)
      if (!!parsed && typeof parsed === 'object' && 'channel' in parsed && 'data' in parsed)
        states[parsed.channel].value = parsed.data

      opts?.onMessage?.(_, message)
    },
    autoConnect: false,
  })

  function send<_T extends WSMessage<T>>(channel: _T['channel'], data: _T['data']) {
    return _send(JSON.stringify({ channel, data }))
  }

  if (opts?.autoConnect !== false)
    watch(url, () => {
      close()
      setTimeout(() => open(), 100)
    })

  return {
    states,
    data,
    status,
    send,
    _send,
    open,
    close,
    ws,
  }
}
