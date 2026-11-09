<script setup lang="ts">
interface Props {
  placeholder?: string;
  variant?: 'base' | 'table';
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  placeholder: 'Search…',
  variant: 'base',
  disabled: false,
});

const model = defineModel<string | number>({ default: '' });

const onClear = () => {
  model.value = '';
};
</script>

<template>
  <div
    class="hm-search-input"
    :class="{ 'hm-search-input--table': variant === 'table' }"
  >
    <UiAppIcon
      class="hm-search-input__icon"
      name="my-icons:magnifying-glass"
    />
    <input
      v-model="model"
      type="text"
      :placeholder="placeholder"
      :disabled="disabled"
      class="hm-search-input__field"
    />
    <button
      v-if="model !== '' && model !== undefined"
      type="button"
      class="hm-search-input__clear"
      :aria-label="'Clear search'"
      @click="onClear"
    >
      <UiAppIcon
        class="hm-search-input__clear-icon"
        name="my-icons:x-mark"
      />
    </button>
  </div>
</template>

<style scoped>
.hm-search-input {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
}

.hm-search-input__icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--hm-muted);
  pointer-events: none;
}

.hm-search-input__field {
  width: 100%;
  height: 30px;
  padding: 0 32px 0 30px;
  background: var(--hm-bg);
  border: 1px solid var(--hm-border);
  border-radius: 8px;
  color: var(--hm-text);
  font-size: 12px;
  font-family: var(--hm-font-body);
  outline: none;
  transition: border-color 0.15s;
}

.hm-search-input--table .hm-search-input__field {
  background: transparent;
  border-color: transparent;
}

.hm-search-input__field:focus {
  border-color: var(--hm-accent);
}

.hm-search-input--table .hm-search-input__field:focus {
  background: var(--hm-bg);
  border-color: var(--hm-accent);
}

.hm-search-input__field::placeholder {
  color: var(--hm-muted);
}

.hm-search-input__field:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hm-search-input__clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--hm-muted);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.hm-search-input__clear:hover {
  background: color-mix(in srgb, var(--hm-accent) 8%, transparent);
  color: var(--hm-accent);
}

.hm-search-input__clear-icon {
  width: 12px;
  height: 12px;
}
</style>
