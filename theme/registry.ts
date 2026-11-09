/**
 * The theme registry — plain TypeScript with no Nuxt dependency, because two very
 * different places read it: `composables/use-theme.ts` at run time, and the layer's
 * `nuxt.config.ts`, which inlines `THEME_BOOT_SCRIPT` into every page's <head>.
 *
 * A theme is a `:root[data-theme='<id>']` block in `assets/styles/themes/<id>.css`.
 * Adding one is: write that file, import it in `hm-base.css`, list it here.
 */

export type ThemeId = 'nocturne' | 'daylight';

export interface ThemeDefinition {
  id: ThemeId;
  /** Shown in the switcher. A proper name, so it is not translated. */
  label: string;
  /** Which way the palette leans — drives `color-scheme` and the switcher icon. */
  scheme: 'dark' | 'light';
}

export const THEMES: readonly ThemeDefinition[] = [
  { id: 'nocturne', label: 'Nocturne', scheme: 'dark' },
  { id: 'daylight', label: 'Daylight', scheme: 'light' },
];

/** The palette a page has before anyone picks one. Also the bare-`:root` theme. */
export const DEFAULT_THEME: ThemeId = 'nocturne';

/**
 * Where the choice is kept. A cookie on the platform's parent domain
 * (`*.bh.localhost`, `*.bloodheaven.nexus`) so one pick follows the user across
 * every app, plus `localStorage` as the fallback for hosts that cannot share a
 * cookie (a bare `localhost`, an IP, a public suffix the browser refuses).
 */
export const THEME_STORAGE_KEY = 'bh-theme';

/** One year — a preference, not a session. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && THEMES.some((theme) => theme.id === value);

/**
 * The cookie domain for a hostname: its last two labels, so `auth.bh.localhost`
 * and `tasks.bh.localhost` share `bh.localhost`. `undefined` for a single-label
 * host or an IP address, where a host-only cookie is all a browser allows.
 */
export const themeCookieDomain = (hostname: string): string | undefined => {
  if (/^[\d.]+$/.test(hostname) || hostname.includes(':')) return undefined;
  const labels = hostname.split('.');
  return labels.length >= 2 ? labels.slice(-2).join('.') : undefined;
};

/**
 * Runs in <head> before the first paint and before Vue boots: puts the stored
 * theme on <html>, so a daylight user never sees a nocturne flash (the gated apps
 * show their `spa-loading-template` splash while the auth middleware runs, and that
 * splash must already be in the right palette). An unknown id is ignored and the
 * default applies. Kept dependency-free and tiny — it is inlined into every page.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)},ids=${JSON.stringify(
  THEMES.map((theme) => theme.id),
)},m=document.cookie.match(new RegExp('(?:^|; )'+k+'=([^;]*)')),t=m?decodeURIComponent(m[1]):null;if(!t)try{t=localStorage.getItem(k)}catch(e){}if(t&&ids.indexOf(t)>=0)document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
