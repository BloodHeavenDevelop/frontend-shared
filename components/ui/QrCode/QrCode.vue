<script setup lang="ts">
import QRCode from 'qrcode';

/** Default rendered size of the QR image, in CSS pixels. */
const DEFAULT_SIZE_PX = 200;
/** Quiet-zone width around the code, in modules (QR spec recommends 4, 1 is enough on a light card). */
const QUIET_ZONE_MODULES = 1;
/** Error-correction level — "M" balances density and scan resilience for otpauth URLs. */
const ERROR_CORRECTION_LEVEL = 'M';
/** Foreground / background of the matrix — kept dark-on-white for reliable scanning. */
const MODULE_DARK_COLOR = '#0b0f14';
const MODULE_LIGHT_COLOR = '#ffffff';

const props = withDefaults(
  defineProps<{
    /** Payload encoded into the QR matrix (e.g. an otpauth:// URL). */
    value: string;
    /** Rendered width/height in pixels. */
    size?: number;
    /** Accessible description of the code. */
    alt?: string;
  }>(),
  {
    size: DEFAULT_SIZE_PX,
    alt: '',
  },
);

const dataUrl = ref('');
const failed = ref(false);

const render = async (value: string, size: number) => {
  if (!value) {
    dataUrl.value = '';
    return;
  }

  try {
    dataUrl.value = await QRCode.toDataURL(value, {
      errorCorrectionLevel: ERROR_CORRECTION_LEVEL,
      margin: QUIET_ZONE_MODULES,
      width: size,
      color: { dark: MODULE_DARK_COLOR, light: MODULE_LIGHT_COLOR },
    });
    failed.value = false;
  } catch (e) {
    console.error('Failed to render QR code', e);
    failed.value = true;
    dataUrl.value = '';
  }
};

watchEffect(() => {
  void render(props.value, props.size);
});
</script>

<template>
  <img
    v-if="dataUrl && !failed"
    class="hm-qr"
    :src="dataUrl"
    :alt="alt"
    :width="size"
    :height="size"
  />
</template>

<style scoped>
.hm-qr {
  display: block;
  border-radius: 12px;
  background: #ffffff;
  padding: 8px;
}
</style>
