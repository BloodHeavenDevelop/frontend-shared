<script setup lang="ts">
import { hourOptions, isoToUtcParts, minuteOptions, utcPartsToIso } from '~/utils/utc-datetime';

const model = defineModel<string | null>({ default: null });

interface Props {
  minIso?: string | null;
  maxIso?: string | null;
}
const props = defineProps<Props>();

const date = ref('');
const hour = ref('00');
const minute = ref('00');

const hours = hourOptions();
const minutes = minuteOptions();

watch(
  model,
  (iso) => {
    const parts = isoToUtcParts(iso);
    date.value = parts?.date ?? '';
    hour.value = parts?.hour ?? '00';
    minute.value = parts?.minute ?? '00';
  },
  { immediate: true },
);

const minDate = computed(() => isoToUtcParts(props.minIso)?.date ?? undefined);
const maxDate = computed(() => isoToUtcParts(props.maxIso)?.date ?? undefined);

function emitValue(): void {
  if (!date.value) {
    model.value = null;
    return;
  }
  model.value = utcPartsToIso(date.value, hour.value, minute.value);
}

function onDateChange(): void {
  emitValue();
}
</script>

<template>
  <div class="dt-picker">
    <input
      v-model="date"
      type="date"
      class="hm-input dt-date"
      :min="minDate"
      :max="maxDate"
      @change="onDateChange"
    />
    <select
      v-model="hour"
      class="hm-select dt-time"
      :disabled="!date"
      @change="emitValue"
    >
      <option
        v-for="h in hours"
        :key="h"
        :value="h"
      >
        {{ h }}
      </option>
    </select>
    <span class="dt-colon">:</span>
    <select
      v-model="minute"
      class="hm-select dt-time"
      :disabled="!date"
      @change="emitValue"
    >
      <option
        v-for="m in minutes"
        :key="m"
        :value="m"
      >
        {{ m }}
      </option>
    </select>
    <span class="dt-utc">UTC</span>
  </div>
</template>

<style scoped>
.dt-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.dt-date {
  color-scheme: dark;
  flex: 1 1 120px;
  min-width: 120px;
}

.dt-time {
  width: 64px;
}

.dt-colon {
  color: var(--hm-muted);
}

.dt-utc {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  color: var(--hm-muted);
  letter-spacing: 0.5px;
}
</style>
