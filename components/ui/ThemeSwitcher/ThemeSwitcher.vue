<script setup lang="ts">
import { computed } from 'vue';

import { useTheme } from '../../../composables/use-theme';

/**
 * Footer pill that switches the colour theme (`useTheme`). One click moves to the
 * next theme of the registry — with two themes that is a toggle — and the pill reads
 * `theme: <name>` like its `env:` neighbour. Renders nothing while the registry holds
 * a single theme.
 */
withDefaults(
  defineProps<{
    /** Word in front of the theme name; pass the app's translation. */
    label?: string;
  }>(),
  { label: 'theme' },
);

const { current, themes, setTheme } = useTheme();

const next = computed(() => {
  const index = themes.findIndex((item) => item.id === current.value.id);
  return themes[(index + 1) % themes.length]!;
});

const switchTheme = () => setTheme(next.value.id);
</script>

<template>
  <button
    v-if="themes.length > 1"
    type="button"
    class="hm-pill hm-theme-switch"
    :title="`${label}: ${next.label}`"
    :aria-label="`${label}: ${current.label} → ${next.label}`"
    @click="switchTheme"
  >
    <!-- Moon for a dark palette, sun for a light one — the icon names the current
         theme, the tooltip the one a click goes to. -->
    <svg
      v-if="current.scheme === 'dark'"
      class="hm-theme-switch__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
    <svg
      v-else
      class="hm-theme-switch__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
      />
      <path
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
    {{ label }}: {{ current.label }}
  </button>
</template>
