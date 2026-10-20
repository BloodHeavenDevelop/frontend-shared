export interface DateRangeFilterValue {
  from: string;
  to: string;
}

/** The range presets in the picker's sidebar, in display order. */
export type DateRangePresetKey =
  'today' | 'yesterday' | 'last7Days' | 'last30Days' | 'thisMonth' | 'thisYear';
