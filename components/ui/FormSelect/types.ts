import type { MultiSelectTone } from '../MultiSelect/types';

export interface FormSelectOption {
  label: string;
  value: string | number;
  /** Right-aligned muted text after the label (a code, an offset); search matches it too. */
  hint?: string;
  /** Right-aligned muted figure — usually how many rows carry this value. */
  count?: number | string;
  /** Status tone — a still dot before the label (manifest § 12.2). */
  tone?: MultiSelectTone;
  disabled?: boolean;
}
