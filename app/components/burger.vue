<script setup lang="ts">
const { burger } = useMultiState<{
  burger: string
}>(['burger'])
</script>

<template>
  <p>{{ burger || 'No Burger available' }}</p>
</template>
