// BloodHeaven shared frontend layer.
//
// This is a Nuxt layer (https://nuxt.com/docs/getting-started/layers): it is NOT a
// standalone app. Consuming frontends pull it in via `extends` and inherit the
// design-system primitives under `components/ui/` (auto-imported as `Ui<Name>`,
// exactly as if they lived in the app itself).
//
// Besides the components the layer ships the design system itself:
//   assets/styles/hm-base.css  — tokens + every `.hm-*` primitive + Tailwind directives
//   public/fonts/*.woff2       — the web fonts that stylesheet declares
// The stylesheet is deliberately NOT registered here as a `css:` entry: Nuxt merges
// layer `css` arrays AFTER the app's own, which would put the base (and its Tailwind
// preflight) on top of the app's rules. Applications import it as the first line of
// their own `assets/styles/main.css` instead — see README.md → "Design system CSS".
// The fonts need no wiring: Nitro serves every layer's `public/` at the site root.
//
// The components reach into a small set of app-provided modules via `~/...` aliases
// (composables, stores, utils, types, constants, services). In a Nuxt layer these
// `~` aliases resolve against the CONSUMING app, so every app that extends this
// layer must provide them. See README.md → "Контракт приложения".
export default defineNuxtConfig({
  // Keep components at the repo root (mirrors the consuming apps' layout) so the
  // auto-import names match one-to-one: components/ui/Button/Button.vue -> <UiButton>.
  components: true,
});
