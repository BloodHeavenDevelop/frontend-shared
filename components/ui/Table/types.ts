export type TableColumn<T> = {
  key: Extract<keyof T, string> | string;
  label?: string;
  sortable?: boolean;
  hidable?: boolean;
  sortingKey?: string;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  sortBy?: string;
  filterBy?: string;
  filterType?: 'text' | 'select' | 'date';
  options?: unknown[];
  textWrap?: boolean;
  expandable?: boolean;
  csvField?: string;
  sticky?: 'left' | 'right';
  defaultHidden?: boolean;
};
