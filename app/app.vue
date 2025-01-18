<template>
  <UApp>
    <UContainer>
      <UCard class="mt-1">
        <template #header>
          <div class="inline-flex justify-between w-full">
            <div v-if="status === 'OPEN'">
              <p v-if="session">
                <strong>Session users:</strong> {{ session.users }}
              </p>
            </div>
            <div v-else>
              <p>Connection status: {{ status }}</p>
            </div>
            <UButton
              to="https://github.com/sandros94/nuxt-reactive-ws"
              target="_blank"
              icon="i-simple-icons-github"
              color="neutral"
              variant="link"
            />
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
        <div v-else>
          <ProsePre>
            {{ _internal }}
          </ProsePre>
          <div class="cursor-container">
            <span
              v-for="c of cursors"
              :key="c.user"
              class="fixed z-50"
              :style="{
                transform: `translate(${Math.min(Math.max(c.x * width, 0), width - 20)}px, ${Math.min(Math.max(c.y * height, 0), height - 20)}px)`,
                transition: 'transform 0.1s ease-out',
                pointerEvents: 'none',
              }"
            >
              <UIcon
                v-if="c.user !== _internal?.id"
                name="i-lucide-mouse-pointer-2"
              />
            </span>
          </div>
        </div>
      </UCard>
    </UContainer>
  </UApp>
</template>

<script setup lang="ts">
import type { ToastProps } from '#ui/types'

const { states, status, send, open } = useWS<{
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
    send({
      x: x.value / width.value,
      y: y.value / height.value,
    })
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

<style scoped>
.cursor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  overflow: hidden;
}
</style>
