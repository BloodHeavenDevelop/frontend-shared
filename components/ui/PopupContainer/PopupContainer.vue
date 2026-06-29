<script setup lang="ts">
import { getPopupComponent } from '~/composables/use-popup-components';
import { usePopupManagement } from '~/composables/use-popup-management';
import type { IPopupDefaultProps } from '~/types/popup/interfaces';

const {
  isVisible,
  activePopups,
  setupKeyboardListeners,
  cleanupKeyboardListeners,
  setupBodyScroll,
  handleClosePopup,
} = usePopupManagement();

watch(isVisible, setupBodyScroll);

onMounted(setupKeyboardListeners);
onUnmounted(cleanupKeyboardListeners);

const handleBackdropClick = (popupId: string) => {
  const currentPopUp = activePopups.value.find((p) => p.id === popupId);

  if (
    currentPopUp &&
    !(currentPopUp.props as IPopupDefaultProps)?.isUnclosable &&
    (currentPopUp.props as IPopupDefaultProps)?.closeOnOutsideClick
  ) {
    handleClosePopup(currentPopUp);
  }
};
</script>

<template>
  <Transition
    appear
    enter-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isVisible"
      class="fixed inset-0 z-[100] w-full h-full"
    >
      <Transition
        v-for="popup in activePopups"
        :key="popup.id"
        appear
        mode="out-in"
        enter-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          class="absolute inset-0 flex items-center justify-center w-full h-full max-h-screen py-5 mx-auto overflow-auto bg-black/60 backdrop-blur-[4px]"
          @click.self="handleBackdropClick(popup.id)"
        >
          <Transition
            appear
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-2 scale-95"
          >
            <div :key="`modal-${popup.id}`">
              <component
                :is="getPopupComponent(popup.key)"
                :key="popup.id"
                :popup="popup"
              />
            </div>
          </Transition>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style>
@media (prefers-reduced-motion: reduce) {
  .transition,
  .transition-opacity {
    transition: none !important;
  }
}
</style>
