<script setup lang="ts">
import { computed, useAttrs } from 'vue';

import { Icon } from '#components';

defineOptions({ inheritAttrs: false });

interface Props {
  /** icon name */
  name: string;
  /** icon color */
  color?: string;
  /** how to paint: auto, stroke only, or fill only */
  paint?: 'auto' | 'stroke' | 'fill';
  /** stroke width for outline icons */
  strokeWidth?: number | string;
  /** local collection prefix (default 'my-icons') */
  prefix?: string;

  noCustomize?: boolean;

  changeOnRun?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  color: undefined,
  paint: 'auto',
  strokeWidth: 1,
  prefix: 'my-icons',
});

const attrs = useAttrs();

const finalName = computed(() =>
  props.name.includes(':') ? props.name : `${props.prefix ?? 'my-icons'}:${props.name}`,
);

/**
 * Smart SVG customization:
 *  - auto: if the icon has stroke / stroke-width / fill="none" → treat as outline => paint stroke and keep fill="none"
 *          otherwise treat as filled => paint fill and remove explicit stroke so they don't conflict.
 *  - stroke: force stroke only.
 *  - fill: force fill only.
 */
const customize = (content: string) => {
  const paint = props.paint ?? 'auto';
  const strokeW = props.strokeWidth != null ? String(props.strokeWidth) : undefined;

  const looksOutline =
    /stroke\s*=/.test(content) ||
    /stroke-width\s*=/.test(content) ||
    /fill\s*=\s*["']none["']/.test(content);

  const toStroke = paint === 'stroke' || (paint === 'auto' && looksOutline);

  if (toStroke) {
    let out = content
      .replace(/\sfill\s*=\s*["'][^"']*["']/g, ' fill="none"')
      .replace(/\sstroke\s*=\s*["'][^"']*["']/g, ` stroke="currentColor"`)
      .replace(/<(path|circle|rect|line|polyline|polygon)\b([^>]*)>/g, (_m, tag, rest) => {
        if (/\sstroke\s*=/.test(rest)) return `<${tag}${rest}>`;
        return `<${tag}${rest} stroke="currentColor">`;
      });

    if (strokeW) {
      out = out
        .replace(/\sstroke-width\s*=\s*["'][^"']*["']/g, ` stroke-width="${strokeW}"`)
        .replace(/<(path|circle|rect|line|polyline|polygon)\b([^>]*)>/g, (_m, tag, rest) => {
          if (/\sstroke-width\s*=/.test(rest)) return `<${tag}${rest}>`;
          return `<${tag}${rest} stroke-width="${strokeW}">`;
        });
    }
    return out;
  }

  let out = content
    .replace(/\sstroke\s*=\s*["'][^"']*["']/g, '')
    .replace(/\sfill\s*=\s*["']none["']/g, ` fill="currentColor"`)
    .replace(/\sfill\s*=\s*["'][^"']*["']/g, ` fill="currentColor"`);

  out = out.replace(/<(path|circle|rect|ellipse|polygon|polyline)\b([^>]*)>/g, (_m, tag, rest) => {
    if (/\sfill\s*=/.test(rest)) return `<${tag}${rest}>`;
    return `<${tag}${rest} fill="currentColor">`;
  });

  return out;
};

const changeOnRunToggled = ref(true);

onMounted(() => {
  if (props.changeOnRun) {
    watch([computed(() => props.paint)], async () => {
      changeOnRunToggled.value = false;
      await nextTick();
      changeOnRunToggled.value = true;
    });
  }
});
</script>

<template>
  <Icon
    v-if="changeOnRunToggled"
    :name="finalName"
    mode="svg"
    :customize="props.noCustomize ? undefined : customize"
    v-bind="$attrs"
    :style="[attrs.style as any, props.color ? { color: props.color } : null]"
    aria-hidden="true"
  />
</template>
