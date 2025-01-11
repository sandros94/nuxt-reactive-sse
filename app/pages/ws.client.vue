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
          <ProsePre>
            <ProseCode v-if="states['chat']">
              {{ JSON.stringify(states['chat'].value, null, 2) }}
            </ProseCode>
            <br>
            <ProseCode v-if="states['test:2']">
              {{ JSON.stringify(states['test:2'].value, null, 2) }}
            </ProseCode>
            <br>
            <ProseCode v-if="states['notifications']">
              {{ JSON.stringify(states['notifications'].value, null, 2) }}
            </ProseCode>
            <br>
            <ProseCode v-if="states['_internal']">
              {{ JSON.stringify(states['_internal'].value, null, 2) }}
            </ProseCode>
            <br>
          </ProsePre>
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
const items = ['notifications', 'chat', 'test:2']
const channels = ref<string[]>(['notifications'])
const menuOpen = ref(false)

const { states, data, status, send, open } = useReactiveWS<{
  'chat': string
  'test:2': string
  'notifications': string
  '_internal': {
    channels: string[]
    message?: string
  }
}>(channels)

const history = ref<string[]>([])
watch(data, (newValue) => {
  history.value.push(`server: ${newValue}`)
})

const message = ref<string>('')
function sendData() {
  if (status.value !== 'OPEN' || !channels.value.includes('chat')) return
  history.value.push(`client: ${message.value}`)
  send(JSON.stringify({
    channel: 'chat',
    data: {
      message: message.value,
    },
  }))
  message.value = ''
}
</script>
