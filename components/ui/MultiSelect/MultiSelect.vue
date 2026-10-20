<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import type { MultiSelectOption, MultiSelectSize } from './types';

// DESIGN_MANIFEST.md § 11.6 — a select that takes several values. As a toolbar filter
// (the default) the trigger is a 30 px pixel-twin of the toolbar search; as a form field
// (`size="form"`) it is a twin of `.hm-input` at the control height. The panel always
// opens with a search field focused at the top, and picking an option keeps it open.
const props = withDefaults(
  defineProps<{
    /** Toolbar: the filter's name ("Kind"). Form: the placeholder while nothing is chosen. */
    label: string;
    options: MultiSelectOption[];
    size?: MultiSelectSize;
    disabled?: boolean;
    searchPlaceholder?: string;
    emptyLabel?: string;
    allLabel?: string;
    clearLabel?: string;
    /** Word after the number of chosen values in the panel's meta line. */
    selectedLabel?: string;
    /** Joins "visible of total" in the meta line while the search narrows the list. */
    ofLabel?: string;
  }>(),
  {
    size: 'toolbar',
    disabled: false,
    searchPlaceholder: 'Search…',
    emptyLabel: 'No matches',
    allLabel: 'All',
    clearLabel: 'Clear',
    selectedLabel: 'selected',
    ofLabel: 'of',
  },
);

const model = defineModel<(string | number)[]>({ default: () => [] });

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

const listId = `hm-multiselect-${Math.random().toString(36).slice(2, 10)}`;

const key = (value: string | number) => String(value);
const selectedKeys = computed(() => new Set(model.value.map(key)));
const selectedOptions = computed(() =>
  props.options.filter((o) => selectedKeys.value.has(key(o.value))),
);
const selectedCount = computed(() => model.value.length);
const isForm = computed(() => props.size === 'form');
/** A form field names what is chosen — the value is the point; a toolbar only counts. */
const chosenSummary = computed(() =>
  model.value
    .map((v) => props.options.find((o) => key(o.value) === key(v))?.label ?? String(v))
    .join(', '),
);

const needle = computed(() => search.value.trim().toLowerCase());

const visibleOptions = computed(() => {
  if (!needle.value) return props.options;
  return props.options.filter((o) => o.label.toLowerCase().includes(needle.value));
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

const meta = computed(() => {
  const chosen = `${selectedCount.value} ${props.selectedLabel}`;
  if (!needle.value) return chosen;
  return `${visibleOptions.value.length} ${props.ofLabel} ${props.options.length} · ${chosen}`;
});

const canSelectAll = computed(() =>
  visibleOptions.value.some((o) => !o.disabled && !selectedKeys.value.has(key(o.value))),
);

/** Emits the new selection in the options' order, so the value is stable whatever the click order. */
const commit = (keys: Set<string>) => {
  const ordered = props.options.filter((o) => keys.has(key(o.value))).map((o) => o.value);
  // Values no longer among the options (a status that left the server) are kept, not silently dropped.
  const orphans = model.value.filter(
    (v) => keys.has(key(v)) && !props.options.some((o) => key(o.value) === key(v)),
  );
  model.value = [...ordered, ...orphans];
};

const toggle = (option: MultiSelectOption) => {
  if (option.disabled) return;
  const next = new Set(selectedKeys.value);
  if (next.has(key(option.value))) next.delete(key(option.value));
  else next.add(key(option.value));
  commit(next);
};

const selectVisible = () => {
  const next = new Set(selectedKeys.value);
  for (const o of visibleOptions.value) if (!o.disabled) next.add(key(o.value));
  commit(next);
};

const clear = () => {
  model.value = [];
};

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
    PANEL_MAX_WIDTH,
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

const open = () => {
  if (props.disabled) return;
  search.value = '';
  updatePosition();
  isOpen.value = true;
  nextTick(() => {
    activeIndex.value = visibleOptions.value.length ? 0 : -1;
    searchEl.value?.focus();
  });
};

const close = (returnFocus = false) => {
  isOpen.value = false;
  if (returnFocus) triggerEl.value?.focus();
};

const scrollActiveIntoView = () => {
  nextTick(() => {
    const nodes = panelEl.value?.querySelectorAll<HTMLElement>('.hm-multiselect__option');
    nodes?.[activeIndex.value]?.scrollIntoView({ block: 'nearest' });
  });
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
  activeIndex.value = visibleOptions.value.length ? 0 : -1;
});

// § 16.5, with one deliberate difference: Enter toggles the highlighted option and
// the panel stays open — several values are usually picked in a row.
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
      if (option) toggle(option);
      break;
    }
    case 'Tab':
      close();
      break;
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
onBeforeUnmount(() => listen(false));
</script>

<template>
  <div
    ref="rootEl"
    class="hm-multiselect"
    :class="{
      'hm-multiselect--open': isOpen,
      'hm-multiselect--disabled': disabled,
      'hm-multiselect--form': isForm,
    }"
  >
    <button
      ref="triggerEl"
      type="button"
      class="hm-multiselect__trigger"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? listId : undefined"
      @click="isOpen ? close() : open()"
    >
      <template v-if="isForm">
        <span
          v-if="selectedCount === 0"
          class="hm-multiselect__label"
          >{{ label }}</span
        >
        <span
          v-else
          class="hm-multiselect__value"
          >{{ chosenSummary }}</span
        >
      </template>
      <span
        v-else
        class="hm-multiselect__label"
        >{{ selectedCount === 1 ? `${label}:` : label }}</span
      >
      <span
        v-if="!isForm && selectedCount === 1"
        class="hm-multiselect__value"
        >{{ selectedOptions[0]?.label ?? model[0] }}</span
      >
      <span
        v-else-if="!isForm && selectedCount > 1"
        class="hm-multiselect__count"
        >{{ selectedCount }}</span
      >
    </button>
    <button
      v-if="selectedCount > 0 && !disabled"
      type="button"
      class="hm-multiselect__clear"
      :aria-label="`${clearLabel} ${label}`"
      :title="`${clearLabel} ${label}`"
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
    <svg
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
            :aria-label="`${searchPlaceholder} ${label}`"
            :aria-controls="listId"
            autocomplete="off"
            spellcheck="false"
          />
        </label>

        <div class="hm-multiselect__meta">
          <span>{{ meta }}</span>
          <span class="hm-multiselect__actions">
            <button
              v-if="canSelectAll"
              type="button"
              class="hm-multiselect__action"
              @click="selectVisible"
            >
              {{ allLabel }}
            </button>
            <button
              v-if="selectedCount > 0"
              type="button"
              class="hm-multiselect__action"
              @click="clear"
            >
              {{ clearLabel }}
            </button>
          </span>
        </div>

        <div
          :id="listId"
          class="hm-multiselect__list"
          role="listbox"
          aria-multiselectable="true"
          :aria-label="label"
        >
          <label
            v-for="(option, index) in visibleOptions"
            :key="option.value"
            class="hm-multiselect__option"
            :class="{
              'hm-multiselect__option--highlight': index === activeIndex,
              'hm-multiselect__option--disabled': option.disabled,
            }"
            role="option"
            :aria-selected="selectedKeys.has(key(option.value))"
            @mouseenter="activeIndex = index"
            @mousedown.prevent
          >
            <input
              type="checkbox"
              class="hm-check__input"
              tabindex="-1"
              :checked="selectedKeys.has(key(option.value))"
              :disabled="option.disabled"
              @change="toggle(option)"
            />
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
              v-if="option.count != null"
              class="hm-multiselect__option-count"
              >{{ option.count }}</span
            >
          </label>

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
