<script setup lang="ts">
const code = ref<string[]>(['', '', '', '', '', '']);
const inputs = ref<HTMLInputElement[]>([]);

const props = defineProps<{
  errorMsg: string;
}>();
const emit = defineEmits<{
  (e: 'complete', value: string): void;
  (e: 'onRemoveError'): void;
}>();

const onInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  const value = target.value.replaceAll(/\D/g, '').slice(0, 1);
  code.value[index] = value;
  target.value = value;

  if (value && index < code.value.length - 1) {
    inputs.value[index + 1]?.focus();
  }
};

const onPaste = (event: ClipboardEvent) => {
  event.preventDefault();

  const pasted = event.clipboardData?.getData('text') ?? '';
  const digits = pasted.replaceAll(/\D/g, '').slice(0, code.value.length).split('');

  for (const [i, digit] of digits.entries()) {
    code.value[i] = digit;
    if (inputs.value[i]) {
      inputs.value[i].value = digit;
    }
  }

  const nextIndex = digits.length < code.value.length ? digits.length : code.value.length - 1;
  inputs.value[nextIndex]?.focus();
};

const onBackspace = (event: KeyboardEvent, index: number) => {
  if (event.key === 'Backspace' && !code.value[index] && index > 0) {
    inputs.value[index - 1]?.focus();
  }
  onRemoveError();
};

const onRemoveError = () => {
  emit('onRemoveError');
};

watch(
  code,
  (val) => {
    if (val.every((char) => char.length === 1)) {
      emit('complete', val.join(''));
    }
  },
  {
    deep: true,
  },
);

onMounted(async () => {
  inputs.value[0]?.focus();
});
</script>
<template>
  <div class="hm-otp">
    <div class="hm-otp__row">
      <input
        v-for="(digit, index) in code"
        ref="inputs"
        :key="index"
        type="text"
        inputmode="numeric"
        pattern="\d*"
        maxlength="1"
        class="hm-otp__cell"
        :class="{ 'hm-otp__cell--error': props.errorMsg.length }"
        :value="digit"
        :autofocus="index === 0"
        @input="onInput($event, index)"
        @keydown="onBackspace($event, index)"
        @paste="onPaste($event)"
        @click="onRemoveError"
      />
    </div>
    <p
      v-if="errorMsg"
      class="hm-otp__error"
    >
      {{ errorMsg }}
    </p>
  </div>
</template>

<style scoped>
.hm-otp {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Grid with minmax(0, 1fr) tracks: the cells split the content width exactly, so the
   row can never overflow past the modal padding (flex items keep their intrinsic
   min-width and push the row to the right). */
.hm-otp__row {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 8px;
}

.hm-otp__cell {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 56px;
  padding: 0;
  text-align: center;
  background: var(--hm-bg);
  border: 1px solid var(--hm-border);
  border-radius: 8px;
  color: var(--hm-text);
  font-family: var(--hm-font-display);
  font-size: 20px;
  font-weight: 800;
  outline: none;
  transition: border-color 0.15s;
}

.hm-otp__cell:focus {
  border-color: var(--hm-accent);
}

.hm-otp__cell--error {
  border-color: var(--hm-error);
  color: var(--hm-error);
}

.hm-otp__error {
  text-align: center;
  font-family: var(--hm-font-body);
  font-size: 11px;
  color: var(--hm-error);
}
</style>
