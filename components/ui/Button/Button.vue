<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

import { NuxtLink } from '#components';
import type { ButtonHtmlType, ButtonSize, ButtonVariant } from '../Button/types';

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonHtmlType;
  to?: RouteLocationRaw;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  trailing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'cyan',
  size: 'md',
  type: 'button',
  to: undefined,
  loading: false,
  disabled: false,
  trailing: false,
});

const isLink = computed(() => props.to !== undefined);
</script>

<template>
  <component
    :is="isLink ? NuxtLink : 'button'"
    :type="isLink ? undefined : type"
    :to="isLink ? to : undefined"
    :disabled="isLink ? undefined : disabled || loading"
    class="hm-btn"
    :class="[`hm-btn--${variant}`, size === 'sm' && 'hm-btn--sm']"
  >
    <span
      class="hm-btn__inner"
      :class="{ 'hm-btn__inner--hidden': loading }"
    >
      <ClientOnly>
        <UiAppIcon
          v-if="icon && !trailing"
          class="w-3 h-3"
          :name="icon"
        />
      </ClientOnly>

      <slot />

      <ClientOnly>
        <UiAppIcon
          v-if="icon && trailing"
          class="w-3 h-3"
          :name="icon"
        />
      </ClientOnly>
    </span>

    <UiCircularLoader
      v-if="loading"
      class="hm-btn__loader"
    />
  </component>
</template>

<style scoped>
.hm-btn {
  position: relative;
}

.hm-btn__inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.hm-btn__inner--hidden {
  visibility: hidden;
  pointer-events: none;
}

.hm-btn__loader {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 14px;
  /* Center via negative margins (loader is 1em²) so `transform` stays free for the
     spin animation — using translate() here would be overridden by hm-spin's rotate. */
  margin-top: -0.5em;
  margin-left: -0.5em;
}
</style>
