<script setup lang="ts">
const availableStates = ['pizza', 'burger']
const selectedState = ref<string[]>([])

const availablePizzas = ['capricciosa', 'margerita']
const availableBurgers = ['cheese', 'veggie']

const states = useMultiState(selectedState)
</script>

<template>
  <div>
    Test MultiState
    <USelectMenu v-model="selectedState" :items="availableStates" multiple class="w-48" />
    <br>
    <div v-if="selectedState?.includes('pizza') && states['pizza']">
      Pick a pizza
      <USelectMenu v-model="(states['pizza'].value as string)" :items="availablePizzas" class="w-48" />
      <Pizza />
    </div>
    <div v-else>
      Pizza is {{ typeof states['pizza'] }}
    </div>
    <div v-if="selectedState?.includes('burger') && states['burger']">
      Pick a burger
      <USelectMenu v-model="(states['burger'].value as string)" :items="availableBurgers" class="w-48" />
      <Burger />
    </div>
    <div v-else>
      Burger is {{ typeof states['Burger'] }}
    </div>
  </div>
</template>
