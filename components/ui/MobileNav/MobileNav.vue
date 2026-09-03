<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { isMobileNavGroup } from '../MobileNav/types';
import type { MobileNavEntry, MobileNavLink, MobileNavMeta } from '../MobileNav/types';

/**
 * Bottom tab bar + nav sheet for viewports ≤ 768px (DESIGN_MANIFEST_MOBILITY.md
 * § M4.2–M4.3). Hidden above the breakpoint by `.hm-tabbar`'s base rule, so the
 * layout mounts it unconditionally and the CSS decides when it exists.
 *
 * The application passes the same `navEntries` its desktop header renders: the
 * first three flat routes become tabs, everything else — remaining routes, every
 * dropdown group, the identity anchors and the footer's status slots — lands in
 * the sheet behind "More".
 */
const props = withDefaults(
  defineProps<{
    entries: MobileNavEntry[];
    /** Tabs before "More". Three keeps a 13-character label legible at 360px. */
    maxTabs?: number;
    /** Absolute URL of the auth surface's profile page; empty hides the anchor. */
    profileUrl?: string;
    /** Internal route to the profile page — used by the auth surface itself. */
    profileTo?: string;
    profileLabel?: string;
    signOutLabel?: string;
    showSignOut?: boolean;
    meta?: MobileNavMeta;
  }>(),
  {
    maxTabs: 3,
    profileUrl: '',
    profileTo: '',
    profileLabel: 'My Profile',
    signOutLabel: 'Sign Out',
    showSignOut: false,
    meta: undefined,
  },
);

const emit = defineEmits<{ (e: 'sign-out'): void }>();

const route = useRoute();

const flatLinks = computed(() =>
  props.entries.filter((entry): entry is MobileNavLink => !isMobileNavGroup(entry)),
);

const groups = computed(() => props.entries.filter(isMobileNavGroup));

const tabs = computed(() => flatLinks.value.slice(0, props.maxTabs));

const sheetLinks = computed(() => flatLinks.value.slice(props.maxTabs));

const isActiveRoute = (path: string) => route.path === path || route.path.startsWith(`${path}/`);

/** "More" reflects the routes it hides, so the bar never shows an active-less state. */
const isMoreActive = computed(
  () =>
    sheetLinks.value.some((link) => isActiveRoute(link.to)) ||
    groups.value.some((group) => group.items.some((item) => isActiveRoute(item.to))),
);

const isSheetOpen = ref(false);

const closeSheet = () => {
  isSheetOpen.value = false;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeSheet();
};

watch(isSheetOpen, (open) => {
  if (!import.meta.client) return;
  document.body.classList.toggle('hm-scroll-lock', open);
  if (open) {
    window.addEventListener('keydown', onKeydown);
  } else {
    window.removeEventListener('keydown', onKeydown);
  }
});

// A nav sheet that survives navigation is a trap (§ M4.3).
watch(() => route.fullPath, closeSheet);

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.body.classList.remove('hm-scroll-lock');
  window.removeEventListener('keydown', onKeydown);
});

const onSignOut = () => {
  closeSheet();
  emit('sign-out');
};

const hasMeta = computed(
  () =>
    !!props.meta && (!!props.meta.version || !!props.meta.env || props.meta.online !== undefined),
);
</script>

<template>
  <nav
    class="hm-tabbar"
    aria-label="Primary"
  >
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="hm-tabbar__item"
      :class="{ 'hm-tabbar__item--active': isActiveRoute(tab.to) }"
    >
      <span class="hm-tabbar__label">{{ tab.label }}</span>
    </NuxtLink>

    <button
      type="button"
      class="hm-tabbar__item"
      :class="{ 'hm-tabbar__item--active': isMoreActive || isSheetOpen }"
      :aria-expanded="isSheetOpen"
      aria-haspopup="menu"
      @click="isSheetOpen = !isSheetOpen"
    >
      <span class="hm-tabbar__label">More</span>
    </button>
  </nav>

  <div
    v-if="isSheetOpen"
    class="hm-modal-overlay hm-navsheet-overlay"
    @click.self="closeSheet"
  >
    <div
      class="hm-modal"
      role="menu"
    >
      <div class="hm-modal__title">Menu</div>

      <div class="hm-navsheet__list">
        <NuxtLink
          v-for="link in sheetLinks"
          :key="link.to"
          :to="link.to"
          class="hm-nav-link hm-navsheet__link"
          :class="{ 'hm-nav-link--active': isActiveRoute(link.to) }"
        >
          {{ link.label }}
        </NuxtLink>

        <template
          v-for="group in groups"
          :key="group.label"
        >
          <div class="hm-section-title hm-navsheet__group">{{ group.label }}</div>
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="hm-nav-link hm-navsheet__link"
            :class="{ 'hm-nav-link--active': isActiveRoute(item.to) }"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </div>

      <!-- Identity anchors — same order and modifiers as the desktop header (§ 4.6).
           The slot is for anchors the props cannot express (a sign-in link on a
           surface that is public when signed out); it renders before them. -->
      <div
        v-if="profileUrl || profileTo || showSignOut || $slots.identity"
        class="hm-navsheet__list hm-navsheet__identity"
      >
        <slot name="identity" />

        <NuxtLink
          v-if="profileTo"
          :to="profileTo"
          class="hm-nav-link hm-nav-link--active hm-navsheet__link"
        >
          {{ profileLabel }}
        </NuxtLink>
        <a
          v-else-if="profileUrl"
          :href="profileUrl"
          class="hm-nav-link hm-nav-link--active hm-navsheet__link"
        >
          {{ profileLabel }}
        </a>

        <button
          v-if="showSignOut"
          type="button"
          class="hm-nav-link hm-nav-link--signout hm-navsheet__link"
          @click="onSignOut"
        >
          {{ signOutLabel }}
        </button>
      </div>

      <!-- The footer's slots, relocated (§ M6) -->
      <div
        v-if="hasMeta"
        class="hm-navsheet__status"
      >
        <div class="hm-navsheet__meta">
          <span v-if="meta?.version">App v{{ meta.version }}</span>
          <template v-if="meta?.buildSha">
            <span class="hm-navsheet__sep">·</span>
            <span>build {{ meta.buildSha }}</span>
          </template>
        </div>
        <div class="hm-navsheet__pills">
          <span
            v-if="meta?.online !== undefined"
            class="hm-pill"
          >
            <span
              class="hm-dot"
              :class="meta.online ? 'hm-dot--ok' : 'hm-dot--error'"
            />
            {{ meta.online ? 'online' : 'offline' }}
          </span>
          <span
            v-if="meta?.env"
            class="hm-pill hm-pill--accent"
          >
            env: {{ meta.env }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* The sheet is the mobile surface only — above the breakpoint the desktop header
   owns navigation and the trigger that opens this is not rendered. */
.hm-navsheet-overlay {
  display: none;
}

.hm-navsheet__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hm-navsheet__link {
  justify-content: flex-start;
  width: 100%;
}

.hm-navsheet__group {
  margin-top: 12px;
  margin-bottom: 4px;
}

.hm-navsheet__identity {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--hm-border);
}

.hm-navsheet__status {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--hm-border);
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--hm-muted);
}

.hm-navsheet__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hm-navsheet__sep {
  opacity: 0.4;
}

.hm-navsheet__pills {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .hm-navsheet-overlay {
    display: flex;
  }
}
</style>
