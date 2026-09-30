<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css';

import VueDatePicker from '@vuepic/vue-datepicker';
import { computed } from 'vue';

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

const props = withDefaults(defineProps<Props>(), {
  inTable: false,
  isRange: false,
  isClearable: true,
  placeholder: 'Select date',
  weekStart: 1,
  locale: 'en-US',
});

const model = defineModel<Date | Date[] | null>({ default: null });

// A date-fns pattern (`dd MMM yy`) would name months in English whatever `locale`
// says, so the input is written through Intl in the given locale (`13 сент. 26 г.`).
const INPUT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: '2-digit',
};
const formatInput = computed(() => {
  const locale = props.locale;
  // The widget re-runs the formatter whenever it changes (a live locale switch),
  // including on an empty picker, so a missing date renders as nothing.
  const one = (date: Date | null) => (date ? date.toLocaleDateString(locale, INPUT_DATE_FORMAT) : '');
  return (value: Date | Date[] | null) =>
    Array.isArray(value) ? value.filter(Boolean).map(one).join(' – ') : one(value);
});

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
      :format="formatInput"
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
