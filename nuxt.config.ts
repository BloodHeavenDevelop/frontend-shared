// BloodHeaven shared frontend layer.
//
// This is a Nuxt layer (https://nuxt.com/docs/getting-started/layers): it is NOT a
// standalone app. Consuming frontends pull it in via `extends` and inherit the
// design-system primitives under `components/ui/` (auto-imported as `Ui<Name>`,
// exactly as if they lived in the app itself).
//
// The layer is intentionally minimal — it ships components only. The components
// reach into a small set of app-provided modules via `~/...` aliases
// (composables, stores, utils, types, constants, services). In a Nuxt layer these
// `~` aliases resolve against the CONSUMING app, so every app that extends this
// layer must provide them. See README.md → "Контракт приложения".
export default defineNuxtConfig({
  // Keep components at the repo root (mirrors the consuming apps' layout) so the
  // auto-import names match one-to-one: components/ui/Button/Button.vue -> <UiButton>.
  components: true,
});
