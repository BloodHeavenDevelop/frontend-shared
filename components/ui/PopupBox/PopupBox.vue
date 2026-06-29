<script setup lang="ts">
interface Props {
  title?: string;
  isUnclosable?: boolean;
  boxWidth?: string;
  showHead?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: '',
  isUnclosable: false,
  boxWidth: '520px',
  showHead: true,
});

const emit = defineEmits<{
  close: [];
}>();

function onClose(): void {
  emit('close');
}
</script>

<template>
  <div
    class="hm-modal relative text-left rtl:text-right flex flex-col pb-0 mt-auto sm:mt-0"
    :style="{ width: boxWidth }"
  >
    <div
      v-if="showHead"
      class="flex items-center justify-between pt-6 pb-5 px-6 border-b border-hm-border"
    >
      <p
        v-if="title"
        class="hm-modal__title !mb-0"
      >
        {{ title }}
      </p>
      <span
        v-if="!isUnclosable"
        class="cursor-pointer transition-colors duration-200 text-hm-muted hover:text-hm-text"
        @click="onClose"
      >
        <UiAppIcon
          name="x-mark"
          class="w-5 h-5"
        />
      </span>
    </div>
    <div class="flex flex-col w-full p-6">
      <slot name="content" />
    </div>
  </div>
</template>
