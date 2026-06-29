<script setup lang="ts">
import PopupBox from '../PopupBox/PopupBox.vue';
import { usePopupControl } from '~/composables/use-popup-control';
import { useTfaModalState } from '~/composables/use-tfa-modal';
import type { Popup, POPUP_TYPE } from '~/types/popup';

import OTPInput from '../Input/OTPInput.vue';

interface Props {
  popup: Popup<POPUP_TYPE.TFA_MODAL>;
}

const { popup } = defineProps<Props>();
const { props } = popup;

const { t } = useI18n();
const { closePopup } = usePopupControl();
const state = useTfaModalState();

const isLoading = ref(false);
const pin = ref('');
const recoveryCode = ref('');

const isButtonDisabled = computed(() => {
  return props.type === 'otp' && !state.pin.value && pin.value.length < 6;
});

async function onComplete(value: string) {
  try {
    pin.value = value;
    isLoading.value = true;
    if (props.onSubmit) {
      await props.onSubmit(value);
    }
  } catch (error) {
    console.error(error);
  } finally {
    setTimeout(() => ((isLoading.value = false), (recoveryCode.value = '')), 500);
  }
}

function closeModal() {
  closePopup(popup.id);
}

function moveToRecoveryCode() {
  state.isRecoveryCodeNow.value = true;
}

const popupTitle = computed(() =>
  state.isRecoveryCodeNow.value ? t('twoFactor.recovery.title') : props.title,
);
</script>

<template>
  <PopupBox
    :title="popupTitle"
    box-width="408px"
    is-unclosable
    @close="closeModal"
  >
    <template #content>
      <div class="tfa-modal__body">
        <template v-if="state.isRecoveryCodeNow.value">
          <p class="tfa-modal__lead">
            {{ t('twoFactor.recovery.lead') }}
          </p>

          <UiFormInput
            v-model="recoveryCode"
            type="text"
            name="recoveryCode"
            :placeholder="t('twoFactor.recovery.placeholder')"
            @click="state.updateModalError('')"
          />
          <p
            v-if="state.modalError.value"
            class="tfa-modal__error"
          >
            {{ state.modalError.value }}
          </p>

          <div class="tfa-modal__actions">
            <UiButton
              variant="neutral"
              class="flex-1"
              @click="state.isRecoveryCodeNow.value = false"
            >
              {{ t('twoFactor.recovery.back') }}
            </UiButton>
            <UiButton
              variant="primary"
              class="flex-1"
              :loading="isLoading"
              :disabled="!recoveryCode || recoveryCode.length < 6 || isLoading"
              @click="onComplete(recoveryCode)"
            >
              {{ t('twoFactor.recovery.verify') }}
            </UiButton>
          </div>
        </template>

        <template v-else-if="props.type === 'otp'">
          <div
            v-show="isLoading"
            class="tfa-modal__loader"
          >
            <UiCircularLoader class="text-[48px]" />
          </div>

          <p class="tfa-modal__lead">{{ props.description }}</p>

          <OTPInput
            :error-msg="state.modalError.value"
            @complete="onComplete"
            @on-remove-error="state.updateModalError('')"
          />

          <p
            v-if="state.isRecoveryCodeNeeded.value"
            class="tfa-modal__hint"
          >
            {{ t('twoFactor.recovery.lostDevice') }}
            <span
              class="tfa-modal__link"
              @click="moveToRecoveryCode"
              >{{ t('twoFactor.recovery.useCode') }}</span
            >
          </p>

          <div class="tfa-modal__actions">
            <UiButton
              variant="neutral"
              class="flex-1"
              :loading="isLoading"
              @click="closeModal"
            >
              {{ t('common.cancel') }}
            </UiButton>
            <UiButton
              variant="primary"
              class="flex-1"
              :disabled="isButtonDisabled || !!state.modalError.value"
              :loading="isLoading"
              @click="onComplete(pin)"
            >
              {{ t('twoFactor.done') }}
            </UiButton>
          </div>
        </template>

        <template v-else>
          <p class="tfa-modal__lead">{{ props.description }}</p>
          <UiButton
            variant="primary"
            class="flex-1"
            :loading="isLoading"
            @click="closeModal"
          >
            {{ t('twoFactor.close') }}
          </UiButton>
        </template>
      </div>
    </template>
  </PopupBox>
</template>

<style scoped>
.tfa-modal__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  color: var(--hm-text);
}

.tfa-modal__lead {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--hm-text);
}

.tfa-modal__actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.tfa-modal__hint {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--hm-muted);
}

.tfa-modal__link {
  color: var(--hm-accent);
  text-decoration: underline;
  cursor: pointer;
}

.tfa-modal__loader {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hm-surface);
}

.tfa-modal__error {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--hm-error);
}
</style>
