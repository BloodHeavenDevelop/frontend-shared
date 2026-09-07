<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  placeholder?: string;
  class?: string;
  ui?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Text',
  class: 'w-full',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined];
}>();

// A cell-sized control: tighter than the `xs` theme size, because it has to sit
// inside a table row without changing the row's height.
const mergedUi = computed(() => ({
  ...props.ui,
  base: [props.ui?.base, 'px-[8px] py-[7px]'].filter(Boolean).join(' '),
}));

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <UInput
    v-bind="$attrs"
    v-model="localValue"
    :placeholder="placeholder"
    :class="props.class"
    size="xs"
    :variant="'table' as any"
    :ui="mergedUi"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotData"
    >
      <slot
        :name="name"
        v-bind="slotData"
      />
    </template>
  </UInput>
</template>
