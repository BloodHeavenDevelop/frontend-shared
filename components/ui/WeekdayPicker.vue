<script setup lang="ts">
import { WEEKDAYS } from '~/constants/maintenance';

const model = defineModel<number[]>({ default: () => [] });
const { t } = useI18n();

function toggle(value: number): void {
  model.value = model.value.includes(value)
    ? model.value.filter((v) => v !== value)
    : [...model.value, value];
}
</script>

<template>
  <div class="weekday-picker">
    <button
      v-for="day in WEEKDAYS"
      :key="day.value"
      type="button"
      class="weekday-btn"
      :class="{ 'weekday-btn--on': model.includes(day.value) }"
      @click="toggle(day.value)"
    >
      {{ t(day.labelKey) }}
    </button>
  </div>
</template>

<style scoped>
.weekday-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.weekday-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: var(--hm-muted);
  background: var(--hm-bg);
  border: 1px solid var(--hm-border);
  cursor: pointer;
  transition: all 0.15s;
}

.weekday-btn:hover {
  border-color: rgba(245, 158, 11, 0.4);
}

.weekday-btn--on {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.4);
}
</style>
