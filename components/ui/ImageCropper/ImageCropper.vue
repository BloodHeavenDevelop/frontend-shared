<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

/** Output canvas sizes (px). Avatar is square; banner mirrors the 470×370 thumbnail ratio. */
const AVATAR_OUTPUT_SIZE = 512;
const BANNER_OUTPUT_WIDTH = 940;
const BANNER_OUTPUT_HEIGHT = 740;

/** On-screen crop frame sizes (px). */
const AVATAR_FRAME_SIZE = 280;
const BANNER_FRAME_WIDTH = 560;
const BANNER_FRAME_HEIGHT = Math.round(
  (BANNER_FRAME_WIDTH * BANNER_OUTPUT_HEIGHT) / BANNER_OUTPUT_WIDTH,
);

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.01;
const WHEEL_ZOOM_SPEED = 0.0015;
const ENCODE_QUALITY = 0.92;
const HALF = 2;

interface Props {
  /** Object URL of the picked image. */
  src: string;
  /** Crop frame shape — drives the frame geometry and output dimensions. */
  shape: 'avatar' | 'banner';
  /** Output MIME type (e.g. the source file's type). */
  outputType?: string;
  /** Modal heading. */
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  outputType: 'image/png',
  title: '',
});

const emit = defineEmits<{
  confirm: [blob: Blob];
  cancel: [];
}>();

const { t } = useI18n();

const imgEl = ref<HTMLImageElement | null>(null);
const naturalW = ref(0);
const naturalH = ref(0);
const zoom = ref(MIN_ZOOM);
const offsetX = ref(0);
const offsetY = ref(0);
const isExporting = ref(false);

const dragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;

const isAvatar = computed(() => props.shape === 'avatar');
const frameW = computed(() => (isAvatar.value ? AVATAR_FRAME_SIZE : BANNER_FRAME_WIDTH));
const frameH = computed(() => (isAvatar.value ? AVATAR_FRAME_SIZE : BANNER_FRAME_HEIGHT));

/** Minimum scale so the image always covers the frame ("cover" fit). */
const coverScale = computed(() => {
  if (!naturalW.value || !naturalH.value) return 1;
  return Math.max(frameW.value / naturalW.value, frameH.value / naturalH.value);
});
const displayScale = computed(() => coverScale.value * zoom.value);
const imgW = computed(() => naturalW.value * displayScale.value);
const imgH = computed(() => naturalH.value * displayScale.value);
const maxOffsetX = computed(() => Math.max(0, (imgW.value - frameW.value) / HALF));
const maxOffsetY = computed(() => Math.max(0, (imgH.value - frameH.value) / HALF));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const clampOffsets = () => {
  offsetX.value = clamp(offsetX.value, -maxOffsetX.value, maxOffsetX.value);
  offsetY.value = clamp(offsetY.value, -maxOffsetY.value, maxOffsetY.value);
};

watch(zoom, clampOffsets);

const imgStyle = computed(() => ({
  width: `${imgW.value}px`,
  height: `${imgH.value}px`,
  transform: `translate(-50%, -50%) translate(${offsetX.value}px, ${offsetY.value}px)`,
}));

const onImageLoad = () => {
  const el = imgEl.value;
  if (!el) return;
  naturalW.value = el.naturalWidth;
  naturalH.value = el.naturalHeight;
  reset();
};

const reset = () => {
  zoom.value = MIN_ZOOM;
  offsetX.value = 0;
  offsetY.value = 0;
};

const onPointerDown = (event: PointerEvent) => {
  dragging.value = true;
  dragStartX = event.clientX - offsetX.value;
  dragStartY = event.clientY - offsetY.value;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
};

const onPointerMove = (event: PointerEvent) => {
  if (!dragging.value) return;
  offsetX.value = clamp(event.clientX - dragStartX, -maxOffsetX.value, maxOffsetX.value);
  offsetY.value = clamp(event.clientY - dragStartY, -maxOffsetY.value, maxOffsetY.value);
};

const onPointerUp = (event: PointerEvent) => {
  dragging.value = false;
  (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
};

const onWheel = (event: WheelEvent) => {
  event.preventDefault();
  zoom.value = clamp(zoom.value - event.deltaY * WHEEL_ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM);
};

const cancel = () => emit('cancel');

const apply = () => {
  const el = imgEl.value;
  if (!el || isExporting.value) return;
  isExporting.value = true;

  const outW = isAvatar.value ? AVATAR_OUTPUT_SIZE : BANNER_OUTPUT_WIDTH;
  const outH = isAvatar.value ? AVATAR_OUTPUT_SIZE : BANNER_OUTPUT_HEIGHT;

  // Map the frame back onto the source image in natural pixels.
  const srcW = frameW.value / displayScale.value;
  const srcH = frameH.value / displayScale.value;
  const srcX = (imgW.value / HALF - frameW.value / HALF - offsetX.value) / displayScale.value;
  const srcY = (imgH.value / HALF - frameH.value / HALF - offsetY.value) / displayScale.value;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    isExporting.value = false;
    return;
  }
  ctx.drawImage(el, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

  canvas.toBlob(
    (blob) => {
      isExporting.value = false;
      if (blob) emit('confirm', blob);
    },
    props.outputType,
    ENCODE_QUALITY,
  );
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    cancel();
  }
};

onMounted(() => document.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[110] flex items-center justify-center overflow-auto bg-black/60 py-5 backdrop-blur-[4px]"
      @click.self="cancel"
    >
      <div
        class="hm-modal image-cropper"
        @click.stop
      >
        <div class="image-cropper__head">
          <p class="hm-modal__title !mb-0">{{ title || t('cropper.title') }}</p>
          <span
            class="image-cropper__close"
            @click="cancel"
          >
            <UiAppIcon
              name="x-mark"
              class="h-5 w-5"
            />
          </span>
        </div>

        <div class="image-cropper__body">
          <div
            class="image-cropper__stage"
            :class="`image-cropper__stage--${shape}`"
            :style="{ width: `${frameW}px`, height: `${frameH}px` }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @wheel="onWheel"
          >
            <img
              ref="imgEl"
              :src="src"
              alt=""
              class="image-cropper__img"
              :style="imgStyle"
              draggable="false"
              @load="onImageLoad"
            />
            <span
              v-if="isAvatar"
              class="image-cropper__ring"
            />
          </div>

          <p class="image-cropper__hint">{{ t('cropper.hint') }}</p>

          <div class="image-cropper__zoom">
            <UiAppIcon
              name="magnifying-glass-minus"
              class="h-4 w-4 shrink-0"
              color="var(--hm-muted)"
            />
            <input
              v-model.number="zoom"
              class="image-cropper__slider"
              type="range"
              :min="MIN_ZOOM"
              :max="MAX_ZOOM"
              :step="ZOOM_STEP"
              :aria-label="t('cropper.zoom')"
            />
            <UiAppIcon
              name="magnifying-glass-plus"
              class="h-4 w-4 shrink-0"
              color="var(--hm-muted)"
            />
          </div>
        </div>

        <div class="image-cropper__actions">
          <UiButton
            variant="neutral"
            size="sm"
            @click="reset"
          >
            {{ t('cropper.reset') }}
          </UiButton>
          <div class="image-cropper__actions-right">
            <UiButton
              variant="neutral"
              size="sm"
              @click="cancel"
            >
              {{ t('cropper.cancel') }}
            </UiButton>
            <UiButton
              variant="cyan"
              size="sm"
              icon="check"
              :loading="isExporting"
              @click="apply"
            >
              {{ t('cropper.apply') }}
            </UiButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.image-cropper {
  width: 640px;
  max-width: calc(100vw - 32px);
}

.image-cropper__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--hm-border);
}

.image-cropper__close {
  cursor: pointer;
  color: var(--hm-muted);
  transition: color 0.2s;
}

.image-cropper__close:hover {
  color: var(--hm-text);
}

.image-cropper__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 20px;
}

.image-cropper__stage {
  position: relative;
  max-width: 100%;
  overflow: hidden;
  background: var(--hm-bg);
  border: 1px solid var(--hm-border);
  border-radius: 8px;
  cursor: grab;
  touch-action: none;
}

.image-cropper__stage:active {
  cursor: grabbing;
}

.image-cropper__stage--avatar {
  border-radius: 50%;
}

.image-cropper__img {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  user-select: none;
  -webkit-user-drag: none;
}

.image-cropper__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 212, 255, 0.4);
  pointer-events: none;
}

.image-cropper__hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--hm-muted);
  text-align: center;
}

.image-cropper__zoom {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 360px;
}

.image-cropper__slider {
  flex: 1;
  height: 4px;
  appearance: none;
  background: var(--hm-border);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.image-cropper__slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--hm-accent);
  cursor: pointer;
}

.image-cropper__slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background: var(--hm-accent);
  cursor: pointer;
}

.image-cropper__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 20px 20px;
}

.image-cropper__actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
