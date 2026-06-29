<script setup lang="ts">
import type { EnvEntry } from '~/utils/parse-env';
import { parseEnvContent } from '~/utils/parse-env';

type InputMode = 'file' | 'text';

const entries = defineModel<EnvEntry[]>('entries', { default: () => [] });

const inputMode = ref<InputMode>('file');
const rawText = ref('');
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const modeOptions: { label: string; value: InputMode }[] = [
  { label: 'Upload file', value: 'file' },
  { label: 'Paste text', value: 'text' },
];

watch(rawText, (val) => {
  entries.value = parseEnvContent(val);
});

watch(inputMode, () => {
  rawText.value = '';
  entries.value = [];
});

async function readFile(file: File) {
  const text = await file.text();
  rawText.value = text;
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) readFile(file);
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) readFile(file);
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function onDragLeave() {
  isDragging.value = false;
}

function openFilePicker() {
  fileInputRef.value?.click();
}

function clearInput() {
  rawText.value = '';
  entries.value = [];
  if (fileInputRef.value) fileInputRef.value.value = '';
}
</script>

<template>
  <div>
    <!-- Mode tabs -->
    <div class="mb-3">
      <UiSegmentedControl
        v-model="inputMode"
        aria-label="Input mode"
        :options="modeOptions"
      />
    </div>

    <!-- File drop zone -->
    <div
      v-if="inputMode === 'file'"
      class="env-drop-zone"
      :class="{ 'env-drop-zone--active': isDragging }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
      @click="openFilePicker"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept=".env,text/plain"
        class="hidden"
        @change="onFileChange"
      />
      <template v-if="!rawText">
        <UiAppIcon
          name="heroicons:arrow-up-tray"
          class="w-6 h-6 text-hm-muted mb-2"
        />
        <p class="text-sm text-hm-muted">
          Drop a <span class="font-mono">.env</span> file here or
          <span class="text-hm-accent underline cursor-pointer">click to browse</span>
        </p>
      </template>
      <template v-else>
        <UiAppIcon
          name="heroicons:document-check"
          class="w-6 h-6 text-hm-ok mb-2"
        />
        <p class="text-sm text-hm-text">
          File loaded — {{ entries.length }} variable{{ entries.length !== 1 ? 's' : '' }} found
        </p>
        <button
          class="mt-1 text-xs text-hm-muted underline"
          type="button"
          @click.stop="clearInput"
        >
          Clear
        </button>
      </template>
    </div>

    <!-- Textarea -->
    <div v-else>
      <textarea
        v-model="rawText"
        class="hm-input w-full font-mono text-xs"
        rows="8"
        placeholder="# Paste .env content here&#10;DATABASE_URL=postgres://...&#10;API_KEY=secret"
      />
    </div>

    <!-- Parsed preview -->
    <div
      v-if="entries.length > 0"
      class="mt-3"
    >
      <p class="text-[10px] font-medium text-hm-muted uppercase tracking-wider mb-2">
        Preview — {{ entries.length }} variable{{ entries.length !== 1 ? 's' : '' }}
      </p>
      <div class="env-preview-list">
        <div
          v-for="entry in entries"
          :key="entry.param"
          class="env-preview-row"
        >
          <span class="font-mono text-hm-accent text-xs truncate">{{ entry.param }}</span>
          <span class="font-mono text-hm-muted text-xs truncate ml-2"
            >= {{ entry.value || '(empty)' }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.env-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  border-radius: 8px;
  border: 2px dashed var(--hm-border);
  cursor: pointer;
  transition: all 0.15s;
  min-height: 110px;
}

.env-drop-zone:hover {
  border-color: rgba(0, 212, 255, 0.3);
  background: rgba(0, 212, 255, 0.03);
}

.env-drop-zone--active {
  border-color: var(--hm-accent);
  background: rgba(0, 212, 255, 0.08);
}

.env-preview-list {
  max-height: 140px;
  overflow-y: auto;
  border-radius: 6px;
  border: 1px solid var(--hm-border);
  background: var(--hm-bg);
}

.env-preview-row {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  border-bottom: 1px solid var(--hm-border);
}

.env-preview-row:last-child {
  border-bottom: none;
}
</style>
