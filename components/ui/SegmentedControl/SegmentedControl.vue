<script setup lang="ts" generic="T extends string | number">
interface Option<T> {
  label: string;
  value: T;
  disabled?: boolean;
}

interface Props {
  options: Option<T>[];
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  ariaLabel: undefined,
});

const model = defineModel<T>({ required: true });

const onSelect = (value: T, disabled?: boolean) => {
  if (disabled) return;
  model.value = value;
};
</script>

<template>
  <div
    class="hm-segmented"
    :class="[`hm-segmented--${size}`]"
    role="tablist"
    :aria-label="ariaLabel"
  >
    <button
      v-for="opt in options"
      :key="String(opt.value)"
      type="button"
      role="tab"
      class="hm-segmented__item"
      :class="{
        'hm-segmented__item--active': model === opt.value,
        'hm-segmented__item--disabled': opt.disabled,
      }"
      :aria-selected="model === opt.value"
      :disabled="opt.disabled"
      @click="onSelect(opt.value, opt.disabled)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.hm-segmented {
  display: inline-flex;
  align-items: center;
  background: var(--hm-bg);
  border: 1px solid var(--hm-border);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.hm-segmented__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--hm-muted);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  white-space: nowrap;
}

.hm-segmented--md .hm-segmented__item {
  height: 26px;
  padding: 0 12px;
}

.hm-segmented--sm .hm-segmented__item {
  height: 22px;
  padding: 0 10px;
  font-size: 10px;
}

.hm-segmented__item:hover:not(:disabled):not(.hm-segmented__item--active) {
  color: var(--hm-text);
  background: rgba(0, 212, 255, 0.05);
}

.hm-segmented__item--active {
  background: rgba(0, 212, 255, 0.12);
  color: var(--hm-accent);
}

/* Mobility § M13 — the control spans the row and its items share the width, so
   every option is a real target instead of a 40px sliver. */
@media (max-width: 768px) {
  .hm-segmented {
    display: flex;
    width: 100%;
  }

  .hm-segmented__item {
    flex: 1 1 0;
    min-width: 0;
  }

  .hm-segmented--md .hm-segmented__item,
  .hm-segmented--sm .hm-segmented__item {
    height: 40px;
  }
}

.hm-segmented__item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
