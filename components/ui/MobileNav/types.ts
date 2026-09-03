/**
 * Shapes accepted by <UiMobileNav>. They are structural on purpose: every
 * application already computes this exact shape for its desktop header nav, so
 * the mobile bar consumes the same array without a second source of truth.
 */
export type MobileNavLink = {
  to: string;
  label: string;
};

export type MobileNavGroup = {
  label: string;
  items: MobileNavLink[];
};

export type MobileNavEntry = MobileNavLink | MobileNavGroup;

/**
 * The footer's required slots (manifest § 6.3), relocated into the nav sheet —
 * a phone user must still be able to tell which build and environment they are
 * looking at (mobility § M6).
 */
export type MobileNavMeta = {
  version?: string;
  buildSha?: string;
  env?: string;
  online?: boolean;
};

export const isMobileNavGroup = (entry: MobileNavEntry): entry is MobileNavGroup =>
  'items' in entry;
