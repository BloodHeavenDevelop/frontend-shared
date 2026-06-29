<script setup lang="ts">
import type { ToastType } from '../ToastsContainer/composables';

interface Props {
  delay?: number;
  manual?: boolean;
  type?: ToastType;
  noProgress?: boolean;
  noBorder?: boolean;
  loader?: {
    show: boolean;
    color: string;
  };
  icon?: {
    name: string;
    color: string;
  };
}

interface Emits {
  (event: 'close'): void;
}

const emit = defineEmits<Emits>();

const props = defineProps<Props>();

const slots = useSlots() as Record<string, any>;

const onClose = () => {
  emit('close');
};

const isAutoDismiss = computed(() => !!props.delay && !props.manual && props.type !== 'error');

if (isAutoDismiss.value) {
  useTimeoutFn(onClose, props.delay as number);
}

watch(
  () => [props.delay, props.manual, props.type],
  () => {
    if (isAutoDismiss.value) {
      useTimeoutFn(onClose, props.delay as number);
    }
  },
);
</script>

<template>
  <div
    class="overflow-hidden relative py-3 pl-4 pr-10 rounded-[8px] just-toast flex gap-2.5 items-start min-w-[280px] max-w-[420px] bg-hm-surface text-hm-text border border-hm-border pointer-events-auto font-mono"
    :class="{
      'border-l-[3px] border-l-hm-ok': !noBorder && type === 'success',
      'border-l-[3px] border-l-hm-error': !noBorder && type === 'error',
      'border-l-[3px] border-l-hm-warning': !noBorder && type === 'warning',
      'border-l-[3px] border-l-hm-accent': !noBorder && !type,
    }"
  >
    <button
      type="button"
      class="absolute top-3 right-3 p-0 m-0 bg-transparent border-0 cursor-pointer text-hm-muted hover:text-hm-text"
      aria-label="Close"
      @click.stop="onClose"
    >
      <UiAppIcon
        class="h-[18px] w-[18px]"
        name="x-mark"
      />
    </button>

    <div
      v-if="!noProgress && isAutoDismiss"
      class="absolute bottom-0 left-0 w-full h-1 overflow-hidden"
    >
      <div
        class="toast-progress h-full w-full"
        :class="{
          'bg-hm-ok': type === 'success',
          'bg-hm-error': type === 'error',
          'bg-hm-warning': type === 'warning',
          'bg-hm-accent': !type,
        }"
        :style="{ animationDuration: delay ? `${delay}ms` : undefined }"
      />
    </div>
    <UiAppIcon
      v-if="icon?.name"
      class="w-4 h-4 shrink-0 mt-0.5"
      :name="icon.name"
      :color="icon.color"
    />
    <UiCircularLoader
      v-if="loader?.show"
      class="text-[24px]"
      :style="{ color: loader.color }"
    />
    <div
      v-if="slots.title || slots.description"
      class="flex flex-col gap-1 toast-content min-w-0"
    >
      <span
        v-if="slots.title"
        class="text-[13px] font-semibold"
        ><slot name="title"
      /></span>
      <span
        v-if="slots.description"
        class="text-[12px]"
        ><slot name="description"
      /></span>
    </div>

    <div
      v-if="slots.default"
      class="mt-4"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.toast-progress {
  animation-name: hm-fill-in;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
</style>
