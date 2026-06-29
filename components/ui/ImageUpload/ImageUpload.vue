<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

import { ACCEPTED_IMAGE_TYPES } from '~/services/files.service';
import { NOT_AN_IMAGE_ERROR, useFilesStore } from '~/stores/files.store';
import type { FileDTO } from '~/types/file';

/** SVG is a vector — cropping/rasterizing it loses scalability, so it uploads as-is. */
const SVG_MIME_TYPE = 'image/svg+xml';
/** Raster types the cropper can re-encode; everything else falls back to PNG output. */
const LOSSY_OUTPUT_TYPES = ['image/jpeg', 'image/webp'];
const PNG_MIME_TYPE = 'image/png';

interface Props {
  /** Logical upload key/slot (keys the store's progress/error state). */
  uploadKey: string;
  /** Currently-rendered image URL (preview). */
  imageUrl?: string | null;
  /** Visual aspect of the preview region: 'avatar' (square) or 'banner' (wide). */
  shape?: 'avatar' | 'banner';
  /** Accessible label / heading for the control. */
  label?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  imageUrl: null,
  shape: 'avatar',
  label: '',
  disabled: false,
});

const emit = defineEmits<{
  uploaded: [file: FileDTO];
  error: [message: string];
  clear: [];
}>();

const { t } = useI18n();
const filesStore = useFilesStore();

const inputEl = ref<HTMLInputElement | null>(null);
const acceptAttr = ACCEPTED_IMAGE_TYPES.join(',');

/** Source for the crop editor: object URL + original name/type of the picked file. */
const cropSource = ref<{ url: string; name: string; type: string } | null>(null);

const state = computed(() => filesStore.stateFor(props.uploadKey));
const isUploading = computed(() => state.value.isUploading);
const progress = computed(() => state.value.progress);

const errorMessage = computed(() => {
  const err = state.value.error;
  if (!err) return '';
  if (err === NOT_AN_IMAGE_ERROR) return t('files.errorNotImage');
  return err;
});

const openPicker = () => {
  if (props.disabled || isUploading.value) return;
  inputEl.value?.click();
};

const requestClear = () => {
  if (props.disabled || isUploading.value) return;
  emit('clear');
};

const upload = async (file: File) => {
  try {
    const dto = await filesStore.uploadImage(props.uploadKey, file);
    emit('uploaded', dto);
  } catch {
    emit('error', errorMessage.value || t('files.errorUploadFailed'));
  }
};

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  // Reset the input so selecting the same file again still fires `change`.
  target.value = '';
  if (!file) return;

  if (!filesStore.isAcceptedImage(file)) {
    emit('error', t('files.errorNotImage'));
    return;
  }

  // Vectors skip the cropper and upload directly; raster images go through it.
  if (file.type === SVG_MIME_TYPE) {
    void upload(file);
    return;
  }

  closeCropper();
  cropSource.value = { url: URL.createObjectURL(file), name: file.name, type: file.type };
};

const cropOutputType = computed(() => {
  const type = cropSource.value?.type ?? '';
  return LOSSY_OUTPUT_TYPES.includes(type) ? type : PNG_MIME_TYPE;
});

const closeCropper = () => {
  if (cropSource.value) URL.revokeObjectURL(cropSource.value.url);
  cropSource.value = null;
};

/** Swap the picked file's extension to match the cropper's output type. */
const outputFileName = (name: string, type: string) => {
  const base = name.replace(/\.[^.]+$/, '') || 'image';
  const ext = type === PNG_MIME_TYPE ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return `${base}.${ext}`;
};

const onCropConfirm = (blob: Blob) => {
  const source = cropSource.value;
  if (!source) return;
  const name = outputFileName(source.name, cropOutputType.value);
  const file = new File([blob], name, { type: cropOutputType.value });
  closeCropper();
  void upload(file);
};

onBeforeUnmount(closeCropper);
</script>

<template>
  <div class="image-upload">
    <span
      v-if="label"
      class="image-upload__label"
      >{{ label }}</span
    >

    <button
      type="button"
      class="image-upload__preview"
      :class="[`image-upload__preview--${shape}`, { 'image-upload__preview--busy': isUploading }]"
      :disabled="disabled || isUploading"
      :aria-label="label || t('upload.choose')"
      @click="openPicker"
    >
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="label || t('upload.choose')"
        class="image-upload__img"
      />
      <span
        v-else
        class="image-upload__placeholder"
      >
        <UiAppIcon
          name="photo"
          color="var(--hm-muted)"
        />
      </span>

      <span
        v-if="isUploading"
        class="image-upload__overlay"
      >
        <span class="image-upload__progress">{{ progress }}%</span>
      </span>
    </button>

    <div class="image-upload__actions">
      <UiButton
        variant="cyan"
        size="sm"
        icon="arrow-up-tray"
        :loading="isUploading"
        :disabled="disabled"
        @click="openPicker"
      >
        {{ imageUrl ? t('upload.replace') : t('upload.choose') }}
      </UiButton>
      <UiButton
        v-if="imageUrl"
        variant="red"
        size="sm"
        icon="trash"
        :disabled="disabled || isUploading"
        @click="requestClear"
      >
        {{ t('upload.remove') }}
      </UiButton>
      <span class="image-upload__hint">{{ t('files.acceptHint') }}</span>
    </div>

    <UiBanner
      v-if="errorMessage"
      variant="error"
      >{{ errorMessage }}</UiBanner
    >

    <input
      ref="inputEl"
      type="file"
      class="image-upload__input"
      :accept="acceptAttr"
      @change="onFileChange"
    />

    <UiImageCropper
      v-if="cropSource"
      :src="cropSource.url"
      :shape="shape"
      :output-type="cropOutputType"
      :title="label"
      @confirm="onCropConfirm"
      @cancel="closeCropper"
    />
  </div>
</template>

<style scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-upload__label {
  font-family: 'Syne', sans-serif;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--hm-muted);
}

.image-upload__preview {
  position: relative;
  padding: 0;
  background: var(--hm-bg);
  border: 1px solid var(--hm-border);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s;
}

.image-upload__preview:hover:not(:disabled) {
  border-color: rgba(0, 212, 255, 0.3);
}

.image-upload__preview:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.image-upload__preview--avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
}

.image-upload__preview--banner {
  width: 100%;
  height: 120px;
}

.image-upload__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-upload__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.image-upload__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 12, 16, 0.7);
}

.image-upload__progress {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--hm-accent);
}

.image-upload__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.image-upload__hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--hm-muted);
}

.image-upload__input {
  display: none;
}
</style>
