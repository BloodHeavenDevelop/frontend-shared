<script setup lang="ts">
import Toast from '../Toast/Toast.vue';
import { useToasts } from '../ToastsContainer/composables';
import { toastLines } from '../ToastsContainer/toast-lines';

const { toasts, remove } = useToasts();
</script>
<template>
  <!-- `hm-toasts` is the hook the design system uses to re-anchor the stack above
       the mobile tab bar (mobility § M15); desktop geometry stays in the utilities. -->
  <div
    class="hm-toasts fixed bottom-6 right-6 flex flex-col-reverse gap-2 z-[100] w-full max-w-[420px] pointer-events-none"
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
          ><p class="text-hm-text text-[13px] font-semibold">
            <template
              v-for="(line, index) in toastLines(toast.title)"
              :key="index"
              ><br v-if="index > 0" />{{ line }}</template
            >
          </p>
        </template>
        <template
          v-if="toast.description"
          #description
          ><p>
            <template
              v-for="(line, index) in toastLines(toast.description)"
              :key="index"
              ><br v-if="index > 0" />{{ line }}</template
            >
          </p></template
        >
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
