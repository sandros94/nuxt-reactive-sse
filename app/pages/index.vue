<template>
  <UContainer>
    <UCard>
      <template #header>
        <div v-if="status === 'OPEN'">
          <p v-if="session">
            <strong>Session users:</strong> {{ session.users }}
          </p>
        </div>
        <div v-else>
          <p>Connection status: {{ status }}</p>
        </div>
        <UAlert
          v-if="sourceType === 'touch'"
          title="Touch device detected"
          description="This demo is optimized for mouse input"
          color="error"
        />
      </template>
      <UButton
        v-if="status === 'CLOSED'"
        trailing-icon="i-lucide-refresh-cw"
        label="Reconnect"
        @click.prevent="open()"
      />
      <UCard v-else>
        <ProsePre>
          {{ _internal }}
        </ProsePre>
        <Teleport to="body">
          <span
            v-for="c of cursors"
            :key="c.user"
            class="absolute overflow-hidden"
            :style="{
              transform: `translate(${c.x * width}px, ${c.y * height}px)`,
              transition: 'transform 0.1s ease-out',
            }"
          >
            <UIcon
              v-if="c.user !== _internal?.id"
              name="i-lucide-mouse-pointer-2"
            />
          </span>
        </Teleport>
      </UCard>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
import type { ToastProps } from '#ui/types'

const { states, status, _send, open } = useWS<{
  cursors: {
    user: string
    x: number
    y: number
  }[]
  session: {
    users: number
  }
  notifications: {
    title: string
    description: string
    color: ToastProps['color']
  }
  _internal: {
    id: string
    channels: string[]
    message?: string
  }
}>(['cursors'])

// We can safely destructure them because they are
// all statically defined here or in `nuxt.config.ts`
const { _internal, notifications, session, cursors } = states

const { width, height } = useWindowSize()
const { x, y, sourceType } = useMouse({ touch: false })
watch([x, y], () => {
  if (sourceType.value === 'mouse') {
    // Using `_send` because currently `send` only accepts sending messages to channels
    _send(JSON.stringify({
      x: x.value / width.value,
      y: y.value / height.value,
    }))
  }
})

watch(notifications, () => {
  if (!notifications.value) return
  useToast().add({
    title: notifications.value.title,
    description: notifications.value.description,
    color: notifications.value.color,
    duration: 5000,
  })
})
</script>
