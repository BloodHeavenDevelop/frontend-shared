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

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) close();
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
    >
      {{ label }}
      <svg
        class="hm-nav-dropdown__chevron"
        :class="{ 'hm-nav-dropdown__chevron--open': isOpen }"
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
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
  padding: 6px;
  background: var(--hm-surface);
  border: 1px solid var(--hm-border);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 50;
}

.hm-nav-dropdown__item {
  display: block;
  padding: 8px 12px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
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
  background: rgba(0, 212, 255, 0.08);
  color: var(--hm-accent);
}

.hm-nav-dropdown__item--active {
  background: rgba(0, 212, 255, 0.08);
  color: var(--hm-accent);
}
</style>
