<script setup lang="ts">
interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: string;
  variant?: string;
  rows?: number;
  ui?: Record<string, any>;
}

// `size` and `variant` are resolved from the theme's `defaultVariants` — see the
// note in FormInput.vue.
const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type here',
  disabled: false,
  rows: 3,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
}>();

// DESIGN_MANIFEST § 10.5: textarea min-height 80px, vertical resize only. Appended
// after any caller-supplied `base` so it wins on the conflicting properties.
const mergedUi = computed(() => ({
  ...props.ui,
  base: [props.ui?.base, 'min-h-[80px] resize-y'].filter(Boolean).join(' '),
}));

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <UTextarea
    v-bind="$attrs"
    v-model="localValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :size="size as any"
    :variant="variant as any"
    :rows="rows"
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
  </UTextarea>
</template>
