<script setup lang="ts">
import { computed } from 'vue';

import AppBody from '../AppBody/AppBody.vue';
import AppFooter from '../AppFooter/AppFooter.vue';
import AppHeader from '../AppHeader/AppHeader.vue';
import type { AppMeta, AppNavActiveMatcher, AppNavEntry } from '../AppHeader/types';
import MobileNav from '../MobileNav/MobileNav.vue';

/**
 * The whole application shell — grid background, <UiAppHeader>, <UiAppBody>,
 * <UiAppFooter> and the phone tab bar — in one component, so every frontend's
 * `layouts/default.vue` is just this with its data:
 *
 *   <UiAppLayout
 *     :title="t('common.appName')"
 *     :entries="navEntries"
 *     :profile-url="profileUrl"
 *     :show-sign-out="!authDisabled"
 *     :meta="{ version: appVersion, buildSha, env: appEnv, online }"
 *     @sign-out="signOut"
 *   >
 *     <slot />
 *   </UiAppLayout>
 *
 * Header slots are re-exposed with a `header-` prefix (`header-left`, `header-center`,
 * `header-nav`, `header-account`, `header-end`, `logo`), footer slots with `footer-`
 * (`footer-left`, `footer-center`, `footer-right`), and the phone sheet's identity
 * slot as `mobile-identity`.
 */
const props = withDefaults(
  defineProps<{
    title: string;
    homeTo?: string;
    entries?: AppNavEntry[];
    profileUrl?: string;
    profileTo?: string;
    profileLabel?: string;
    signOutLabel?: string;
    showSignOut?: boolean;
    isActive?: AppNavActiveMatcher;
    meta?: AppMeta;
    onlineLabel?: string;
    offlineLabel?: string;
    themeSwitcher?: boolean;
    themeLabel?: string;
    /** Tabs on the phone bar before "More". */
    maxTabs?: number;
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
    meta: () => ({}),
    onlineLabel: 'online',
    offlineLabel: 'offline',
    themeSwitcher: true,
    themeLabel: 'theme',
    maxTabs: 3,
  },
);

const emit = defineEmits<{ (e: 'sign-out'): void }>();

const mobileMeta = computed<AppMeta>(() => ({
  ...props.meta,
  buildSha: props.meta.buildSha?.slice(0, 7),
}));
</script>

<template>
  <div class="hm-page">
    <div class="hm-grid-bg" />

    <AppHeader
      :title="title"
      :home-to="homeTo"
      :entries="entries"
      :profile-url="profileUrl"
      :profile-to="profileTo"
      :profile-label="profileLabel"
      :sign-out-label="signOutLabel"
      :show-sign-out="showSignOut"
      :is-active="isActive"
      @sign-out="emit('sign-out')"
    >
      <template
        v-if="$slots.logo"
        #logo
      >
        <slot name="logo" />
      </template>
      <template #left>
        <slot name="header-left" />
      </template>
      <template #center>
        <slot name="header-center" />
      </template>
      <template
        v-if="$slots['header-nav']"
        #nav
      >
        <slot name="header-nav" />
      </template>
      <template
        v-if="$slots['header-account']"
        #account
      >
        <slot name="header-account" />
      </template>
      <template #end>
        <slot name="header-end" />
      </template>
    </AppHeader>

    <AppBody>
      <slot />
    </AppBody>

    <AppFooter
      :meta="meta"
      :online-label="onlineLabel"
      :offline-label="offlineLabel"
      :theme-switcher="themeSwitcher"
      :theme-label="themeLabel"
    >
      <template #left>
        <slot name="footer-left" />
      </template>
      <template #center>
        <slot name="footer-center" />
      </template>
      <template #right>
        <slot name="footer-right" />
      </template>
    </AppFooter>

    <!-- Phone navigation — renders nothing above 768px. The footer is hidden at that
         width, so its slots travel into the sheet (mobility § M4, § M6). -->
    <MobileNav
      :entries="entries"
      :max-tabs="maxTabs"
      :profile-url="profileUrl"
      :profile-to="profileTo"
      :profile-label="profileLabel"
      :sign-out-label="signOutLabel"
      :show-sign-out="showSignOut"
      :is-active="isActive"
      :meta="mobileMeta"
      :online-label="onlineLabel"
      :offline-label="offlineLabel"
      :theme-switcher="themeSwitcher"
      :theme-label="themeLabel"
      @sign-out="emit('sign-out')"
    >
      <template
        v-if="$slots['mobile-identity']"
        #identity
      >
        <slot name="mobile-identity" />
      </template>
    </MobileNav>
  </div>
</template>
