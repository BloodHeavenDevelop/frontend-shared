<script setup lang="ts">
import Toast from '../Toast/Toast.vue';
import { useToasts } from '../ToastsContainer/composables';

const { toasts, remove } = useToasts();
</script>
<template>
  <div
    class="fixed bottom-6 right-6 flex flex-col-reverse gap-2 z-[100] w-full max-w-[420px] pointer-events-none"
  >
    <TransitionGroup name="list">
      <component
        :is="toast.customComponent ?? Toast"
        v-for="toast in toasts"
        :key="toast.id"
        :delay="toast.delay"
        :is-visible="true"
        :manual="toast.manual"
        :no-progress="toast.noProgress"
        :no-border="toast.noBorder"
        :icon="toast.icon"
        :loader="toast.loader"
        :type="toast.type"
        @close="remove(toast.id)"
      >
        <template
          v-if="toast.title"
          #title
          ><p
            class="text-hm-text text-[13px] font-semibold"
            v-html="toast.title"
          />
        </template>
        <template
          v-if="toast.description"
          #description
          ><p v-html="toast.description"
        /></template>
      </component>
    </TransitionGroup>
    <div
      id="toasts-container"
      class="flex flex-col-reverse gap-2"
    />
  </div>
</template>
<style scoped>
.list-enter-active,
.list-leave-active {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
