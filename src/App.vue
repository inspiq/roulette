<script setup lang="ts">
import RouletteAnalyzer from '@/components/roulette/RouletteAnalyzer.vue';
</script>

<template>
  <div id="app">
    <RouletteAnalyzer />
  </div>
</template>

<style lang="scss">
#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 1rem 0;
}
</style>
