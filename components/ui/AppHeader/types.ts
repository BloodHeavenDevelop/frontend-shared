import type { MobileNavGroup, MobileNavLink, MobileNavMeta } from '../MobileNav/types';

/**
 * Navigation entries of the application shell. Structurally the same shape
 * <UiMobileNav> takes, so one array feeds the desktop header and the phone tab bar.
 * `dividerBefore` draws the header's 1px divider in front of the entry — the way an
 * app separates its own groups (it is ignored on the phone, where groups get headings).
 */
export type AppNavLink = MobileNavLink & { dividerBefore?: boolean };

export type AppNavGroup = Omit<MobileNavGroup, 'items'> & {
  items: MobileNavLink[];
  dividerBefore?: boolean;
};

export type AppNavEntry = AppNavLink | AppNavGroup;

/** The footer's status slots (manifest § 6.3). `buildSha` may be the full hash. */
export type AppMeta = MobileNavMeta;

/** Decides whether a route path lights its nav entry up. */
export type AppNavActiveMatcher = (to: string) => boolean;

export const isAppNavGroup = (entry: AppNavEntry): entry is AppNavGroup => 'items' in entry;
