<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

interface Option {
  label: string;
  value: string | number;
  hint?: string;
  disabled?: boolean;
}

interface Props {
  modelValue?: string | number | null;
  options: Option[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  creatable?: boolean;
  // Toolbar-filter affordance (DESIGN_MANIFEST § 11.2): renders the trigger as a
  // pixel-twin of `.hm-input` (30px height, 12px mono, 8px radius) so the select
  // lines up with the search input and text filters in a table controls bar.
  filter?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Select',
  searchable: true,
  disabled: false,
  creatable: false,
  filter: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const triggerEl = ref<HTMLButtonElement | null>(null);
const dropdownEl = ref<HTMLDivElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const isOpen = ref(false);
const search = ref('');
const activeIndex = ref(-1);
const position = ref<{
  top: number | null;
  bottom: number | null;
  left: number;
  width: number;
  maxHeight: number;
}>({ top: 0, bottom: null, left: 0, width: 0, maxHeight: 280 });

const DROPDOWN_GAP = 4;
const VIEWPORT_PADDING = 8;

// § 16.4: the in-panel search appears only once the list is long enough that
// scanning is slower than typing (>= 8 options). A creatable select always
// needs the input so the user can type a new value.
const showSearch = computed(
  () => (props.searchable && props.options.length >= 8) || props.creatable,
);

const selectedLabel = computed(() => {
  const found = props.options.find((o) => String(o.value) === String(props.modelValue));
  if (found) return found.label;
  if (props.creatable && props.modelValue != null && props.modelValue !== '') {
    return String(props.modelValue);
  }
  return '';
});

const showCreateOption = computed(() => {
  if (!props.creatable) return false;
  const q = search.value.trim();
  if (!q) return false;
  return !props.options.some(
    (o) =>
      o.label.toLowerCase() === q.toLowerCase() ||
      String(o.value).toLowerCase() === q.toLowerCase(),
  );
});

const createOption = () => {
  const q = search.value.trim();
  if (!q) return;
  emit('update:modelValue', q);
  close();
};

const filteredOptions = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return props.options;
  return props.options.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      String(o.value).toLowerCase().includes(q) ||
      (o.hint?.toLowerCase().includes(q) ?? false),
  );
});

const updatePosition = () => {
  if (!triggerEl.value) return;
  const rect = triggerEl.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom - VIEWPORT_PADDING;
  const spaceAbove = rect.top - VIEWPORT_PADDING;
  // Open upward when the dropdown wouldn't fit below at full height AND
  // there's more room above. Falling back to "below" when both are tight
  // keeps behavior predictable on short viewports. When opening upward we
  // anchor by `bottom` so the panel's lower edge always hugs the trigger
  // regardless of content height — otherwise short option lists would
  // float far above the trigger leaving a visual gap.
  // § 16.1: the panel may grow up to 60vh before it scrolls internally.
  const panelMax = Math.round(viewportHeight * 0.6);
  const openAbove = spaceBelow < panelMax && spaceAbove > spaceBelow;
  const availableHeight = Math.max(120, openAbove ? spaceAbove : spaceBelow);
  const maxHeight = Math.min(panelMax, availableHeight - DROPDOWN_GAP);
  position.value = {
    top: openAbove ? null : rect.bottom + DROPDOWN_GAP,
    bottom: openAbove ? viewportHeight - rect.top + DROPDOWN_GAP : null,
    left: rect.left,
    width: rect.width,
    maxHeight,
  };
};

const open = () => {
  if (props.disabled) return;
  updatePosition();
  isOpen.value = true;
  search.value = '';
  // Set after flush so the `search` watcher (which resets the highlight to 0)
  // doesn't clobber the selected-option highlight we want on open.
  nextTick(() => {
    activeIndex.value = props.options.findIndex(
      (o) => String(o.value) === String(props.modelValue),
    );
    searchInput.value?.focus();
    scrollActiveIntoView();
  });
};

const close = () => {
  isOpen.value = false;
};

const selectOption = (opt: Option) => {
  if (opt.disabled) return;
  emit('update:modelValue', opt.value);
  close();
};

const scrollActiveIntoView = () => {
  if (activeIndex.value < 0) return;
  nextTick(() => {
    const nodes = dropdownEl.value?.querySelectorAll<HTMLElement>('.hm-select-option');
    nodes?.[activeIndex.value]?.scrollIntoView({ block: 'nearest' });
  });
};

// § 16.5: ArrowUp/ArrowDown move the highlight, skipping disabled options.
const moveActive = (delta: number) => {
  const list = filteredOptions.value;
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

// Keep the highlight valid as the filtered list changes under search.
watch(search, () => {
  activeIndex.value = filteredOptions.value.length ? 0 : -1;
});

const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as Node;
  if (triggerEl.value?.contains(target)) return;
  if (dropdownEl.value?.contains(target)) return;
  close();
};

const onScroll = () => {
  if (isOpen.value) updatePosition();
};

// § 16.5: Escape closes + returns focus to the trigger, arrows move the
// highlight, Enter activates it (or creates), Tab closes and moves on.
const onKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value) return;
  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      close();
      triggerEl.value?.focus();
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
      const opt = filteredOptions.value[activeIndex.value];
      if (opt) selectOption(opt);
      else if (showCreateOption.value) createOption();
      break;
    }
    case 'Tab':
      close();
      break;
  }
};

watch(isOpen, (v) => {
  if (v) {
    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', updatePosition);
  } else {
    document.removeEventListener('mousedown', onDocumentClick);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', updatePosition);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentClick);
  document.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('scroll', onScroll, true);
  window.removeEventListener('resize', updatePosition);
});
</script>

<template>
  <button
    ref="triggerEl"
    type="button"
    class="hm-select-trigger"
    :class="{
      'hm-select-trigger--open': isOpen,
      'hm-select-trigger--disabled': disabled,
      'hm-select-trigger--filter': filter,
    }"
    :disabled="disabled"
    @click="isOpen ? close() : open()"
  >
    <span
      v-if="selectedLabel"
      class="hm-select-value"
    >
      {{ selectedLabel }}
    </span>
    <span
      v-else
      class="hm-select-placeholder"
    >
      {{ placeholder }}
    </span>
    <svg
      class="hm-select-chevron"
      :class="{ 'hm-select-chevron--open': isOpen }"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="dropdownEl"
      class="hm-select-dropdown"
      :style="{
        top: position.top != null ? `${position.top}px` : 'auto',
        bottom: position.bottom != null ? `${position.bottom}px` : 'auto',
        left: `${position.left}px`,
        width: `${position.width}px`,
        maxHeight: `${position.maxHeight}px`,
      }"
    >
      <div
        v-if="showSearch"
        class="hm-select-search-wrap"
      >
        <input
          ref="searchInput"
          v-model="search"
          type="text"
          class="hm-select-search"
          placeholder="Search..."
        />
      </div>

      <div class="hm-select-options">
        <button
          v-for="(opt, index) in filteredOptions"
          :key="opt.value"
          type="button"
          class="hm-select-option"
          :class="{
            'hm-select-option--active': String(opt.value) === String(modelValue),
            'hm-select-option--highlight': index === activeIndex,
            'hm-select-option--disabled': opt.disabled,
          }"
          :disabled="opt.disabled"
          @mouseenter="activeIndex = index"
          @click="selectOption(opt)"
        >
          <span class="hm-select-option-label">{{ opt.label }}</span>
          <span
            v-if="opt.hint"
            class="hm-select-option-hint"
          >
            {{ opt.hint }}
          </span>
        </button>

        <button
          v-if="showCreateOption"
          type="button"
          class="hm-select-option hm-select-option--create"
          @click="createOption"
        >
          <span class="hm-select-option-label">Use "{{ search.trim() }}"</span>
          <span class="hm-select-option-hint">new</span>
        </button>

        <div
          v-if="filteredOptions.length === 0 && !showCreateOption"
          class="hm-select-empty"
        >
          Nothing found
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.hm-select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: var(--hm-bg);
  border: 1px solid var(--hm-border);
  border-radius: 6px;
  color: var(--hm-text);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s;
  text-align: left;
}

.hm-select-trigger:hover:not(.hm-select-trigger--disabled) {
  border-color: rgba(255, 255, 255, 0.2);
}

.hm-select-trigger--open {
  border-color: var(--hm-accent);
}

.hm-select-trigger--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toolbar-filter affordance (DESIGN_MANIFEST § 11.2): the trigger reads as a
   pixel-twin of `.hm-input` so it lines up with the 30px search/text filters in
   a table controls bar — 30px height, 12px mono, 8px radius, --hm-bg / --hm-border
   ring turning --hm-accent on focus/open. Value/placeholder spans inherit the font. */
.hm-select-trigger--filter {
  height: 30px;
  min-height: 30px;
  padding: 0 14px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.hm-select-trigger--filter:focus-visible {
  border-color: var(--hm-accent);
  outline: none;
}

.hm-select-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-select-placeholder {
  flex: 1;
  color: var(--hm-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-select-chevron {
  color: var(--hm-muted);
  flex-shrink: 0;
  transition: transform 0.15s;
}

.hm-select-chevron--open {
  transform: rotate(180deg);
}

/* HmSelect is body-teleported from inside popup forms, so it must layer above
   modal overlays. Per manifest § 2.4 the maximum allowed z-index is 100; since
   teleport happens after modal mount, paint order keeps the dropdown on top. */
.hm-select-dropdown {
  position: fixed;
  z-index: 100;
  background: var(--hm-surface);
  border: 1px solid var(--hm-border);
  border-radius: 8px;
  /* § 16.1: floating panels float over varied content and need the shadow. */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hm-select-search-wrap {
  padding: 8px;
  border-bottom: 1px solid var(--hm-border);
}

.hm-select-search {
  width: 100%;
  padding: 6px 10px;
  background: var(--hm-bg);
  border: 1px solid var(--hm-border);
  border-radius: 4px;
  color: var(--hm-text);
  font-size: 12px;
  outline: none;
}

.hm-select-search:focus {
  border-color: var(--hm-accent);
}

.hm-select-options {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.hm-select-option {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--hm-text);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition:
    background 0.1s,
    color 0.1s;
}

.hm-select-option:hover:not(.hm-select-option--disabled),
.hm-select-option--highlight:not(.hm-select-option--disabled) {
  background: rgba(0, 212, 255, 0.08);
  color: var(--hm-accent);
}

.hm-select-option--active {
  color: var(--hm-accent);
  background: rgba(0, 212, 255, 0.1);
}

.hm-select-option--create {
  color: var(--hm-accent);
  font-style: italic;
}

.hm-select-option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hm-select-option-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hm-select-option-hint {
  font-size: 11px;
  color: var(--hm-muted);
  flex-shrink: 0;
}

.hm-select-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--hm-muted);
}
</style>
