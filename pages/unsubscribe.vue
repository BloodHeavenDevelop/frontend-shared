<script setup lang="ts">
// Shared unsubscribe landing. Every email the gateway relays with an unsubscribe
// link points here (`/unsubscribe?token=...`); the page records the opt-out
// against messengers-gateway. The token is self-authenticating (HMAC-signed), so
// no login is required. Shared-layer page: shared UI primitives + Nuxt
// auto-imports only, no app/domain code.
import UiBanner from '../components/ui/Banner/Banner.vue';
import UiButton from '../components/ui/Button/Button.vue';

definePageMeta({ layout: false });

type Phase = 'idle' | 'loading' | 'success' | 'error';

const route = useRoute();
const runtime = useRuntimeConfig();
const gatewayBase = ((runtime.public as unknown as { messengersGateway?: string }).messengersGateway || '')
  .replace(/\/$/, '');

const token = computed(() => String(route.query.token || ''));
const phase = ref<Phase>('idle');
const message = ref('');

async function unsubscribe(): Promise<void> {
  if (!token.value) {
    phase.value = 'error';
    message.value = 'This unsubscribe link is invalid.';
    return;
  }
  if (!gatewayBase) {
    phase.value = 'error';
    message.value = 'Unsubscribe service is not configured.';
    return;
  }
  phase.value = 'loading';
  try {
    await $fetch(`${gatewayBase}/api/email/unsubscribe`, { method: 'POST', body: { token: token.value } });
    phase.value = 'success';
    message.value = 'You have been unsubscribed. You will no longer receive these emails.';
  } catch (e: unknown) {
    phase.value = 'error';
    const data = (e as { data?: { error?: string; message?: string } }).data;
    message.value = data?.message || 'This unsubscribe link is invalid or has expired.';
  }
}

onMounted(() => {
  void unsubscribe();
});
</script>

<template>
  <div class="us">
    <div class="us__card">
      <div class="us__title">Unsubscribe</div>

      <p
        v-if="phase === 'loading'"
        class="us__text"
      >
        Processing…
      </p>
      <UiBanner
        v-else-if="phase === 'success'"
        variant="ok"
      >
        {{ message }}
      </UiBanner>
      <template v-else-if="phase === 'error'">
        <UiBanner variant="error">{{ message }}</UiBanner>
        <UiButton
          variant="neutral"
          @click="unsubscribe"
        >
          Try again
        </UiButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.us {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--hm-bg, #0e1117);
}

.us__card {
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

.us__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--hm-text, #e6edf3);
}

.us__text {
  font-size: 14px;
  line-height: 20px;
  color: var(--hm-muted, #8a94a6);
}
</style>
