<script setup lang="ts">
// DESIGN_MANIFEST.md § 13.1–13.2 — a two-state switch for a setting that takes
// effect immediately. Label left, switch right, the whole row clickable. The real
// control is a visually hidden checkbox with `role="switch"`, so keyboard, label
// and screen reader work without any JS; `.hm-toggle` is only the visual.
withDefaults(
  defineProps<{
    label: string;
    /** Helper line rendered under the label. */
    hint?: string;
    disabled?: boolean;
  }>(),
  { hint: undefined, disabled: false },
);

const model = defineModel<boolean>({ default: false });
</script>

<template>
  <label class="hm-toggle-row">
    <span class="hm-toggle-row__text">
      <span class="hm-toggle-row__label">{{ label }}</span>
      <span
        v-if="hint"
        class="hm-toggle-row__hint"
        >{{ hint }}</span
      >
    </span>
    <input
      v-model="model"
      type="checkbox"
      role="switch"
      class="hm-toggle__input"
      :aria-checked="model"
      :disabled="disabled"
    />
    <span
      class="hm-toggle"
      :class="{ 'hm-toggle--active': model }"
      aria-hidden="true"
    >
      <span class="hm-toggle__thumb" />
    </span>
  </label>
</template>
