<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';

interface NavItem {
  to: string;
  label: string;
}

interface Props {
  label: string;
  items: NavItem[];
  active?: boolean;
}

withDefaults(defineProps<Props>(), {
  active: false,
});

const triggerEl = ref<HTMLButtonElement | null>(null);
const menuEl = ref<HTMLDivElement | null>(null);
const isOpen = ref(false);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

const onDocumentClick = (e: MouseEvent) => {
  const target = e.target as Node;
  if (triggerEl.value?.contains(target)) return;
  if (menuEl.value?.contains(target)) return;
  close();
};

const menuItems = () =>
  Array.from(menuEl.value?.querySelectorAll<HTMLElement>('.hm-nav-dropdown__item') ?? []);

const focusItem = (index: number) => {
  const items = menuItems();
  if (!items.length) return;
  const i = (index + items.length) % items.length;
  items[i]?.focus();
};

// § 16.5: ArrowDown from the trigger opens the menu and lands on the first item.
const onTriggerKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    isOpen.value = true;
    nextTick(() => focusItem(0));
  }
};

// § 16.5: arrows cycle item focus, Escape returns focus to the trigger, Tab closes.
const onKeyDown = (e: KeyboardEvent) => {
  if (!isOpen.value) return;
  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      close();
      triggerEl.value?.focus();
      break;
    case 'ArrowDown': {
      e.preventDefault();
      const items = menuItems();
      focusItem(items.indexOf(document.activeElement as HTMLElement) + 1);
      break;
    }
    case 'ArrowUp': {
      e.preventDefault();
      const items = menuItems();
      const current = items.indexOf(document.activeElement as HTMLElement);
      focusItem((current === -1 ? 0 : current) - 1);
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
  } else {
    document.removeEventListener('mousedown', onDocumentClick);
    document.removeEventListener('keydown', onKeyDown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentClick);
  document.removeEventListener('keydown', onKeyDown);
});
</script>

<template>
  <div class="hm-nav-dropdown">
    <button
      ref="triggerEl"
      type="button"
      class="hm-nav-link"
      :class="{ 'hm-nav-link--active': active || isOpen }"
      @click="toggle"
      @keydown="onTriggerKeyDown"
    >
      {{ label }}
      <UiAppIcon
        name="chevron-down"
        class="hm-nav-dropdown__chevron w-[10px] h-[10px]"
        :class="{ 'hm-nav-dropdown__chevron--open': isOpen }"
      />
    </button>

    <div
      v-if="isOpen"
      ref="menuEl"
      class="hm-nav-dropdown__menu"
    >
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="hm-nav-dropdown__item"
        active-class="hm-nav-dropdown__item--active"
        @click="close"
      >
        {{ item.label }}
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.hm-nav-dropdown {
  position: relative;
}

.hm-nav-dropdown__chevron {
  opacity: 0.7;
  transition: transform 0.15s;
}

.hm-nav-dropdown__chevron--open {
  transform: rotate(180deg);
}

.hm-nav-dropdown__menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 6px;
  background: var(--hm-surface);
  border: 1px solid var(--hm-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--hm-shadow) 40%, transparent);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 50;
}

.hm-nav-dropdown__item {
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: var(--hm-font-body);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--hm-muted);
  text-decoration: none;
  transition:
    background 0.15s,
    color 0.15s;
}

.hm-nav-dropdown__item:hover {
  background: color-mix(in srgb, var(--hm-accent) 8%, transparent);
  color: var(--hm-accent);
}

.hm-nav-dropdown__item--active {
  background: color-mix(in srgb, var(--hm-accent) 8%, transparent);
  color: var(--hm-accent);
}
</style>
