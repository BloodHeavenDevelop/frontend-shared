<script setup lang="ts">
import type { CheckboxVariant } from './types';

// DESIGN_MANIFEST.md § 13.6 — a form checkbox, committed on submit. A toggle
// (`<UiToggle>`, § 13.1) is for a setting that applies the moment it is flipped.
withDefaults(
  defineProps<{
    label: string;
    /** Helper line rendered under the label, aligned with it. */
    hint?: string;
    /** `warning` colors the label/box in the caution token — for flags that put
     *  the entity into a degraded or holding state (e.g. maintenance). */
    variant?: CheckboxVariant;
    disabled?: boolean;
  }>(),
  { hint: undefined, variant: 'default', disabled: false },
);

const model = defineModel<boolean>({ default: false });
</script>

<template>
  <label
    class="hm-check"
    :class="{ 'hm-check--warning': variant === 'warning' }"
  >
    <input
      v-model="model"
      type="checkbox"
      class="hm-check__input"
      :disabled="disabled"
    />
    <span class="hm-check__label">{{ label }}</span>
    <span
      v-if="hint"
      class="hm-check__hint"
      >{{ hint }}</span
    >
  </label>
</template>
