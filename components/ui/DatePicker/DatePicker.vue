<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css';

import VueDatePicker from '@vuepic/vue-datepicker';
import { computed } from 'vue';

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A calendar date as `YYYY-MM-DD` — a day, not an instant. */
type CalendarDate = string;
type PickerValue = Date | Date[] | CalendarDate | CalendarDate[] | null;

interface Props {
  inTable?: boolean;
  /** A toolbar control (§ 11): 30 px like the search and filters beside it. */
  toolbar?: boolean;
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
  /**
   * `date` (default): `v-model` is a `Date` (or `Date[]` for a range).
   * `string`: `v-model` is a bare calendar date `YYYY-MM-DD` (or a pair of them), and
   * a cleared field is `''`. The day travels through local midnight both ways, so no
   * timezone can move it by one — the shape a "paid until" or a sprint end wants.
   */
  valueType?: 'date' | 'string';
  /** Earliest selectable day (`YYYY-MM-DD` or a `Date`); earlier days are disabled. */
  min?: Date | CalendarDate;
  /** Latest selectable day (`YYYY-MM-DD` or a `Date`); later days are disabled. */
  max?: Date | CalendarDate;
}

const props = withDefaults(defineProps<Props>(), {
  inTable: false,
  toolbar: false,
  isRange: false,
  isClearable: true,
  placeholder: 'Select date',
  weekStart: 1,
  locale: 'en-US',
  valueType: 'date',
  min: undefined,
  max: undefined,
});

const model = defineModel<PickerValue>({ default: null });

const pad = (n: number): string => String(n).padStart(2, '0');

/** `YYYY-MM-DD` → that day's local midnight; anything malformed is no date. */
const toDate = (value: CalendarDate): Date | null => {
  const [y, m, d] = value.split('-').map((part) => Number.parseInt(part, 10));
  return y && m && d ? new Date(y, m - 1, d) : null;
};
const toCalendarDate = (date: Date): CalendarDate =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const asDate = (value: Date | CalendarDate | undefined): Date | undefined =>
  typeof value === 'string' ? (toDate(value) ?? undefined) : value;

const minDate = computed(() => asDate(props.min));
const maxDate = computed(() => asDate(props.max));

/** A pick outside the bounds (typed, or from a stale value) snaps to the nearest one. */
const clamp = (date: Date): Date => {
  if (minDate.value && date < minDate.value) return minDate.value;
  if (maxDate.value && date > maxDate.value) return maxDate.value;
  return date;
};

/** What the calendar itself holds: always `Date`s. */
const pickerValue = computed<Date | Date[] | null>(() => {
  const value = model.value;
  if (value == null || value === '') return null;
  if (Array.isArray(value)) {
    return (value as (Date | CalendarDate)[])
      .map((v) => (typeof v === 'string' ? toDate(v) : v))
      .filter((v): v is Date => v instanceof Date);
  }
  return typeof value === 'string' ? toDate(value) : value;
});

const INPUT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: '2-digit',
};
const formatInput = computed(() => {
  const locale = props.locale;
  const one = (date: Date | null) =>
    date ? date.toLocaleDateString(locale, INPUT_DATE_FORMAT) : '';
  return (value: Date | Date[] | null) =>
    Array.isArray(value) ? value.filter(Boolean).map(one).join(' – ') : one(value);
});

const emit = defineEmits<{
  (e: 'change', value: PickerValue): void;
}>();

const onPick = (value: Date | Date[] | null) => {
  let next: PickerValue;
  if (props.valueType === 'string') {
    if (Array.isArray(value)) next = value.filter(Boolean).map((d) => toCalendarDate(clamp(d)));
    else next = value ? toCalendarDate(clamp(value)) : '';
  } else if (Array.isArray(value)) {
    next = value.filter(Boolean).map(clamp);
  } else {
    next = value ? clamp(value) : null;
  }
  model.value = next;
  emit('change', next);
};
</script>

<template>
  <div
    class="hm-date-picker"
    :class="{
      'hm-date-picker--in-table': inTable,
      'hm-date-picker--toolbar': toolbar,
    }"
  >
    <VueDatePicker
      :model-value="pickerValue"
      :range="isRange"
      :min-date="minDate"
      :max-date="maxDate"
      :enable-time-picker="false"
      :clearable="isClearable"
      :placeholder="placeholder"
      :week-start="weekStart"
      :locale="locale"
      auto-apply
      dark
      teleport
      :format="formatInput"
      @update:model-value="onPick"
    />
  </div>
</template>

<style scoped>
.hm-date-picker {
  display: inline-block;
  width: 100%;
}

/* The input is a twin of `.hm-input` (§ 10.7.1 / § 10.7.4): 12px mono, 8px radius,
   recessed `--hm-bg`, and the one form control height — the library's own input is a
   16px/38px box with a 4px radius that stood out next to every other field. */
.hm-date-picker :deep(.dp__input) {
  box-sizing: border-box;
  height: var(--hm-control-height);
  border-radius: 8px;
  background: var(--hm-bg);
  border-color: var(--hm-border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1;
}

.hm-date-picker :deep(.dp__input:hover) {
  border-color: rgba(0, 212, 255, 0.3); /* --hm-accent @ 30% */
}

.hm-date-picker :deep(.dp__input_focus) {
  border-color: var(--hm-accent);
}

.hm-date-picker :deep(.dp__input::placeholder) {
  color: var(--hm-muted);
  opacity: 1;
}

.hm-date-picker--toolbar :deep(.dp__input) {
  height: 30px;
}

.hm-date-picker--in-table :deep(.dp__input) {
  height: 32px;
}

/* Mobility § M3 / § M11 — 16px type (iOS zooms below it) and the touch height,
   in a form and in a toolbar alike. */
@media (max-width: 768px) {
  .hm-date-picker :deep(.dp__input),
  .hm-date-picker--toolbar :deep(.dp__input) {
    height: var(--hm-control-height);
    font-size: 16px;
  }
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
