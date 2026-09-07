<script setup lang="ts">
interface SelectOption {
  label: string;
  value: string | number;
}

interface Props {
  modelValue?: string | number;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  loading?: boolean;
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg';
  /**
   * Render the trigger at the 30px toolbar control height so it lines up with the
   * search input and buttons in a table controls bar (see DESIGN_MANIFEST § 11.2).
   */
  filter?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select',
  disabled: false,
  searchable: false,
  loading: false,
  size: '2xs',
  filter: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined];
}>();

// The panel skin lives in the layer's app.config.ts, so all that is left per
// instance is the toolbar height. It used to be a global `!important` stylesheet
// aimed at the trigger `<button>`: under Nuxt UI 2 the `ui` prop replaced rather
// than merged, so there was no way to reach the trigger from here. Nuxt UI 4 merges
// slot classes, which is exactly what this needs.
const mergedUi = computed(() =>
  props.filter ? { base: 'h-[30px] min-h-0 py-0 leading-none' } : undefined,
);

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <USelectMenu
    v-model="localValue"
    v-bind="$attrs"
    :items="options"
    :placeholder="placeholder"
    :disabled="disabled"
    :search-input="searchable"
    :loading="loading"
    :size="size as any"
    label-key="label"
    value-key="value"
    class="w-full"
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
  </USelectMenu>
</template>
