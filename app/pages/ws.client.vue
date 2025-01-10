<template>
  <UContainer>
    <UButton to="/" label="Home" variant="link" />
    <UButton to="/sse" label="SSE" variant="link" />
    <UCard class="mt-10">
      <div>
        <div>
          Channels:
          <UButtonGroup>
            <USelectMenu
              v-model="channels"
              v-model:open="menuOpen"
              :items
              multiple
              class="w-48"
            />
            <UButton
              v-if="status === 'CLOSED'"
              trailing-icon="i-lucide-refresh-cw"
              @click.prevent="open()"
            />
          </UButtonGroup>
        </div>
        <UButtonGroup>
          Send chat message:
          <UInput v-model="message" :disabled="!channels.includes('chat')" />
          <UButton
            :disabled="!channels.includes('chat')"
            :color="!channels.includes('chat') ? 'neutral' : 'primary'"
            @click.prevent="sendData"
          >
            <span v-if="channels.includes('chat')">Send</span>
            <span v-else class="line-through decoration-1">Send</span>
          </UButton>
        </UButtonGroup>
        <UCard>
          <p>Status: {{ status }}</p>
          <p>Updates</p>
          <ProseUl>
            <ProseLi v-for="(item, index) of history" :key="index">
              <code>{{ item }}</code><br>
            </ProseLi>
          </ProseUl>
        </UCard>
      </div>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import { joinURL, withProtocol, withQuery } from 'ufo'

const items = ['notifications', 'chat', 'test:2']
const channels = ref<string[]>(['notifications'])
const menuOpen = ref(false)

const reqUrl = useRequestURL()
const _url = reqUrl.protocol === 'https:'
  ? withProtocol(joinURL(reqUrl.origin, '_ws'), 'wss://')
  : withProtocol(joinURL(reqUrl.origin, '_ws'), 'ws://')
const url = computed(() => {
  return withQuery(_url, { channels: channels.value })
})
const { status, data, send, open, close } = useWebSocket(url, {
  onMessage(_, message) {
    logger.info('message', message.data)
  },
  autoConnect: false,
})

const urlBuffer = ref<string>()
watch(
  menuOpen,
  (isOpen) => {
    if (isOpen) {
      urlBuffer.value = url.value
      return
    }
    else if (!isOpen && urlBuffer.value !== url.value) {
      close()
      setTimeout(() => open(), 100)
      urlBuffer.value = undefined
    }
  },
  { immediate: false },
)

const history = ref<string[]>([])
watch(data, (newValue) => {
  history.value.push(`server: ${newValue}`)
})

const message = ref<string>('')
function sendData() {
  if (status.value !== 'OPEN' || !channels.value.includes('chat')) return
  history.value.push(`client: ${message.value}`)
  send(JSON.stringify({
    type: 'chat',
    data: {
      message: message.value,
    },
  }))
  message.value = ''
}
</script>
