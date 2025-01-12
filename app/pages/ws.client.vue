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
            <ProseCode v-if="session">
              {{ session }}
            </ProseCode>
            <br>
            <ProseCode v-if="_internal">
              {{ _internal }}
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
const items = ['notifications', 'chat']
const channels = ref<string[]>(['notifications'])

const { states, data, status, send, open } = useWS<{
  notifications: {
    message: string
  }
  chat: {
    [key: string]: string
  }
  session: {
    users: number
  }
  _internal: {
    connectionId: string
    channels: string[]
    message?: string
  }
}>(channels)

const { _internal, session } = states

const history = ref<string[]>([])
watch(data, (newValue) => {
  history.value.push(`server: ${newValue}`)
})

const message = ref<string>('')
function sendData() {
  if (
    !message.value
    || !_internal.value?.connectionId
    || status.value !== 'OPEN'
    || !channels.value.includes('chat')
  ) return

  states['chat'].value = {
    ...states['chat'].value,
    [_internal.value.connectionId]: message.value,
  }

  history.value.push(`client: ${JSON.stringify({ channel: 'chat', data: states['chat'].value })}`)
  send('chat', states['chat'].value)
  message.value = ''
}
</script>
