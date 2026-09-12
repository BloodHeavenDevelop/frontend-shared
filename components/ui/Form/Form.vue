<script setup lang="ts" generic="T extends Record<string, any>">
import type { ObjectSchema } from 'yup';

// `UForm` always validates on submit; these are the extra triggers it accepts.
type FormEventType = 'input' | 'change' | 'blur' | 'focus';

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

const formState = defineModel<T>({ required: true });

// `UForm` derives its state type from the schema, which it cannot relate back to the
// generic `T`; hand it the schema widened so the model binds without a cast per field.
const uiSchema = computed(
  () => validationSchema as ObjectSchema<Record<string, any>> | undefined,
);

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
    class="hm-form flex flex-col gap-4"
    :class="{ 'pointer-events-none': disabled, 'opacity-50': disabled }"
    :schema="uiSchema"
    :validate-on="customValidateTriggers ?? []"
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
