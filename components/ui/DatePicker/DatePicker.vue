<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css';

import VueDatePicker from '@vuepic/vue-datepicker';

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Props {
  inTable?: boolean;
  isRange?: boolean;
  isClearable?: boolean;
  placeholder?: string;
  /**
   * First day of the calendar week, `Date#getDay` style (Sunday = 0). Pass the
   * account preference (`useUserPreferencesStore().weekStart`).
   */
  weekStart?: Weekday;
  /** BCP 47 locale for month and weekday names (`useUserPreferencesStore().locale`). */
  locale?: string;
}

withDefaults(defineProps<Props>(), {
  inTable: false,
  isRange: false,
  isClearable: true,
  placeholder: 'Select date',
  weekStart: 1,
  locale: 'en-US',
});

const model = defineModel<Date | Date[] | null>({ default: null });

const emit = defineEmits<{
  (e: 'change', value: Date | Date[] | null): void;
}>();

const onChange = (value: Date | Date[] | null) => {
  emit('change', value);
};
</script>

<template>
  <div
    class="hm-date-picker"
    :class="{ 'hm-date-picker--in-table': inTable }"
  >
    <VueDatePicker
      v-model="model"
      :range="isRange"
      :enable-time-picker="false"
      :clearable="isClearable"
      :placeholder="placeholder"
      :week-start="weekStart"
      :locale="locale"
      auto-apply
      dark
      teleport
      format="dd MMM yy"
      @update:model-value="onChange"
    />
  </div>
</template>

<style scoped>
.hm-date-picker {
  display: inline-block;
  width: 100%;
}

.hm-date-picker--in-table :deep(.dp__input) {
  height: 32px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
}
</style>

<style>
/* Dark theme tweaks for vue-datepicker, scoped via :root cascade. */
.dp__theme_dark {
  --dp-background-color: var(--hm-surface);
  --dp-text-color: var(--hm-text);
  --dp-hover-color: rgba(0, 212, 255, 0.08);
  --dp-hover-text-color: var(--hm-accent);
  --dp-primary-color: var(--hm-accent);
  --dp-primary-text-color: #0a0e17; /* mirrors `.hm-btn--primary` text — manifest § 7.3 */
  --dp-secondary-color: var(--hm-muted);
  --dp-border-color: var(--hm-border);
  --dp-menu-border-color: var(--hm-border);
  --dp-border-color-hover: rgba(0, 212, 255, 0.3);
  --dp-disabled-color: var(--hm-muted);
  --dp-scroll-bar-background: transparent;
  --dp-scroll-bar-color: var(--hm-border);
  --dp-success-color: var(--hm-accent);
  --dp-icon-color: var(--hm-muted);
  --dp-font-family: 'JetBrains Mono', monospace;
}
</style>
