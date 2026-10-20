<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css';

import VueDatePicker from '@vuepic/vue-datepicker';
import { computed, ref, watch } from 'vue';

import type { DateRangePresetKey, DateRangeFilterValue } from '../DateRangeFilter/types';
import {
  addWallDays,
  endOfZonedDay,
  fromLocalCalendarDate,
  startOfZonedDay,
  toLocalCalendarDate,
  type WallDate,
  wallDateOf,
} from '../DateRangeFilter/zoned-days';

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Props {
  placeholder?: string;
  /**
   * First day of the calendar week, `Date#getDay` style (Sunday = 0). Pass the
   * account preference (`useUserPreferencesStore().weekStart`).
   */
  weekStart?: Weekday;
  /**
   * BCP 47 locale for month/weekday names and the trigger label
   * (`useUserPreferencesStore().locale`).
   */
  locale?: string;
  /**
   * IANA zone whose calendar days the range covers (`useUserPreferencesStore().timezone`).
   * A picked day runs from its first to its last instant in that zone, and the presets
   * ("Today", "Last 7 days") are counted there. Unset: the browser's zone.
   */
  timeZone?: string;
  /** Preset names from the app's i18n; English by default. */
  presetLabels?: Partial<Record<DateRangePresetKey, string>>;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Date range',
  weekStart: 1,
  locale: 'en-US',
  timeZone: undefined,
  presetLabels: () => ({}),
});

const modelValue = defineModel<DateRangeFilterValue>({
  default: () => ({ from: '', to: '' }),
});

// The model is a pair of UTC instants: the first instant of the first day and the last
// instant of the last day, both counted in `timeZone`. The picker's calendar works on
// browser-local dates, so `internal` holds the local dates that *show* those days.
type DateTuple = [Date, Date] | null;
type DayRange = [WallDate, WallDate];

const internal = ref<DateTuple>(null);

const toTuple = (value: DateRangeFilterValue): DateTuple => {
  if (!value.from || !value.to) return null;
  const from = new Date(value.from);
  const to = new Date(value.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return [
    toLocalCalendarDate(wallDateOf(from, props.timeZone)),
    toLocalCalendarDate(wallDateOf(to, props.timeZone)),
  ];
};

watch(
  [modelValue, () => props.timeZone],
  () => {
    internal.value = toTuple(modelValue.value);
  },
  { immediate: true },
);

const emitDays = (days: DayRange | null) => {
  if (!days) {
    modelValue.value = { from: '', to: '' };
    return;
  }
  const [first, last] = days;
  modelValue.value = {
    from: startOfZonedDay(first, props.timeZone).toISOString(),
    to: endOfZonedDay(last, props.timeZone).toISOString(),
  };
};

const onChange = (value: Date | Date[] | null) => {
  if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
    emitDays([fromLocalCalendarDate(value[0]), fromLocalCalendarDate(value[1])]);
  } else if (value === null) {
    emitDays(null);
  }
};

const PRESET_LABELS: Record<DateRangePresetKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7Days: 'Last 7 days',
  last30Days: 'Last 30 days',
  thisMonth: 'This month',
  thisYear: 'This year',
};

const today = () => wallDateOf(new Date(), props.timeZone);
const LAST_7_OFFSET = -6;
const LAST_30_OFFSET = -29;
const FIRST_DAY = 1;

const PRESET_RANGES: Record<DateRangePresetKey, () => DayRange> = {
  today: () => [today(), today()],
  yesterday: () => [addWallDays(today(), -1), addWallDays(today(), -1)],
  last7Days: () => [addWallDays(today(), LAST_7_OFFSET), today()],
  last30Days: () => [addWallDays(today(), LAST_30_OFFSET), today()],
  thisMonth: () => {
    const now = today();
    // Day 0 of the next month is the last day of this one.
    const lastDay = new Date(Date.UTC(now.year, now.month + 1, 0)).getUTCDate();
    return [
      { ...now, day: FIRST_DAY },
      { ...now, day: lastDay },
    ];
  },
  thisYear: () => {
    const now = today();
    return [{ year: now.year, month: 0, day: FIRST_DAY }, now];
  },
};

const presets = computed(() =>
  (Object.keys(PRESET_LABELS) as DateRangePresetKey[]).map((key) => ({
    key,
    label: props.presetLabels[key] ?? PRESET_LABELS[key],
    range: PRESET_RANGES[key],
  })),
);

const applyPreset = (days: DayRange) => {
  internal.value = [toLocalCalendarDate(days[0]), toLocalCalendarDate(days[1])];
  emitDays(days);
};

const clear = () => {
  internal.value = null;
  emitDays(null);
};

// Dates are written through Intl in the given locale (`13 сент. 26 г.`); a date-fns
// pattern such as `dd MMM yy` would name months in English whatever `locale` says.
const DAY_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: '2-digit' };
const formatDay = (d: Date) => d.toLocaleDateString(props.locale, DAY_FORMAT);

const formatLabel = (value: DateTuple): string => {
  if (!value) return '';
  const [from, to] = value;
  const sameDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();
  return sameDay ? formatDay(from) : `${formatDay(from)} – ${formatDay(to)}`;
};

// Re-created when the locale changes, so the picker re-renders its own text too.
const formatInput = computed(() => {
  const locale = props.locale;
  // Also re-run on an empty picker, so a missing date renders as nothing.
  const one = (d: Date | null) => (d ? d.toLocaleDateString(locale, DAY_FORMAT) : '');
  return (value: Date | Date[] | null) =>
    Array.isArray(value) ? value.filter(Boolean).map(one).join(' – ') : one(value);
});

const buttonLabel = computed(() => formatLabel(internal.value) || props.placeholder);
const hasValue = computed(() => internal.value !== null);
</script>

<template>
  <VueDatePicker
    v-model="internal"
    range
    :enable-time-picker="false"
    :clearable="false"
    :week-start="weekStart"
    :locale="locale"
    auto-apply
    dark
    teleport
    :format="formatInput"
    :multi-calendars="{ solo: true }"
    @update:model-value="onChange"
  >
    <template #dp-input>
      <button
        type="button"
        class="hm-date-range-trigger"
        :class="{ 'hm-date-range-trigger--active': hasValue }"
      >
        <UiAppIcon
          name="calendar-days"
          class="w-[14px] h-[14px] shrink-0"
          color="var(--hm-muted)"
          stroke-width="1.5"
        />
        <span class="hm-date-range-trigger__label">{{ buttonLabel }}</span>
        <UiAppIcon
          v-if="hasValue"
          name="x-mark"
          class="w-[14px] h-[14px] shrink-0 hm-date-range-trigger__clear"
          color="var(--hm-muted)"
          stroke-width="1.5"
          @click.stop.prevent="clear"
        />
      </button>
    </template>

    <template #left-sidebar>
      <div class="hm-date-range-presets">
        <button
          v-for="preset in presets"
          :key="preset.key"
          type="button"
          class="hm-date-range-presets__item"
          @click="applyPreset(preset.range())"
        >
          {{ preset.label }}
        </button>
      </div>
    </template>
  </VueDatePicker>
</template>

<style scoped>
.hm-date-range-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--hm-border);
  background: var(--hm-bg);
  color: var(--hm-muted);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
  white-space: nowrap;
}

.hm-date-range-trigger:hover {
  border-color: rgba(0, 212, 255, 0.3);
}

.hm-date-range-trigger--active {
  color: var(--hm-text);
  border-color: rgba(0, 212, 255, 0.3);
}

.hm-date-range-trigger__label {
  font-size: 12px;
}

.hm-date-range-trigger__clear {
  margin-left: 4px;
  border-radius: 4px;
  padding: 1px;
}

.hm-date-range-trigger__clear:hover {
  background: rgba(0, 212, 255, 0.15);
}

.hm-date-range-presets {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-right: 1px solid var(--hm-border);
  min-width: 132px;
}

.hm-date-range-presets__item {
  text-align: left;
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--hm-muted);
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.hm-date-range-presets__item:hover {
  background: rgba(0, 212, 255, 0.08);
  color: var(--hm-accent);
}

/* Mobility § M11 — a toolbar control rejoins the touch height and 16px type. */
@media (max-width: 768px) {
  .hm-date-range-trigger {
    height: var(--hm-control-height);
    padding: 0 14px;
  }

  .hm-date-range-trigger,
  .hm-date-range-trigger__label {
    font-size: 16px;
  }
}
</style>

<style>
/* Dark theme tweaks for vue-datepicker menu when used as a date range filter. */
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
