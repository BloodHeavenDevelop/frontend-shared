<script setup lang="ts">
withDefaults(
  defineProps<{
    align?: 'start' | 'center' | 'end';
  }>(),
  {
    align: 'end',
  },
);
</script>

<template>
  <div
    class="table-actions"
    :class="`table-actions--${align}`"
  >
    <slot />
  </div>
</template>

<style>
.table-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  width: 240px;
  justify-content: center;
  align-items: center;
}

.table-actions--end {
  margin-left: auto;
}

.table-actions--center {
  margin-left: auto;
  margin-right: auto;
}

.table-actions--start {
  margin-right: auto;
}

.table-actions > * {
  min-width: 0;
  box-sizing: border-box;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
