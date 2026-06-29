<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import { NuxtLink } from '#components';
import Pagination from '../Table/Pagination/Pagination.vue';
import type { TableColumn } from '../Table/types';
import { useTableColumnPreferences } from '~/composables/use-table-column-preferences';

const props = withDefaults(
  defineProps<{
    columns: TableColumn<string>[];
    rows?: Record<string, unknown>[];
    itemsCount: number;
    page: number;
    rowsPerPage: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    globalSearch?: string;
    noActionRow?: boolean; // deprecated — action column removed by default
    loading?: boolean;
    getRowLink?: (row: Record<string, unknown>) => RouteLocationRaw | null | undefined;
    inputSearchClass?: string;
    cellClass?: string;
    tableDataKey?: string;
    tableId?: string;
    isCsvDownload?: boolean;
    tableTitle?: string;
  }>(),
  {
    rows: () => [],
    getRowLink: undefined,
    sortBy: '',
    sortDirection: 'asc',
    globalSearch: '',
    inputSearchClass: '',
    cellClass: '',
    tableDataKey: '',
    tableId: '',
    isCsvDownload: false,
    tableTitle: undefined,
  },
);

const emit = defineEmits<{
  (e: 'update:page' | 'update:rowsPerPage', value: number): void;
  (e: 'update:globalSearch', value: string): void;
  (e: 'update:sort', payload: { sortBy: string }): void;
  (e: 'update:filter', payload: { filterBy: string; value: unknown }): void;
  (e: 'reset-filters' | 'refresh-table' | 'download-csv'): void;
}>();

const pageRowsOptions = [10, 20, 50, 100] as unknown as string[];

const tableRows = computed(() => props.rows ?? []);

function onRowsPerPageChange(value: number) {
  emit('update:page', 1);
  emit('update:rowsPerPage', value);
}

function toggleSort(column?: string) {
  if (column) {
    emit('update:sort', { sortBy: column });
  }
}

function onFilterChange(key: string, value: unknown) {
  emit('update:filter', { filterBy: key, value });
}

function resetAllFilters() {
  emit('reset-filters');
}

function getFilterComponent(column: TableColumn<string>) {
  if (column.filterType === 'select') return 'select';
  if (column.filterType === 'date') return 'input-date';
  return 'input';
}

function getCellClasses(column: TableColumn<string>, row: Record<string, unknown>) {
  const expanded = column.expandable && isRowExpanded(row?.id as string | number);
  const classes: string[] = [];

  if (column.textWrap || expanded) {
    classes.push('whitespace-normal break-all');
  } else {
    classes.push('truncate break-all');
  }

  if (column.sticky) {
    classes.push('grid-cell--sticky');
  }

  return classes.join(' ');
}

function getHeaderCellClasses(column: TableColumn<string>) {
  const classes: string[] = [];
  if (column.sortBy) classes.push('cursor-pointer');
  else classes.push('cursor-default');
  if (column.sticky) classes.push('grid-cell--sticky');
  return classes.join(' ');
}

function getCellStickyStyle(column: TableColumn<string>) {
  if (!column.sticky) return {};
  return {
    position: 'sticky' as const,
    [column.sticky]: '0',
    zIndex: 2,
  };
}

const columnMenuOpen = ref(false);

function closeColumnMenu() {
  columnMenuOpen.value = false;
}

function onColumnMenuToggle(event: MouseEvent) {
  event.stopPropagation();
  columnMenuOpen.value = !columnMenuOpen.value;
}

function onWindowMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (!target.closest('.hm-column-toggle-wrapper')) {
    closeColumnMenu();
  }
}

watch(columnMenuOpen, (open) => {
  if (!import.meta.client) return;
  if (open) {
    window.addEventListener('mousedown', onWindowMouseDown);
  } else {
    window.removeEventListener('mousedown', onWindowMouseDown);
  }
});

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('mousedown', onWindowMouseDown);
  }
});

function isColumnToggleable(column: TableColumn<string>) {
  return column.hidable !== false;
}

function visibleColumnCount() {
  return displayColumns.value.length;
}

function onColumnVisibilityChange(column: TableColumn<string>, willHide: boolean) {
  if (willHide && visibleColumnCount() <= 1 && !isHidden(column.key as string)) return;
  toggleHidden(column.key as string);
}

const preferencesId = computed(() => props.tableId || props.tableDataKey || '');
const columnsRef = toRef(props, 'columns');
const { displayColumns, widths, reorder, setWidth, isHidden, toggleHidden, MIN_COLUMN_WIDTH_PX } =
  useTableColumnPreferences(preferencesId, columnsRef);

const showToggleColumn = computed(() => !!preferencesId.value);

const gridTemplateStyle = computed(() => {
  const columnStyles = displayColumns.value.map((col) => {
    const persistedWidth = widths.value[col.key as string];
    if (persistedWidth) return `${persistedWidth}px`;

    if (col.width === 'auto') {
      const w = col.maxWidth ? `${col.maxWidth}px` : col.minWidth ? `${col.minWidth}px` : 'auto';
      return w;
    }

    const min = col.minWidth ? `${col.minWidth}px` : 'auto';

    if (col.maxWidth) {
      return `minmax(${min}, ${col.maxWidth}px)`;
    }

    return `minmax(${min}, 1fr)`;
  });
  return { gridTemplateColumns: columnStyles.join(' ') };
});

const draggingKey = ref<string | null>(null);
const dragOverKey = ref<string | null>(null);

function isReorderable(column: TableColumn<string>) {
  return !!preferencesId.value && !column.sticky;
}

function onHeaderDragStart(event: DragEvent, column: TableColumn<string>) {
  if (!isReorderable(column)) return;
  draggingKey.value = column.key as string;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', column.key as string);
  }
}

function onHeaderDragOver(event: DragEvent, column: TableColumn<string>) {
  if (!isReorderable(column) || !draggingKey.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  dragOverKey.value = column.key as string;
}

function onHeaderDragLeave(column: TableColumn<string>) {
  if (dragOverKey.value === (column.key as string)) {
    dragOverKey.value = null;
  }
}

function onHeaderDrop(event: DragEvent, column: TableColumn<string>) {
  if (!isReorderable(column) || !draggingKey.value) return;
  event.preventDefault();
  reorder(draggingKey.value, column.key as string);
  draggingKey.value = null;
  dragOverKey.value = null;
}

function onHeaderDragEnd() {
  draggingKey.value = null;
  dragOverKey.value = null;
}

const resizingState = ref<{ key: string; startX: number; startWidth: number } | null>(null);

function onResizeStart(event: PointerEvent, column: TableColumn<string>) {
  if (!preferencesId.value) return;
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget as HTMLElement | null;
  const headerCell = handle?.parentElement as HTMLElement | null;
  const startWidth = headerCell?.getBoundingClientRect().width ?? MIN_COLUMN_WIDTH_PX;
  resizingState.value = {
    key: column.key as string,
    startX: event.clientX,
    startWidth,
  };
  document.body.classList.add('hm-table-resizing');
  window.addEventListener('pointermove', onResizeMove);
  window.addEventListener('pointerup', onResizeEnd);
  window.addEventListener('pointercancel', onResizeEnd);
}

function onResizeMove(event: PointerEvent) {
  if (!resizingState.value) return;
  const delta = event.clientX - resizingState.value.startX;
  setWidth(resizingState.value.key, resizingState.value.startWidth + delta);
}

function onResizeEnd() {
  resizingState.value = null;
  document.body.classList.remove('hm-table-resizing');
  window.removeEventListener('pointermove', onResizeMove);
  window.removeEventListener('pointerup', onResizeEnd);
  window.removeEventListener('pointercancel', onResizeEnd);
}

onBeforeUnmount(() => {
  if (resizingState.value) onResizeEnd();
});

function onPageChange(newPage: number) {
  emit('update:page', newPage);
}

const expandedRows = ref<Set<string | number>>(new Set());

function isRowExpanded(id: string | number) {
  return expandedRows.value.has(id);
}

function toggleRowExpanded(id: string | number) {
  const next = new Set(expandedRows.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  expandedRows.value = next;
}

const refreshTableData = () => {
  if (!props.tableDataKey) return;
  if (typeof refreshNuxtData === 'function') {
    try {
      refreshNuxtData(props.tableDataKey);
    } catch (error) {
      console.error('Failed to refresh Nuxt data:', error);
    }
  }
};
</script>

<template>
  <div class="hm-table-container">
    <div
      class="data-table relative flex flex-col"
      :class="[{ 'h-full': rows.length === 0 && !loading }]"
    >
      <!-- Loading Overlay -->
      <div
        v-if="loading"
        class="absolute inset-0 bg-hm-bg/80 z-50 flex justify-center items-center backdrop-blur-sm"
      >
        <div class="flex justify-center py-6 h-fit text-hm-accent">
          <slot name="loader">
            <UiCircularLoader class="text-[48px]" />
          </slot>
        </div>
      </div>

      <!-- No Data Placeholder -->
      <div
        v-if="rows.length === 0 && !loading"
        class="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40"
      >
        <slot name="placeholder">
          <div class="hm-empty-state">Nothing found</div>
        </slot>
      </div>

      <!-- Controls bar -->
      <div class="hm-controls-bar">
        <div class="hm-controls-bar__left">
          <input
            :value="globalSearch"
            type="text"
            class="hm-input hm-controls-search"
            placeholder="Search..."
            @input="emit('update:globalSearch', ($event.target as HTMLInputElement).value)"
          />
          <slot name="controls-left" />
        </div>

        <div class="hm-controls-bar__right">
          <slot name="controls-prepend" />

          <UiIconButton
            v-if="props.tableDataKey"
            variant="toolbar"
            title="Refresh table"
            @click="refreshTableData"
          >
            <UiAppIcon
              name="arrow-path"
              class="w-[14px] h-[14px]"
              color="var(--hm-muted)"
              stroke-width="1.5"
            />
          </UiIconButton>

          <slot name="controls-append" />

          <UiIconButton
            v-if="props.isCsvDownload"
            variant="toolbar"
            title="Download CSV"
            @click="emit('download-csv')"
          >
            <UiAppIcon
              name="arrow-down-tray"
              class="w-[14px] h-[14px]"
              color="var(--hm-muted)"
              stroke-width="1.5"
            />
          </UiIconButton>
        </div>
      </div>

      <slot name="above-table" />

      <!-- Table -->
      <div
        class="hm-table-scroll relative pb-1"
        :class="[{ 'flex-1': rows.length === 0 && !loading }]"
      >
        <div class="hm-table-inner">
          <div class="grid-table">
            <!-- Header Row -->
            <div
              class="grid-row grid-row--header"
              :style="gridTemplateStyle"
            >
              <div
                v-for="(column, index) in displayColumns"
                :key="column.key"
                class="grid-cell grid-cell--header"
                :class="[
                  getHeaderCellClasses(column),
                  {
                    'grid-cell--draggable': isReorderable(column),
                    'grid-cell--dragging': draggingKey === column.key,
                    'grid-cell--drag-over':
                      dragOverKey === column.key && draggingKey && draggingKey !== column.key,
                  },
                ]"
                :style="getCellStickyStyle(column)"
                :draggable="isReorderable(column)"
                @click="toggleSort(column.sortBy)"
                @dragstart="onHeaderDragStart($event, column)"
                @dragover="onHeaderDragOver($event, column)"
                @dragleave="onHeaderDragLeave(column)"
                @drop="onHeaderDrop($event, column)"
                @dragend="onHeaderDragEnd"
              >
                <slot
                  :name="`${String(column.key)}-header`"
                  :column="column"
                >
                  <span class="hm-th-label">{{ column.label }}</span>
                </slot>
                <template v-if="column.sortBy">
                  <span class="flex flex-col ml-1">
                    <ClientOnly>
                      <UiAppIcon
                        class="w-3 h-[5px]"
                        :class="{
                          'opacity-100': sortBy === column.sortBy && sortDirection === 'asc',
                          'opacity-40': sortBy !== column.sortBy || sortDirection !== 'asc',
                        }"
                        name="sort-arrow-up"
                        :paint="'fill'"
                      />
                      <UiAppIcon
                        class="w-3 h-[5px]"
                        :class="{
                          'opacity-100': sortBy === column.sortBy && sortDirection === 'desc',
                          'opacity-40': sortBy !== column.sortBy || sortDirection !== 'desc',
                        }"
                        name="sort-arrow-down"
                        :paint="'fill'"
                      />
                    </ClientOnly>
                  </span>
                </template>
                <span
                  v-if="preferencesId"
                  class="grid-cell__resizer"
                  :class="{ 'grid-cell__resizer--active': resizingState?.key === column.key }"
                  title="Drag to resize"
                  @pointerdown="onResizeStart($event, column)"
                  @click.stop
                />

                <div
                  v-if="showToggleColumn && index === displayColumns.length - 1"
                  class="hm-column-toggle-wrapper"
                  @click.stop
                >
                  <button
                    type="button"
                    class="hm-column-toggle-btn"
                    :class="{ 'hm-column-toggle-btn--active': columnMenuOpen }"
                    title="Toggle columns"
                    aria-haspopup="menu"
                    :aria-expanded="columnMenuOpen"
                    @click.stop="onColumnMenuToggle"
                  >
                    <UiAppIcon
                      name="heroicons:view-columns"
                      class="w-[14px] h-[14px]"
                    />
                  </button>

                  <div
                    v-if="columnMenuOpen"
                    class="hm-column-menu"
                    role="menu"
                    @click.stop
                  >
                    <div class="hm-column-menu__title">Columns</div>
                    <ul class="hm-column-menu__list">
                      <li
                        v-for="col in columns"
                        :key="col.key"
                        class="hm-column-menu__item"
                      >
                        <label
                          class="hm-column-menu__label"
                          :class="{ 'hm-column-menu__label--disabled': !isColumnToggleable(col) }"
                        >
                          <input
                            type="checkbox"
                            :checked="!isHidden(col.key as string)"
                            :disabled="!isColumnToggleable(col)"
                            @change="
                              onColumnVisibilityChange(
                                col,
                                ($event.target as HTMLInputElement).checked === false,
                              )
                            "
                          />
                          <span>{{ col.label || col.key }}</span>
                        </label>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Data Rows -->
            <component
              :is="getRowLink && getRowLink(row) ? NuxtLink : 'div'"
              v-for="row in tableRows"
              :key="row.id as string"
              class="grid-row grid-row--body"
              :to="getRowLink && getRowLink(row) ? getRowLink(row) : undefined"
              :style="gridTemplateStyle"
            >
              <div
                v-for="column in displayColumns"
                :key="column.key"
                class="grid-cell grid-cell--body"
                :class="[
                  getCellClasses(column, row),
                  { expanded: column.expandable && isRowExpanded(row.id as string | number) },
                  cellClass,
                ]"
                :style="getCellStickyStyle(column)"
              >
                <UiIconButton
                  v-if="column.expandable"
                  variant="custom"
                  class="mr-2 !w-[18px] !h-[18px] shrink-0 !p-0 rounded"
                  :aria-expanded="isRowExpanded(row.id as string | number)"
                  aria-label="Toggle row"
                  @click.stop.prevent="toggleRowExpanded(row.id as string | number)"
                >
                  <UiAppIcon
                    name="my-icons:chevron-down"
                    class="transition-transform duration-200 w-[18px] h-[18px]"
                    :class="isRowExpanded(row.id as string | number) ? 'rotate-180' : 'rotate-0'"
                  />
                </UiIconButton>

                <template v-if="column.expandable && isRowExpanded(row.id as string | number)">
                  <slot
                    :name="`${String(column.key)}-expanded`"
                    :row="row"
                  >
                    {{ row[column.key] }}
                  </slot>
                </template>
                <template v-else>
                  <slot
                    :name="`${String(column.key)}-data`"
                    :row="row"
                  >
                    {{ row[column.key] || '-' }}
                  </slot>
                </template>
              </div>
            </component>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="rows.length"
        class="hm-pagination-bar"
      >
        <div class="hm-pagination-info">
          <label>Rows per page:</label>
          <USelectMenu
            :model-value="rowsPerPage"
            :options="pageRowsOptions"
            size="xs"
            class="h-[32px] shadow-none"
            :popper="{ strategy: 'fixed', placement: 'bottom' }"
            :ui="{
              strategy: 'override',
              padding: { xs: 'pl-[18px] pr-[18px] py-1.5' },
              base: 'border border-hm-border rounded-[6px] text-hm-text bg-hm-surface',
              icon: { base: 'hidden' },
              size: { xs: 'text-[12px]' },
              trailing: { padding: { xs: 'text-hm-text' } },
              color: { white: { outline: 'shadow-none ring-0' } },
            }"
            :ui-menu="{
              width: 'w-[80px]',
              base: 'bg-hm-surface border border-hm-border',
              option: {
                base: 'hover:!bg-[rgba(0,212,255,0.08)] hover:!text-hm-accent rounded-none',
              },
            }"
            @update:model-value="onRowsPerPageChange"
          />

          <span>
            Showing {{ (page - 1) * rowsPerPage + 1 }} to
            {{ Math.min(page * rowsPerPage, props.itemsCount) }} ({{ props.itemsCount }}
            total)
          </span>
        </div>
        <Pagination
          v-if="itemsCount > rowsPerPage"
          :model-value="props.page"
          :page-size="rowsPerPage"
          :total="itemsCount ?? 0"
          @update:model-value="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.hm-table-container {
  background: var(--hm-surface);
  border: 1px solid var(--hm-border);
  border-radius: 10px;
  padding: 20px;
  min-height: 100%;
}

/* Controls bar */
.hm-controls-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.hm-controls-bar__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hm-controls-bar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hm-controls-search {
  width: 220px;
  height: 30px;
}

/* Grid Table */
.hm-table-scroll {
  overflow-x: auto;
  min-height: 350px;
}

.hm-table-scroll::-webkit-scrollbar {
  height: 4px;
}

.hm-table-scroll::-webkit-scrollbar-thumb {
  background: var(--hm-border);
  border-radius: 2px;
}

.hm-table-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.hm-table-inner {
  position: relative;
  min-width: 100%;
}

.grid-table {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.grid-row {
  display: grid;
  width: 100%;
}

/* Header row */
.grid-row--header {
  border-bottom: 1px solid var(--hm-border);
}

.grid-cell--header {
  padding: 10px 16px;
  position: relative;
  user-select: none;
}

.grid-cell--header.actions {
  align-items: flex-start;
}

.grid-cell--draggable {
  cursor: grab;
}

.grid-cell--draggable:active {
  cursor: grabbing;
}

.grid-cell--dragging {
  opacity: 0.5;
}

.grid-cell--drag-over {
  box-shadow: inset 2px 0 0 0 var(--hm-accent);
}

.grid-cell__resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  user-select: none;
  touch-action: none;
  z-index: 3;
}

.grid-cell__resizer:hover,
.grid-cell__resizer--active {
  background: linear-gradient(
    to right,
    transparent 0,
    transparent 2px,
    var(--hm-accent) 2px,
    var(--hm-accent) 4px,
    transparent 4px
  );
}

:global(body.hm-table-resizing) {
  cursor: col-resize !important;
  user-select: none !important;
}

/* Column visibility toggle */
.hm-column-toggle-wrapper {
  margin-left: auto;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  position: relative;
}

.hm-column-toggle-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--hm-border);
  border-radius: 6px;
  background: var(--hm-surface);
  color: var(--hm-muted);
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
}

.hm-column-toggle-btn:hover,
.hm-column-toggle-btn--active {
  color: var(--hm-accent);
  border-color: var(--hm-accent);
  background: rgba(0, 212, 255, 0.08);
}

.hm-column-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 200px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--hm-surface);
  border: 1px solid var(--hm-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 8px 0;
  z-index: 50;
}

.hm-column-menu__title {
  padding: 4px 12px 8px;
  font-family: 'Syne', sans-serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hm-muted);
  border-bottom: 1px solid var(--hm-border);
  margin-bottom: 4px;
}

.hm-column-menu__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.hm-column-menu__item {
  margin: 0;
}

.hm-column-menu__label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--hm-text);
  cursor: pointer;
  user-select: none;
}

.hm-column-menu__label:hover {
  background: rgba(0, 212, 255, 0.08);
  color: var(--hm-accent);
}

.hm-column-menu__label--disabled {
  cursor: not-allowed;
  color: var(--hm-muted);
}

.hm-column-menu__label--disabled:hover {
  background: transparent;
  color: var(--hm-muted);
}

.hm-column-menu__label input[type='checkbox'] {
  accent-color: var(--hm-accent);
  width: 14px;
  height: 14px;
}

.hm-th-label {
  font-family: 'Syne', sans-serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hm-muted);
}

/* Body rows */
.grid-row--body {
  border-bottom: 1px solid rgba(28, 35, 51, 0.5);
  transition: background 0.15s;
  text-decoration: none;
}

.grid-row--body:last-child {
  border-bottom: none;
}

.grid-row--body:hover {
  background: rgba(0, 212, 255, 0.03);
}

.grid-cell--body {
  padding: 10px 16px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--hm-text);
  display: flex;
  align-items: center;
  min-height: 52px;
}

.grid-cell {
  display: flex;
  align-items: center;
}

.grid-cell.expanded {
  align-items: flex-start;
}

.grid-cell--sticky {
  background: var(--hm-surface);
}

.grid-row--body:hover .grid-cell--sticky {
  background: color-mix(in srgb, var(--hm-surface) 97%, rgba(0, 212, 255, 0.03));
}

/* Pagination bar */
.hm-pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0 4px;
  border-top: 1px solid var(--hm-border);
  margin-top: 4px;
}

.hm-pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--hm-muted);
}

.hm-pagination-info label {
  color: var(--hm-muted);
}
</style>
