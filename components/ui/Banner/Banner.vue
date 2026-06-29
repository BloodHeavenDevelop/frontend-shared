<script setup lang="ts">
import type { BannerVariant } from '../Banner/types';

interface Props {
  variant?: BannerVariant;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  variant: 'info',
  icon: undefined,
});
</script>

<template>
  <div
    class="hm-banner"
    :class="[`hm-banner--${variant}`]"
    role="alert"
  >
    <ClientOnly>
      <UiAppIcon
        v-if="icon"
        :name="icon"
        class="w-4 h-4 shrink-0 mt-0.5"
      />
    </ClientOnly>
    <div class="flex-1 min-w-0">
      <slot />
    </div>
  </div>
</template>
