/** Status tone of an option — rendered as a dot before its label (manifest § 12.2). */
export type MultiSelectTone = 'ok' | 'error' | 'warning' | 'active' | 'paused';

export interface MultiSelectOption {
  label: string;
  value: string | number;
  /** Right-aligned muted figure — usually how many rows carry this value. */
  count?: number | string;
  tone?: MultiSelectTone;
  disabled?: boolean;
}

/** `toolbar` — a 30 px table filter (§ 11.6); `form` — a field at the control height (§ 10.7.4). */
export type MultiSelectSize = 'toolbar' | 'form';
