<script setup lang="ts">
interface Props {
  variant?: 'toolbar' | 'ghost' | 'custom';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

withDefaults(defineProps<Props>(), {
  variant: 'toolbar',
  disabled: false,
  type: 'button',
});
</script>

<template>
  <button
    :type="type"
    class="hm-icon-btn"
    :class="[`hm-icon-btn--${variant}`]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.hm-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--hm-muted);
}

.hm-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hm-icon-btn--toolbar {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border-color: var(--hm-border);
}

.hm-icon-btn--toolbar:hover:not(:disabled) {
  background: color-mix(in srgb, var(--hm-accent) 8%, transparent);
  border-color: color-mix(in srgb, var(--hm-accent) 30%, transparent);
}

.hm-icon-btn--ghost {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.hm-icon-btn--ghost:hover:not(:disabled) {
  background: color-mix(in srgb, var(--hm-accent) 8%, transparent);
  color: var(--hm-accent);
}

/* "custom" variant: no preset geometry — consumer fully styles via class. */
.hm-icon-btn--custom {
  padding: 0;
}

/* Mobility § M7 — the target grows to the touch floor, the glyph inside does not.
   "custom" is excluded: its geometry belongs to the call site by definition. */
@media (max-width: 768px) {
  .hm-icon-btn--toolbar {
    width: 44px;
    height: 44px;
    border-radius: 8px;
  }

  .hm-icon-btn--ghost {
    width: 44px;
    height: 44px;
    border-radius: 6px;
  }
}
</style>
