<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useAttrs, watch } from 'vue';
import type { FormSelectOption } from './types';

// DESIGN_MANIFEST.md § 10.6 — the single-value select. It is the one-value sibling of
// `<UiMultiSelect>` (§ 11.6) and wears the same skin: the same trigger, the same
// body-teleported panel with a search field at the top. The differences are the ones
// a single value implies — no checkboxes (the chosen row carries a check), no meta line,
// and picking an option closes the panel.

type SelectOption = FormSelectOption & { create?: boolean };

interface Props {
  modelValue?: string | number | null;
  options: FormSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Kept for compatibility: the panel always opens with a search field, as § 11.6 does. */
  searchable?: boolean;
  loading?: boolean;
  /** Kept for compatibility: every size lands on the one form control height (§ 10.7.4). */
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg';
  /**
   * A toolbar filter (§ 11.2): the 30 px trigger of `<UiMultiSelect>`, reading
   * `Placeholder:` + the chosen label. Without it the trigger is a form field.
   */
  filter?: boolean;
  /** Shows a `×` that resets the value to `undefined` while something is chosen. */
  clearable?: boolean;
  /** Accepts a typed value that is not among the options (a branch not fetched yet). */
  creatable?: boolean;
  /** Muted tag on the row that creates the typed value. */
  createLabel?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  clearLabel?: string;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  placeholder: 'Select',
  disabled: false,
  searchable: false,
  loading: false,
  size: '2xs',
  filter: false,
  clearable: false,
  creatable: false,
  createLabel: 'new',
  searchPlaceholder: 'Search…',
  emptyLabel: 'No matches',
  clearLabel: 'Clear',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | undefined];
}>();

// `class`/`style` size the whole control; everything else (`id`, `name`, `aria-*`)
// belongs to the trigger, so a `<label for>` still lands on the focusable element.
const attrs = useAttrs();
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }));
const triggerAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs;
  return rest;
});

const PANEL_MIN_WIDTH = 248;
const PANEL_MAX_WIDTH = 320;
const DROPDOWN_GAP = 8;
const VIEWPORT_PADDING = 8;

const rootEl = ref<HTMLElement | null>(null);
const triggerEl = ref<HTMLButtonElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);
const search = ref('');
const activeIndex = ref(-1);
const position = ref({
  top: 0 as number | null,
  bottom: null as number | null,
  left: 0,
  width: 0,
  maxHeight: 340,
});

const listId = `hm-select-${Math.random().toString(36).slice(2, 10)}`;

const key = (value: string | number | null | undefined) => (value == null ? '' : String(value));
const hasValue = computed(() => props.modelValue != null && props.modelValue !== '');
const selectedOption = computed(() =>
  props.options.find((o) => key(o.value) === key(props.modelValue)),
);
/** A value no longer among the options (a status that left the server) is still shown. */
const selectedLabel = computed(() =>
  selectedOption.value
    ? selectedOption.value.label
    : hasValue.value
      ? String(props.modelValue)
      : '',
);
// An option whose value is '' ("All") counts as chosen when the model is '' too.
const showsValue = computed(() => !!selectedOption.value || hasValue.value);
const isDisabled = computed(() => props.disabled || props.loading);

const needle = computed(() => search.value.trim().toLowerCase());
const matches = computed<SelectOption[]>(() => {
  if (!needle.value) return props.options;
  return props.options.filter(
    (o) =>
      o.label.toLowerCase().includes(needle.value) ||
      (o.hint?.toLowerCase().includes(needle.value) ?? false),
  );
});
/** A creatable select offers the typed text as the last row unless an option already is it. */
const visibleOptions = computed<SelectOption[]>(() => {
  const typed = search.value.trim();
  if (!props.creatable || !typed) return matches.value;
  const exists = props.options.some(
    (o) => o.label.toLowerCase() === needle.value || key(o.value).toLowerCase() === needle.value,
  );
  return exists ? matches.value : [...matches.value, { label: typed, value: typed, create: true }];
});

/** The label split around the first match, so the match can be drawn in the accent. */
const parts = (label: string) => {
  const at = needle.value ? label.toLowerCase().indexOf(needle.value) : -1;
  if (at < 0) return { pre: label, hit: '', post: '' };
  return {
    pre: label.slice(0, at),
    hit: label.slice(at, at + needle.value.length),
    post: label.slice(at + needle.value.length),
  };
};

const isSelected = (option: SelectOption) =>
  !option.create && !!selectedOption.value && key(option.value) === key(props.modelValue);

const updatePosition = () => {
  if (!rootEl.value) return;
  const rect = rootEl.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_PADDING;
  const spaceAbove = rect.top - VIEWPORT_PADDING;
  // § 16.1: up to 60vh before the list scrolls; opens upward only when that fits better.
  const panelMax = Math.round(viewportHeight * 0.6);
  const openAbove = spaceBelow < panelMax && spaceAbove > spaceBelow;
  const available = Math.max(160, openAbove ? spaceAbove : spaceBelow);
  const width = Math.min(
    Math.max(rect.width, PANEL_MIN_WIDTH),
    Math.max(rect.width, PANEL_MAX_WIDTH),
    window.innerWidth - VIEWPORT_PADDING * 2,
  );
  const left = Math.min(rect.left, window.innerWidth - width - VIEWPORT_PADDING);
  position.value = {
    top: openAbove ? null : rect.bottom + DROPDOWN_GAP,
    bottom: openAbove ? viewportHeight - rect.top + DROPDOWN_GAP : null,
    left: Math.max(VIEWPORT_PADDING, left),
    width,
    maxHeight: Math.min(panelMax, available - DROPDOWN_GAP),
  };
};

const scrollActiveIntoView = () => {
  nextTick(() => {
    const nodes = panelEl.value?.querySelectorAll<HTMLElement>('.hm-multiselect__option');
    nodes?.[activeIndex.value]?.scrollIntoView({ block: 'nearest' });
  });
};

const firstEnabled = () => visibleOptions.value.findIndex((o) => !o.disabled);

const open = () => {
  if (isDisabled.value) return;
  search.value = '';
  updatePosition();
  isOpen.value = true;
  nextTick(() => {
    // Opens on the chosen option, so a long list does not start from the top every time.
    const chosen = visibleOptions.value.findIndex((o) => isSelected(o));
    activeIndex.value = chosen >= 0 ? chosen : firstEnabled();
    searchEl.value?.focus();
    scrollActiveIntoView();
  });
};

const close = (returnFocus = false) => {
  isOpen.value = false;
  if (returnFocus) triggerEl.value?.focus();
};

const pick = (option: SelectOption) => {
  if (option.disabled) return;
  if (option.create || key(option.value) !== key(props.modelValue) || !selectedOption.value) {
    emit('update:modelValue', option.value);
  }
  close(true);
};

const clear = () => {
  emit('update:modelValue', undefined);
};

const moveActive = (delta: number) => {
  const list = visibleOptions.value;
  if (!list.length) {
    activeIndex.value = -1;
    return;
  }
  let next = activeIndex.value;
  for (let i = 0; i < list.length; i++) {
    next = (next + delta + list.length) % list.length;
    if (!list[next]?.disabled) break;
  }
  activeIndex.value = next;
  scrollActiveIntoView();
};

watch(search, () => {
  activeIndex.value = firstEnabled();
});

// § 16.5: arrows move, Enter picks the highlighted option and closes, Escape closes and
// hands focus back to the trigger, Tab closes. After typing the first match is highlighted.
const onKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value) return;
  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      close(true);
      break;
    case 'ArrowDown':
      e.preventDefault();
      moveActive(1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      moveActive(-1);
      break;
    case 'Enter': {
      e.preventDefault();
      const option = visibleOptions.value[activeIndex.value];
      if (option) pick(option);
      break;
    }
    case 'Tab':
      close();
      break;
  }
};

const onTriggerKeyDown = (e: KeyboardEvent) => {
  if (isOpen.value) return;
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    open();
  }
};

const onDocumentPointer = (e: MouseEvent) => {
  const target = e.target as Node;
  if (rootEl.value?.contains(target) || panelEl.value?.contains(target)) return;
  close();
};

const onScroll = (e: Event) => {
  // The panel's own list scrolling must not re-anchor it.
  if (panelEl.value?.contains(e.target as Node)) return;
  updatePosition();
};

const listen = (on: boolean) => {
  const method = on ? 'addEventListener' : 'removeEventListener';
  document[method]('mousedown', onDocumentPointer as EventListener);
  document[method]('keydown', onKeyDown as EventListener);
  window[method]('scroll', onScroll, true);
  window[method]('resize', updatePosition);
};

watch(isOpen, (value) => listen(value));
watch(isDisabled, (value) => {
  if (value) close();
});
onBeforeUnmount(() => listen(false));
</script>

<template>
  <div
    ref="rootEl"
    v-bind="rootAttrs"
    class="hm-multiselect hm-multiselect--single"
    :class="{
      'hm-multiselect--open': isOpen,
      'hm-multiselect--disabled': isDisabled,
      'hm-multiselect--form': !filter,
    }"
  >
    <button
      ref="triggerEl"
      type="button"
      class="hm-multiselect__trigger"
      v-bind="triggerAttrs"
      :disabled="isDisabled"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? listId : undefined"
      @click="isOpen ? close() : open()"
      @keydown="onTriggerKeyDown"
    >
      <template v-if="filter">
        <span class="hm-multiselect__label">{{
          showsValue ? `${placeholder}:` : placeholder
        }}</span>
        <span
          v-if="showsValue"
          class="hm-multiselect__value"
          >{{ selectedLabel }}</span
        >
      </template>
      <template v-else>
        <span
          v-if="showsValue"
          class="hm-multiselect__value"
          >{{ selectedLabel }}</span
        >
        <span
          v-else
          class="hm-multiselect__label"
          >{{ placeholder }}</span
        >
      </template>
    </button>
    <button
      v-if="clearable && hasValue && !isDisabled"
      type="button"
      class="hm-multiselect__clear"
      :aria-label="`${clearLabel} ${placeholder}`"
      :title="`${clearLabel} ${placeholder}`"
      @click="clear"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M2 2l6 6M8 2 2 8" />
      </svg>
    </button>
    <span
      v-if="loading"
      class="hm-spinner hm-multiselect__spinner"
      aria-hidden="true"
    />
    <svg
      v-else
      class="hm-multiselect__chevron"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 4.5 6 7.5 9 4.5" />
    </svg>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="panelEl"
        class="hm-multiselect__panel"
        :style="{
          top: position.top != null ? `${position.top}px` : 'auto',
          bottom: position.bottom != null ? `${position.bottom}px` : 'auto',
          left: `${position.left}px`,
          width: `${position.width}px`,
          maxHeight: `${position.maxHeight}px`,
        }"
      >
        <label class="hm-multiselect__search">
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle
              cx="6"
              cy="6"
              r="4.5"
            />
            <path d="m9.5 9.5 3 3" />
          </svg>
          <input
            ref="searchEl"
            v-model="search"
            type="text"
            class="hm-multiselect__search-input"
            :placeholder="searchPlaceholder"
            :aria-label="`${searchPlaceholder} ${placeholder}`"
            :aria-controls="listId"
            autocomplete="off"
            spellcheck="false"
          />
        </label>

        <div
          :id="listId"
          class="hm-multiselect__list"
          role="listbox"
          :aria-label="placeholder"
        >
          <div
            v-for="(option, index) in visibleOptions"
            :key="option.value"
            class="hm-multiselect__option"
            :class="{
              'hm-multiselect__option--highlight': index === activeIndex,
              'hm-multiselect__option--disabled': option.disabled,
              'hm-multiselect__option--selected': isSelected(option),
            }"
            role="option"
            :aria-selected="isSelected(option)"
            :aria-disabled="option.disabled || undefined"
            @mouseenter="activeIndex = index"
            @mousedown.prevent
            @click="pick(option)"
          >
            <span
              v-if="option.tone"
              class="hm-multiselect__dot"
              :class="`hm-multiselect__dot--${option.tone}`"
              aria-hidden="true"
            />
            <span class="hm-multiselect__option-label"
              >{{ parts(option.label).pre
              }}<span
                v-if="parts(option.label).hit"
                class="hm-multiselect__hit"
                >{{ parts(option.label).hit }}</span
              >{{ parts(option.label).post }}</span
            >
            <span
              v-if="option.create"
              class="hm-multiselect__option-count"
              >{{ createLabel }}</span
            >
            <span
              v-else-if="option.hint"
              class="hm-multiselect__option-count"
              >{{ option.hint }}</span
            >
            <span
              v-if="option.count != null"
              class="hm-multiselect__option-count"
              >{{ option.count }}</span
            >
            <svg
              v-if="isSelected(option)"
              class="hm-multiselect__check"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M2.5 6.2 5 8.5l4.5-5" />
            </svg>
          </div>

          <div
            v-if="visibleOptions.length === 0"
            class="hm-multiselect__empty"
          >
            {{ emptyLabel }}
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
