# @bloodheaven/frontend-shared

A shared **Nuxt layer** with the canonical UI primitives of the BloodHeaven
design system. The single source of truth for `components/ui/*` — buttons, tables,
modals, forms, selects, toasts, popups, and so on. Every frontend (`ai-template`,
`auth-gateway`, `health-monitor`, …) extends this layer and pulls components from
here instead of keeping its own copies.

Components are built on top of the `.hm-*` CSS classes from `DESIGN_MANIFEST.md` —
and since v0.3.0 those classes ship **from here too**, so a frontend gets the
components and the stylesheet they assume from one place.

## What's inside

`assets/styles/hm-base.css` — the design system itself: the `@font-face` declarations,
the `--hm-*` tokens, every `.hm-*` primitive and the Tailwind directives.
`public/fonts/*.woff2` — the fonts that stylesheet declares (JetBrains Mono latin +
cyrillic, Syne latin).

`components/ui/` — universal design-system primitives (used across all frontends):

```
AppIcon  AppLoadingIndicator  Badge  Banner  Button  ButtonBack  CircularLoader
DatePicker  DateRangeFilter  EnvBulkInput  Form  FormInput  FormSelect  FormTextarea
HmSelect  IconButton  Input  Modal  NavDropdown  PopupBox  PopupContainer  SearchInput
SegmentedControl  Table  TableActions  TableInput  Toast  ToastsContainer
```

Auto-import preserves the familiar names: `components/ui/Button/Button.vue` → `<UiButton>`.

### What's deliberately not here (domain components)

Only components whose `~/...` dependencies exist in **every** consuming application
belong in the layer. Otherwise a component breaks typecheck wherever those
dependencies are missing (in a Nuxt layer, every component is typechecked in each
consumer). So domain-coupled widgets stay **local** to their applications:

| Component                         | Lives locally in | Coupled to                                   |
| --------------------------------- | ---------------- | -------------------------------------------- |
| `DateTimePickerUtc`, `WeekdayPicker` | ai-template, health-monitor | `~/utils/utc-datetime`, `~/constants/maintenance` → resource domain |
| `ImageUpload`, `ImageCropper`, `QrCode` | auth-gateway | `~/stores/files.store`, `~/services/files.service`, `~/types/file` |

## How to wire it up (in each frontend)

The layer is not an application — it can't be run on its own. Wire it up in the
consuming application's `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  // via git (once the repository is published):
  extends: [['github:BloodHeavenDevelop/frontend-shared', { install: true }]],
  // or locally within this workspace (sibling folder):
  // extends: ['../../frontend-shared'],
});
```

After that `<UiButton>`, `<UiTable>`, and the rest are available as before — via
auto-import.

### Design system CSS

The components assume the `.hm-*` classes exist. Import the base stylesheet as the
**first line** of the application's own `assets/styles/main.css` (the file the app
registers in `css: ['~/assets/styles/main.css']`):

```css
@import '@bloodheaven/frontend-shared/assets/styles/hm-base.css';

/* project-local rules below */
```

Rules:

- **The import, not a `css:` entry in the layer.** Nuxt merges layer `css` arrays
  *after* the application's, so a layer-registered stylesheet would land on top of the
  app's rules — and its Tailwind preflight would reset controls the app just styled.
  The explicit `@import` pins the cascade: base first, app second.
- **The app keeps no copy of the base rules.** `main.css` in a consuming frontend holds
  only what is genuinely project-local (a canvas width, an auth shell, a vendor widget
  override). Anything portable — a new primitive, a token, a fix to an existing class —
  goes into `hm-base.css` here and is released as a new layer version.
- **Fonts need no wiring.** They are served from this layer's `public/`, so the
  `url('/fonts/…')` references in the stylesheet resolve in every consumer. Applications
  must not keep their own `public/fonts/`.

### ⚠️ Explicit `~/components/ui/...` imports

Application code has hundreds of **explicit** imports like
`import UiButton from '~/components/ui/Button/Button.vue'`,
`import { useToasts } from '~/components/ui/ToastsContainer/composables'`, and so on.
The `~` alias in application code points at the application itself, not at the layer,
so once you remove the local `components/ui` those imports break. Two options:

1. **Alias (minimal edits).** Add a dedicated alias to the application's
   `nuxt.config.ts` and rewrite the imports to use it (with `sed`), `#shared-ui/` → the layer:
   ```ts
   import { fileURLToPath } from 'node:url';
   const sharedUiDir = fileURLToPath(
     new URL('./node_modules/@bloodheaven/frontend-shared/components/ui', import.meta.url),
   );
   export default defineNuxtConfig({
     extends: ['@bloodheaven/frontend-shared'],
     alias: { '#shared-ui': sharedUiDir },
   });
   ```
   then `~/components/ui/` → `#shared-ui/` across the whole application. The prefix is
   **not** `#ui` — that's taken by `@nuxt/ui`; and not `~/components/ui`, to avoid
   clashing with the base `~`.
2. **Auto-import only.** Drop the explicit component imports (use `<UiX>` directly),
   and for the non-component exports (`useToasts`, the `TableColumn`/`ButtonVariant`/`BadgeVariant`
   types) move them into the layer's auto-imported directories. More work, cleaner result.

## Application contract (peer dependencies)

Some components reach for modules that **stay in each application** (deliberately not
in the layer — that's domain code, not design system). With `extends`, the `~` alias
inside layer components resolves to the consuming application, so these paths must
exist there:

| Component          | Requires in the application                                                     |
| ------------------ | ------------------------------------------------------------------------------- |
| `EnvBulkInput`     | `~/utils/parse-env`                                                            |
| `Table`            | `~/composables/use-table-column-preferences`                                   |
| `PopupContainer`   | `~/composables/use-popup-components`, `~/composables/use-popup-management`, `~/types/popup/interfaces` |
| `Modal/TFAModal`   | `~/composables/use-popup-control`, `~/composables/use-tfa-modal`, `~/types/popup` |

All of these paths are present in every frontend in the project, so the layer
typechecks cleanly in all consumers.

Additionally: the canonical `TFAModal` uses the i18n keys `twoFactor.*` and `common.cancel`.
They exist in `auth-gateway` but are **missing** in `ai-template`/`health-monitor` — if
those render the TFA modal, the keys need to be added to their `i18n/locales`.

## Resolving divergences (the reference is DESIGN_MANIFEST.md)

At extraction time the component versions diverged slightly between frontends. The
canonical version was chosen per `DESIGN_MANIFEST.md`:

| Component            | Canon | Rationale (manifest)                                                        |
| -------------------- | ----- | ---------------------------------------------------------------------------- |
| `Button`             | auth  | § 17.1: the spinner is centered with negative margins, not `transform` (that gets overridden by the `hm-spin` animation). The ai/hm versions broke the rule. |
| `FormSelect`         | auth  | § 11.2 / p. 1298: added a `filter` affordance (pixel-twin of `.hm-input`, 30px, mono, 8px). |
| `HmSelect`           | hm    | § 11.2: the same `filter` affordance for the toolbar.                       |
| `Modal/TFAModal`     | auth  | i18n instead of hardcoded strings — more complete and correct.             |

All other components were identical across frontends. (`DateTimePickerUtc` also
diverged — the hm version is canonical per p. 831, `flex-wrap: wrap` — but the
component is domain-specific and stays local, see above.)
