<script setup lang="ts">
import NavDropdown from '../NavDropdown/NavDropdown.vue';
import { isAppNavGroup } from './types';
import type { AppNavActiveMatcher, AppNavEntry, AppNavGroup } from './types';

/**
 * The platform header (manifest § 4): logo · navigation · page actions · identity.
 * Every application renders this one — it only supplies data and, where it needs
 * them, extra elements through the slots:
 *
 *   logo     replaces the logo link
 *   left     after the logo (a project switcher)
 *   center   between the left block and the nav (a one-off call to action)
 *   nav      after the nav entries, before the divider (an unread-events link)
 *   account  replaces My Profile / Sign Out (a public surface's "Sign in")
 *   end      after the account anchors (a language switcher)
 *
 * Order inside the nav is fixed: entries · divider · `#header-actions` (the page
 * teleport target, § 4.5) · My Profile (cyan, second to last) · Sign Out (red, last).
 */
const props = withDefaults(
  defineProps<{
    /** Product name shown as the logo. */
    title: string;
    homeTo?: string;
    entries?: AppNavEntry[];
    /** Absolute URL of the auth-gateway profile page; empty hides the anchor. */
    profileUrl?: string;
    /** Internal route to the profile page — used by the auth surface itself. */
    profileTo?: string;
    profileLabel?: string;
    signOutLabel?: string;
    showSignOut?: boolean;
    /** Overrides the default "path or a sub-path of it" match. */
    isActive?: AppNavActiveMatcher;
  }>(),
  {
    homeTo: '/',
    entries: () => [],
    profileUrl: '',
    profileTo: '',
    profileLabel: 'My Profile',
    signOutLabel: 'Sign Out',
    showSignOut: false,
    isActive: undefined,
  },
);

const emit = defineEmits<{ (e: 'sign-out'): void }>();

const route = useRoute();

const isActiveRoute = (to: string) =>
  props.isActive ? props.isActive(to) : route.path === to || route.path.startsWith(`${to}/`);

const isGroupActive = (group: AppNavGroup) => group.items.some((item) => isActiveRoute(item.to));

const entryKey = (entry: AppNavEntry) =>
  isAppNavGroup(entry) ? `group-${entry.label}` : `link-${entry.to}`;
</script>

<template>
  <header class="hm-header">
    <div class="hm-header__left">
      <slot name="logo">
        <NuxtLink
          :to="homeTo"
          class="hm-header__logo"
        >
          {{ title }}
        </NuxtLink>
      </slot>
      <slot name="left" />
    </div>

    <slot name="center" />

    <nav class="hm-header__nav">
      <template
        v-for="entry in entries"
        :key="entryKey(entry)"
      >
        <span
          v-if="entry.dividerBefore"
          class="hm-header__nav-divider"
        />
        <NavDropdown
          v-if="isAppNavGroup(entry)"
          :label="entry.label"
          :items="entry.items"
          :active="isGroupActive(entry)"
        />
        <NuxtLink
          v-else
          :to="entry.to"
          class="hm-nav-link"
          :class="{ 'hm-nav-link--active': isActiveRoute(entry.to) }"
        >
          {{ entry.label }}
        </NuxtLink>
      </template>

      <slot name="nav" />

      <span
        v-if="entries.length || $slots.nav"
        class="hm-header__nav-divider"
      />

      <!-- Page-specific actions teleport target — manifest § 4.5. It must stay in the
           DOM even when empty, or a page teleporting into it throws. -->
      <div id="header-actions" />

      <slot name="account">
        <!-- My Profile — always second-to-last, cyan -->
        <NuxtLink
          v-if="profileTo"
          :to="profileTo"
          class="hm-nav-link hm-nav-link--active"
        >
          {{ profileLabel }}
        </NuxtLink>
        <a
          v-else-if="profileUrl"
          :href="profileUrl"
          class="hm-nav-link hm-nav-link--active"
        >
          {{ profileLabel }}
        </a>

        <!-- Sign Out — always last, red -->
        <button
          v-if="showSignOut"
          type="button"
          class="hm-nav-link hm-nav-link--signout"
          @click="emit('sign-out')"
        >
          {{ signOutLabel }}
        </button>
      </slot>

      <slot name="end" />
    </nav>
  </header>
</template>
