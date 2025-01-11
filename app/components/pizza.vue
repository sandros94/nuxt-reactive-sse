<script setup lang="ts">
const { pizza } = useMultiState<{
  pizza: string
}>(['pizza'])
</script>

<template>
  <p>{{ pizza || 'No Pizza available' }}</p>
</template>
