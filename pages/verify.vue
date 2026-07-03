<script setup lang="ts">
// Shared email-ownership confirmation landing. Every service's verification
// email points its magic link here (`/verify?token=...`); the page confirms the
// token against messengers-gateway, the platform's verification authority. It
// also accepts manual 6-digit code entry when opened with `?email=`.
//
// This page lives in the shared layer, so it must not import app/domain code —
// only shared UI primitives (relative paths) and Nuxt auto-imports. The
// messengers-gateway base URL comes from the consuming app's public runtime
// config (`messengersGateway`).
import UiBanner from '../components/ui/Banner/Banner.vue';
import UiOtpInput from '../components/ui/Input/OTPInput.vue';

definePageMeta({ layout: false });

type Phase = 'idle' | 'loading' | 'success' | 'error';

const route = useRoute();
const runtime = useRuntimeConfig();
const gatewayBase = ((runtime.public as unknown as { messengersGateway?: string }).messengersGateway || '')
  .replace(/\/$/, '');

const token = computed(() => String(route.query.token || ''));
const email = computed(() => String(route.query.email || ''));
const service = computed(() => String(route.query.service || ''));

const phase = ref<Phase>('idle');
const message = ref('');
const codeError = ref('');

async function confirm(body: Record<string, string>, path: string): Promise<void> {
  if (!gatewayBase) {
    phase.value = 'error';
    message.value = 'Verification service is not configured.';
    return;
  }
  phase.value = 'loading';
  codeError.value = '';
  try {
    await $fetch(`${gatewayBase}/api/${path}`, { method: 'POST', body });
    phase.value = 'success';
    message.value = 'Your email address has been confirmed. You can close this page.';
  } catch (e: unknown) {
    phase.value = 'error';
    const data = (e as { data?: { error?: string; message?: string } }).data;
    message.value = data?.error || data?.message || 'This confirmation link or code is invalid or has expired.';
    codeError.value = message.value;
  }
}

function onCodeComplete(code: string): void {
  void confirm({ email: email.value, code, ...(service.value ? { service: service.value } : {}) }, 'verify/confirm-code');
}

onMounted(() => {
  if (token.value) {
    void confirm({ token: token.value }, 'verify/confirm');
  }
});
</script>

<template>
  <div class="vf">
    <div class="vf__card">
      <div class="vf__title">Confirm your email</div>

      <UiBanner
        v-if="phase === 'success'"
        variant="ok"
      >
        {{ message }}
      </UiBanner>

      <template v-else-if="phase === 'loading'">
        <p class="vf__text">Confirming…</p>
      </template>

      <template v-else-if="token && phase === 'error'">
        <UiBanner variant="error">{{ message }}</UiBanner>
      </template>

      <!-- No token: manual 6-digit code entry (opened with ?email=). -->
      <template v-else-if="!token">
        <p
          v-if="email"
          class="vf__text"
        >
          Enter the 6-digit code we sent to <strong>{{ email }}</strong>.
        </p>
        <p
          v-else
          class="vf__text"
        >
          Open the confirmation link from the email we sent you, or enter the code below.
        </p>

        <UiOtpInput
          v-if="email"
          :error-msg="codeError"
          @complete="onCodeComplete"
          @on-remove-error="codeError = ''"
        />

        <UiBanner
          v-if="!email && phase === 'error'"
          variant="error"
        >
          {{ message }}
        </UiBanner>
      </template>
    </div>
  </div>
</template>

<style scoped>
.vf {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--hm-bg, #0e1117);
}

.vf__card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 32px;
  background: var(--hm-surface, #161b22);
  border: 1px solid var(--hm-border, #232a34);
  border-radius: 12px;
}

.vf__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--hm-text, #e6edf3);
}

.vf__text {
  font-size: 14px;
  line-height: 20px;
  color: var(--hm-muted, #8a94a6);
}
</style>
