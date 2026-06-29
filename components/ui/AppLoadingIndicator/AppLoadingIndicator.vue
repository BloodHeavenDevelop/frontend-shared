<script setup lang="ts">
const loading = useLoadingIndicator().isLoading;
</script>

<template>
  <div
    v-show="loading"
    class="hm-app-loader"
  >
    <div class="hm-app-loader__bar" />
  </div>
</template>

<style scoped>
.hm-app-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  z-index: 100;
  pointer-events: none;
}

.hm-app-loader__bar {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, var(--hm-accent), var(--hm-purple));
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  transition:
    width 0.2s ease-out,
    opacity 0.3s;
}
</style>
