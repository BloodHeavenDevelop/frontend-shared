<script setup lang="ts">
import type { BadgeVariant } from '../Badge/types';

interface Props {
  variant?: BadgeVariant;
}

withDefaults(defineProps<Props>(), {
  variant: 'custom',
});
</script>

<template>
  <span
    class="hm-badge"
    :class="[`hm-badge--${variant}`]"
  >
    <slot />
  </span>
</template>
