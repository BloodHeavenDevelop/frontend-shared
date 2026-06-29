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

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type here',
  type: 'text',
  disabled: false,
  size: '2xs',
  variant: '2xs',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined];
}>();

const appConfig = useAppConfig();
const globalBase = (appConfig.ui as Record<string, any>)?.input?.base || '';

const mergedUi = computed(() => {
  const userBase = props.ui?.base || '';
  const combinedBase = [globalBase, userBase].filter(Boolean).join(' ');

  return {
    ...props.ui,
    base: combinedBase,
  };
});

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
