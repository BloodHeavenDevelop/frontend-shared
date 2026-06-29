<script setup lang="ts">
import '@vuepic/vue-datepicker/dist/main.css';

import VueDatePicker from '@vuepic/vue-datepicker';
import { endOfDay, endOfMonth, startOfDay, startOfMonth, startOfYear, subDays } from 'date-fns';
import { computed, ref, watch } from 'vue';

import type { DateRangeFilterValue } from '../DateRangeFilter/types';

interface Props {
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Date range',
});

const modelValue = defineModel<DateRangeFilterValue>({
  default: () => ({ from: '', to: '' }),
});

type DateTuple = [Date, Date] | null;

const internal = ref<DateTuple>(null);

const toTuple = (value: DateRangeFilterValue): DateTuple => {
  if (!value.from || !value.to) return null;
  const from = new Date(value.from);
  const to = new Date(value.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return [from, to];
};

watch(
  modelValue,
  (val) => {
    internal.value = toTuple(val);
  },
  { immediate: true },
);

const emitRange = (range: DateTuple) => {
  if (!range) {
    modelValue.value = { from: '', to: '' };
    return;
  }
  const [from, to] = range;
  modelValue.value = { from: from.toISOString(), to: to.toISOString() };
};

const onChange = (value: Date | Date[] | null) => {
  if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
    emitRange([value[0], value[1]]);
  } else if (value === null) {
    emitRange(null);
  }
};

const presets = [
  {
    label: 'Today',
    range: (): [Date, Date] => [startOfDay(new Date()), endOfDay(new Date())],
  },
  {
    label: 'Yesterday',
    range: (): [Date, Date] => {
      const d = subDays(new Date(), 1);
      return [startOfDay(d), endOfDay(d)];
    },
  },
  {
    label: 'Last 7 days',
    range: (): [Date, Date] => [startOfDay(subDays(new Date(), 6)), endOfDay(new Date())],
  },
  {
    label: 'Last 30 days',
    range: (): [Date, Date] => [startOfDay(subDays(new Date(), 29)), endOfDay(new Date())],
  },
  {
    label: 'This month',
    range: (): [Date, Date] => [startOfMonth(new Date()), endOfMonth(new Date())],
  },
  {
    label: 'This year',
    range: (): [Date, Date] => [startOfYear(new Date()), endOfDay(new Date())],
  },
];

const applyPreset = (range: [Date, Date]) => {
  internal.value = range;
  emitRange(range);
};

const clear = () => {
  internal.value = null;
  emitRange(null);
};

const formatLabel = (value: DateTuple): string => {
  if (!value) return '';
  const [from, to] = value;
  const sameDay =
    from.getFullYear() === to.getFullYear() &&
    from.getMonth() === to.getMonth() &&
    from.getDate() === to.getDate();
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' });
  return sameDay ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
};

const buttonLabel = computed(() => formatLabel(internal.value) || props.placeholder);
const hasValue = computed(() => internal.value !== null);
</script>

<template>
  <VueDatePicker
    v-model="internal"
    range
    :enable-time-picker="false"
    :clearable="false"
    auto-apply
    dark
    teleport
    format="dd MMM yy"
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
          :key="preset.label"
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
  border-color: rgba(0, 212, 255, 0.5);
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
  background: rgba(0, 212, 255, 0.12);
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
  --dp-border-color-hover: rgba(0, 212, 255, 0.4);
  --dp-disabled-color: var(--hm-muted);
  --dp-scroll-bar-background: transparent;
  --dp-scroll-bar-color: var(--hm-border);
  --dp-success-color: var(--hm-accent);
  --dp-icon-color: var(--hm-muted);
  --dp-font-family: 'JetBrains Mono', monospace;
}
</style>
