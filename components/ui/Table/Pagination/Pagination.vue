<script setup lang="ts">
interface Props {
  total: number;
  pageSize: number;
  /**
   * Phone layout (mobility § M9.1): fewer page numbers and no first/last jumps,
   * so seven 44px targets still fit inside a 360px viewport's gutters.
   */
  compact?: boolean;
}

const { total, pageSize, compact = false } = defineProps<Props>();

const currentPage = defineModel<number>({ default: 1 });

const pages = computed(() => {
  const totalPages = Math.ceil(total / pageSize);
  const maxVisible = compact ? 3 : 5;
  const current = currentPage.value || 1;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  let start = Math.max(current - Math.floor(maxVisible / 2), 1);
  let end = start + maxVisible - 1;

  if (end > totalPages) {
    end = totalPages;
    start = end - maxVisible + 1;
  }

  return Array.from({ length: maxVisible }, (_, i) => start + i);
});

const totalPages = computed(() => Math.ceil(total / pageSize));

const onFirst = () => {
  currentPage.value = 1;
};

const onLast = () => {
  currentPage.value = totalPages.value;
};

const onPage = (page: number) => {
  currentPage.value = page;
};

const onNext = () => {
  currentPage.value = Math.min((currentPage.value || 1) + 1, totalPages.value);
};

const onPrevious = () => {
  currentPage.value = Math.max((currentPage.value || 1) - 1, 1);
};
</script>

<template>
  <div class="flex items-center justify-center gap-1">
    <button
      v-if="!compact"
      class="hm-pg-btn"
      :class="{ 'hm-pg-btn--disabled': currentPage === 1 }"
      :disabled="currentPage === 1"
      @click="onFirst"
    >
      <UiAppIcon
        class="w-[14px] h-[14px]"
        name="chevron-double-left"
        color="currentColor"
      />
    </button>

    <button
      class="hm-pg-btn"
      :class="{ 'hm-pg-btn--disabled': currentPage === 1 }"
      :disabled="currentPage === 1"
      @click="onPrevious"
    >
      <UiAppIcon
        class="w-[14px] h-[14px]"
        name="chevron-left"
        color="currentColor"
      />
    </button>

    <button
      v-for="page in pages"
      :key="page"
      class="hm-pg-btn hm-pg-btn--num"
      :class="{ 'hm-pg-btn--active': currentPage === page }"
      @click="onPage(page)"
    >
      {{ page }}
    </button>

    <button
      class="hm-pg-btn"
      :class="{ 'hm-pg-btn--disabled': currentPage === totalPages }"
      :disabled="currentPage === totalPages"
      @click="onNext"
    >
      <UiAppIcon
        class="w-[14px] h-[14px]"
        name="chevron-right"
        color="currentColor"
      />
    </button>

    <button
      v-if="!compact"
      class="hm-pg-btn"
      :class="{ 'hm-pg-btn--disabled': currentPage === totalPages }"
      :disabled="currentPage === totalPages"
      @click="onLast"
    >
      <UiAppIcon
        class="w-[14px] h-[14px]"
        name="chevron-double-right"
        color="currentColor"
      />
    </button>
  </div>
</template>

<style scoped>
.hm-pg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 6px 8px;
  background: var(--hm-surface);
  border: 1px solid var(--hm-border);
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--hm-text);
  cursor: pointer;
  transition: all 0.15s;
}

.hm-pg-btn:hover:not(:disabled) {
  background: rgba(0, 212, 255, 0.08);
  border-color: rgba(0, 212, 255, 0.3);
  color: var(--hm-accent);
}

.hm-pg-btn--active {
  background: var(--hm-accent) !important;
  color: #0a0e17 !important;
  border-color: var(--hm-accent) !important;
}

.hm-pg-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Mobility § M9.1 / § M21 — page buttons are the densest tap targets in a list
   view; they land on the touch floor like everything else. */
@media (max-width: 768px) {
  .hm-pg-btn {
    min-width: 44px;
    height: 44px;
    font-size: 13px;
  }
}
</style>
