<script setup lang="ts">
interface Props {
  modelValue?: string | number;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  size?: string;
  variant?: string;
  ui?: Record<string, any>;
}

// `size` and `variant` are deliberately left undefined: Nuxt UI resolves them from
// the theme's `defaultVariants` (see the layer's app.config.ts), so the design
// system decides the default in one place instead of every wrapper repeating it.
const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type here',
  type: 'text',
  disabled: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined];
}>();

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <UInput
    v-bind="$attrs"
    v-model="localValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :size="size as any"
    :variant="variant as any"
    :ui="ui"
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
