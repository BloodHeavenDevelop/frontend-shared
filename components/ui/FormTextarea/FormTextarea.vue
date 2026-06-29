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

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Type here',
  disabled: false,
  size: '2xs',
  variant: '2xs',
  rows: 3,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
}>();

const appConfig = useAppConfig();
const globalBase = (appConfig.ui as Record<string, any>)?.textarea?.base || '';

const mergedUi = computed(() => {
  const userBase = props.ui?.base || '';
  // DESIGN_MANIFEST § 10.5: textarea min-height 80px, vertical resize only.
  const combinedBase = [globalBase, userBase, 'min-h-[80px] resize-y'].filter(Boolean).join(' ');

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
