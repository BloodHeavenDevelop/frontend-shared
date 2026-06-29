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

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <USelectMenu
    v-model="localValue"
    v-bind="$attrs"
    :options="options"
    :placeholder="placeholder"
    :disabled="disabled"
    :searchable="searchable"
    :loading="loading"
    :size="size"
    option-attribute="label"
    value-attribute="value"
    class="w-full"
    :class="{ 'ui-form-select--filter': filter }"
    :ui-menu="{
      strategy: 'override',
      background: 'bg-hm-surface',
      ring: 'ring-1 ring-hm-border',
      rounded: 'rounded-lg',
      option: {
        color: 'text-hm-text',
        rounded: 'rounded-none',
        active: 'bg-[rgba(0,212,255,0.08)] text-hm-accent',
        selected: 'pe-7 text-hm-accent',
        selectedIcon: {
          base: 'h-4 w-4 text-hm-accent flex-shrink-0',
        },
      },
    }"
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

<!-- Global (NOT scoped) on purpose: the trigger is a <button> rendered deep inside
     the Nuxt UI select, and a scoped `:deep()` rule compiles to a selector keyed on
     this component's data-v scope id — which the library's root doesn't reliably
     carry, so the rule never matches. A plain class selector + !important lands
     regardless of scope and out-weights Nuxt UI's higher-specificity `dark:` colour
     defaults (`.dark .dark:bg-gray-900` etc). The `.ui-form-select--filter` class is
     only ever on filter selects, so this can't leak to other selects. -->
<style>
/* Toolbar filter trigger: a pixel-twin of the sibling .hm-input / .hm-controls-search
   filters — 30px height (lines up with the search input and buttons), mono 12px,
   8px radius, hm-bg background and a 1px hm-border ring that turns accent on focus. */
.ui-form-select--filter button {
  height: 30px !important;
  min-height: 30px !important;
  padding: 0 14px !important;
  border-radius: 8px !important;
  font-family: 'JetBrains Mono', monospace !important;
  font-size: 12px !important;
  background: var(--hm-bg) !important;
  box-shadow: inset 0 0 0 1px var(--hm-border) !important;
}

.ui-form-select--filter button:focus {
  box-shadow: inset 0 0 0 1px var(--hm-accent) !important;
  outline: none !important;
}
</style>
