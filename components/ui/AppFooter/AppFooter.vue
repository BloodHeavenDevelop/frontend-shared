<script setup lang="ts">
import { computed } from 'vue';

import type { AppMeta } from '../AppHeader/types';
import ThemeSwitcher from '../ThemeSwitcher/ThemeSwitcher.vue';

/**
 * The platform footer (manifest § 6): build on the left, connection and environment
 * in the centre, extras on the right. Hidden below 768px — <UiMobileNav> carries
 * the same slots in its sheet there (mobility § M6).
 *
 * Slots `left` / `center` / `right` append to the built-in content of each column;
 * the theme switcher (<UiThemeSwitcher>) closes the right one.
 */
const props = withDefaults(
  defineProps<{
    meta?: AppMeta;
    onlineLabel?: string;
    offlineLabel?: string;
    /** The theme pill at the right end; `false` hides it. */
    themeSwitcher?: boolean;
    themeLabel?: string;
  }>(),
  {
    themeSwitcher: true,
    themeLabel: 'theme',
    meta: () => ({}),
    onlineLabel: 'online',
    offlineLabel: 'offline',
  },
);

const shortSha = computed(() => props.meta.buildSha?.slice(0, 7) ?? '');
</script>

<template>
  <footer class="hm-footer">
    <div class="hm-footer__left">
      <span
        v-if="meta.version"
        class="hm-footer__meta"
      >
        App v{{ meta.version }}
      </span>
      <template v-if="shortSha">
        <span class="hm-footer__sep">·</span>
        <span class="hm-footer__meta">build {{ shortSha }}</span>
      </template>
      <slot name="left" />
    </div>

    <div class="hm-footer__center">
      <span
        v-if="meta.online !== undefined"
        class="hm-pill"
      >
        <span
          class="hm-dot"
          :class="meta.online ? 'hm-dot--ok' : 'hm-dot--error'"
        />
        {{ meta.online ? onlineLabel : offlineLabel }}
      </span>
      <span
        v-if="meta.env"
        class="hm-pill hm-pill--accent"
      >
        env: {{ meta.env }}
      </span>
      <slot name="center" />
    </div>

    <div class="hm-footer__right">
      <slot name="right" />
      <ThemeSwitcher
        v-if="themeSwitcher"
        :label="themeLabel"
      />
    </div>
  </footer>
</template>
