/**
 * Google reCAPTCHA Enterprise (v3, invisible) — the browser half of the
 * platform's captcha. The backend half is `utils/recaptcha`; the action strings
 * are the contract between them and must match on both sides.
 *
 * The layer knows nothing about where a service publishes its site key: every
 * app loads its own public config on boot and pushes the result in with
 * `setRecaptchaConfig()`. Everything else — the loader script, the `grecaptcha`
 * lifecycle, the disabled case — is shared.
 */

/** Minimal surface of the reCAPTCHA v3 global injected by `api.js?render=`. */
export interface ReCaptchaV3 {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: ReCaptchaV3;
  }
}

/**
 * What the backend advertises about captcha. `enabled: false` is the normal
 * state in development and in any deployment without Enterprise credentials —
 * forms must stay usable then, so `execute()` resolves to `undefined`.
 */
export interface RecaptchaConfig {
  enabled: boolean;
  siteKey: string;
}

export const RECAPTCHA_CONFIG_STATE_KEY = 'shared-recaptcha-config';

/** Google's v3 loader script; the public site key is appended as `?render=`. */
const RECAPTCHA_SCRIPT_BASE = 'https://www.google.com/recaptcha/api.js';

/**
 * Loads the loader script exactly once (module-scoped promise) so repeated
 * submits across forms reuse the same `grecaptcha` instance.
 */
let scriptPromise: Promise<void> | null = null;

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${RECAPTCHA_SCRIPT_BASE}?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load reCAPTCHA'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Captcha configuration shared across the app. Filled once on boot from
 * whichever endpoint the service advertises the site key on; read
 * synchronously everywhere else.
 */
export function useRecaptchaConfig() {
  return useState<RecaptchaConfig>(RECAPTCHA_CONFIG_STATE_KEY, () => ({
    enabled: false,
    siteKey: '',
  }));
}

/**
 * Publishes the backend's captcha configuration to the layer. A missing site
 * key disables the guard rather than half-enabling it — a form that cannot mint
 * a token must not block the user.
 */
export function setRecaptchaConfig(config: Partial<RecaptchaConfig> | null | undefined): void {
  const siteKey = config?.siteKey || '';
  useRecaptchaConfig().value = { enabled: !!config?.enabled && !!siteKey, siteKey };
}

/**
 * reCAPTCHA v3 helper. `execute(action)` returns a fresh token for the given
 * action, or `undefined` when captcha is disabled, so callers can pass the
 * result straight through to the request payload.
 */
export const useRecaptcha = () => {
  const execute = async (action: string): Promise<string | undefined> => {
    const { enabled, siteKey } = useRecaptchaConfig().value;
    if (!enabled || !siteKey || !import.meta.client) return undefined;

    await loadRecaptchaScript(siteKey);
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) return undefined;

    await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
    return grecaptcha.execute(siteKey, { action });
  };

  return { execute };
};
