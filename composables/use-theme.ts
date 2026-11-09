import { computed, getCurrentInstance, onMounted } from 'vue';

import {
  DEFAULT_THEME,
  THEMES,
  THEME_COOKIE_MAX_AGE,
  THEME_STORAGE_KEY,
  isThemeId,
  themeCookieDomain,
} from '../theme/registry';
import type { ThemeDefinition, ThemeId } from '../theme/registry';

export { DEFAULT_THEME, THEMES };
export type { ThemeDefinition, ThemeId };

const THEME_STATE_KEY = 'shared-theme';

/** The theme the boot script (or an earlier `setTheme`) put on <html>. */
const readDocumentTheme = (): ThemeId => {
  const current = document.documentElement.getAttribute('data-theme');
  return isThemeId(current) ? current : DEFAULT_THEME;
};

const persistTheme = (id: ThemeId) => {
  const domain = themeCookieDomain(window.location.hostname);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${THEME_STORAGE_KEY}=${encodeURIComponent(id)}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}` +
    `; SameSite=Lax${domain ? `; Domain=${domain}` : ''}${secure}`;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // Storage blocked (private window, site data off) — the cookie still holds it.
  }
};

/**
 * Nuxt UI ships `@nuxtjs/color-mode`, and every app pins it to `dark`, which puts
 * `class="dark"` on <html> for the library's `dark:` variants. Follow the theme's
 * scheme so a light theme does not keep dark-variant styles. Absent module → no-op.
 */
const syncColorMode = (id: ThemeId) => {
  const scheme = THEMES.find((item) => item.id === id)?.scheme ?? 'dark';
  const colorMode = (useNuxtApp() as { $colorMode?: { preference: string } }).$colorMode;
  if (colorMode && colorMode.preference !== scheme) colorMode.preference = scheme;
};

/**
 * The active colour theme of the design system.
 *
 * The theme is a `data-theme` attribute on <html>; every `--hm-*` token switches
 * with it, so nothing else re-renders. The choice is a per-browser preference
 * (cookie on the platform's parent domain + localStorage) — it is not an account
 * setting yet.
 *
 * The state starts at the default on the server and on the client alike (so an
 * SSR page hydrates without a mismatch) and is synced from <html> once mounted.
 */
export function useTheme() {
  const theme = useState<ThemeId>(THEME_STATE_KEY, () => DEFAULT_THEME);

  if (import.meta.client && getCurrentInstance()) {
    onMounted(() => {
      theme.value = readDocumentTheme();
      syncColorMode(theme.value);
    });
  }

  const setTheme = (id: ThemeId) => {
    if (!isThemeId(id)) return;
    theme.value = id;
    if (!import.meta.client) return;
    document.documentElement.setAttribute('data-theme', id);
    persistTheme(id);
    syncColorMode(id);
  };

  const current = computed<ThemeDefinition>(
    () => THEMES.find((item) => item.id === theme.value) ?? THEMES[0]!,
  );

  return { theme, current, themes: THEMES, setTheme };
}
