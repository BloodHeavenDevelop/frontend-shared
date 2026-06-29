<script setup lang="ts" generic="T extends Record<string, any>">
import type { ObjectSchema } from 'yup';

type FormEventType = 'input' | 'change' | 'submit' | 'blur';

interface Emits {
  (e: 'submit', value: T): void;
}

interface Props {
  validationSchema?: ObjectSchema<T>;
  disabled?: boolean;
  customValidateTriggers?: FormEventType[];
}

const emit = defineEmits<Emits>();
const { validationSchema, disabled, customValidateTriggers } = defineProps<Props>();

const formState = defineModel<T>({ default: {}, required: true });

const validateField = async (field: keyof T) => {
  if (!validationSchema) return true;

  try {
    await validationSchema.validateAt(field as string, formState.value);
    return true;
  } catch {
    return false;
  }
};

const resetValidation = (fields?: (keyof T)[]) => {
  if (!form.value) return;

  if (fields?.length) {
    fields.forEach((field) => {
      form.value.clear(field as string);
    });
  } else {
    form.value.clear(); // reset the entire form
  }
};

const form = ref();

const isValid = ref(false);

defineExpose({
  form,
  isValid,
  validateField,
  resetValidation,
});

const onSubmit = () => {
  emit('submit', formState.value);
};

watch(
  formState,
  async () => {
    isValid.value = (await validationSchema?.isValid(formState.value)) ?? false;
  },
  {
    deep: true,
    immediate: true,
  },
);
</script>

<template>
  <UForm
    ref="form"
    v-bind="$attrs"
    :state="formState"
    class="flex flex-col gap-vertical-4"
    :class="{ 'pointer-events-none': disabled, 'opacity-65': disabled }"
    :schema="validationSchema"
    :validate-on="customValidateTriggers ?? ['submit']"
    @submit="onSubmit"
  >
    <slot />

    <button
      class="submit-button"
      type="submit"
    />
  </UForm>
</template>

<style scoped>
.submit-button {
  visibility: hidden;
  position: absolute;
}
</style>
