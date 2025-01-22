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
            <div class="inline-flex space-x-4">
              <UButton
                v-if="!loggedIn"
                to="/api/auth/github"
                icon="i-simple-icons-github"
                label="Login with GitHub"
                external
              />
              <UButton
                v-else
                icon="i-simple-icons-github"
                label="Logout"
                color="neutral"
                variant="ghost"
                @click.prevent="logout()"
              />
              <UButton
                to="https://github.com/sandros94/nuxt-reactive-ws"
                label="Source"
                target="_blank"
                icon="i-simple-icons-github"
                color="neutral"
                variant="link"
                external
              />
            </div>
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
              :key="c.peerId"
              class="fixed z-50 group/cursor"
              :style="{
                transform: `translate(${Math.min(Math.max(c.x * width, 0), width - 20)}px, ${Math.min(Math.max(c.y * height, 0), height - 20)}px)`,
                transition: 'transform 0.1s ease-out',
              }"
            >
              <div v-if="c.peerId !== _internal?.id" class="relative pointer-events-auto">
                <UIcon
                  name="i-lucide-mouse-pointer-2"
                />
                <div v-if="c.login" :text="c.login" class="absolute top-4 left-3">
                  <UAvatar
                    v-if="c.avatar_url"
                    :src="c.avatar_url"
                  />
                  <p class="absolute -translate-x-1/4 opacity-0 transition-opacity group-hover/cursor:opacity-100">
                    {{ c.login }}
                  </p>
                </div>
              </div>
            </span>
          </div>
        </div>
      </UCard>
    </UContainer>
  </UApp>
</template>

<script setup lang="ts">
import type { ToastProps } from '#ui/types'

const { loggedIn, clear } = useUserSession()
const { states, status, send, open } = useWS<{
  cursors: {
    peerId: string
    login?: string
    avatar_url?: string
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
    user?: {
      login: string
      avatar_url: string
    }
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

async function logout() {
  await clear()
    .then(() => {
      reloadNuxtApp()
    })
}
</script>

<style scoped>
.cursor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  pointer-events: none;
}
</style>
