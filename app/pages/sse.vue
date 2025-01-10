<template>
  <UContainer>
    <UButton to="/" label="Home" variant="link" />
    <UButton to="/ws" label="WS" variant="link" />
    <UCard class="mt-10">
      <UAlert
        v-if="error"
        title="Error"
        description="An error occurred while connecting"
        variant="outline"
        color="error"
      />
      <div v-else>
        <UButtonGroup>
          <USelectMenu v-model="value" :items multiple class="w-36" />
          <UInput v-model="message" />
          <UButton label="Send" @click.prevent="sendData" />
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
import { joinURL, withQuery } from 'ufo'

const url = withQuery(joinURL(useRequestURL().origin, '_sse'), {
  id: ['messages', 'users'],
})
const { status, event, data, error, close } = useEventSource(url, ['messages', 'users'])

const history = ref<string[]>([])
watch(data, (newValue) => {
  history.value.push(`${event.value || 'global'}: ${newValue}`)
})

onBeforeRouteLeave(() => {
  close()
})
onBeforeUnmount(() => {
  close()
})

const items = ref(['global', 'messages', 'users'])
const value = ref<string[]>([])
const message = ref<string>()
async function sendData() {
  const body: Record<string, string | undefined> = {}
  for (const key of value.value) {
    body[key] = message.value
  }
  logger.log('Sending', JSON.stringify(body, null, 2))
  await $fetch('/api/sse', {
    method: 'POST',
    body,
  })
  message.value = ''
}
</script>
