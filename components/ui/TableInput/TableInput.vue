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

const appConfig = useAppConfig();
const globalBase = (appConfig.ui as Record<string, any>)?.input?.base || '';

const defaultUi = {
  padding: {
    strategy: 'override',
    xs: 'px-[8px] py-[7px]',
  },
};

const mergedUi = computed(() => {
  const userBase = props.ui?.base || '';
  const combinedBase = [globalBase, userBase].filter(Boolean).join(' ');

  return {
    ...defaultUi,
    ...props.ui,
    base: combinedBase,
    padding: props.ui?.padding ?? defaultUi.padding,
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
