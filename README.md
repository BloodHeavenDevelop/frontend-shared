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

`assets/styles/hm-base.css` — the design system itself: the Tailwind 4 entry
(`@import 'tailwindcss'` + `@import '@nuxt/ui'` + the `@source` directives that make
Tailwind look inside this package at all), the `hm-*` colour scale in `@theme`, the
`--ui-* → --hm-*` bridge that gives every Nuxt UI component the design system's palette,
the `@font-face` declarations, the `--hm-*` tokens and every `.hm-*` primitive.

`app.config.ts` — the Nuxt UI theme for the whole platform. Nuxt merges a layer's app
config underneath the application's, so this is where the design system's Tailwind
Variants blocks live; a consuming app should carry no `ui` key of its own.
`public/fonts/*.woff2` — the fonts that stylesheet declares (JetBrains Mono latin +
cyrillic, Syne latin).

`components/ui/` — universal design-system primitives (used across all frontends):

```
AppIcon  AppLoadingIndicator  Badge  Banner  Button  ButtonBack  Checkbox  CircularLoader
DatePicker  DateRangeFilter  EnvBulkInput  Form  FormInput  FormSelect  FormTextarea
HmSelect  IconButton  Input  MobileNav  Modal  MultiSelect  NavDropdown  PopupBox  PopupContainer
SearchInput  SegmentedControl  Table  TableActions  TableInput  Toast  ToastsContainer  Toggle
```

`Checkbox` (`<UiCheckbox>`, manifest § 13.6) is the form checkbox — `label`, optional
`hint`, `variant="warning"` for flags that put an entity into a holding state — and
`Toggle` (`<UiToggle>`, § 13.1–13.2) the settings switch that applies immediately. Both
are `v-model` booleans over the `.hm-check*` / `.hm-toggle*` classes in `hm-base.css`;
a bare `<input type="checkbox" class="hm-check__input">` is reserved for a table's
selection column, where the row already is the label. Nothing else on the platform
renders a checkbox: no native `<input type="checkbox">` in a form, no `<UCheckbox>`.

`MultiSelect` (`<UiMultiSelect>`, manifest § 11.6) picks several values of one field:
`v-model` is an array, `options` are `{ label, value, count?, tone?, disabled? }` (types in
`components/ui/MultiSelect/types.ts`). By default it is a 30 px toolbar filter whose `label`
names the filter; `size="form"` makes it a field at the control height whose `label` is the
placeholder. The panel always opens with a focused search field and stays open while values
are picked. Its UI words default to English — pass `searchPlaceholder`, `emptyLabel`,
`allLabel`, `clearLabel`, `selectedLabel`, `ofLabel` from the app's i18n.

Auto-import preserves the familiar names: `components/ui/Button/Button.vue` → `<UiButton>`.

`DatePicker` and `DateRangeFilter` take optional `weekStart` (`0`–`6`, Sunday = 0; default
Monday) and `locale` (BCP 47; default `en-US`) props. Timezone and locale are account
preferences owned by auth-gateway, so the layer does not read them itself — pass the
consuming app's `useUserPreferencesStore().weekStart` / `.locale`, and the calendar opens
on the user's first day of the week with month and weekday names (and the range
trigger's label) in their locale.

`DateRangeFilter` also takes `timeZone` (IANA, `useUserPreferencesStore().timezone`): a
picked day runs from its first to its last instant **in that zone**, the presets ("Today",
"Last 7 days") are counted there, and the model is that pair of UTC instants — the
browser's zone is used only when the prop is unset. Its preset names come from
`presetLabels` (`{ today, yesterday, last7Days, last30Days, thisMonth, thisYear }`,
English by default). `DatePicker` is a form field at the control height; `toolbar` makes
it the 30 px toolbar control.

`Table` renders "Reset filters" after the `controls-left` filters while
`hasActiveFilters` is true (the page decides what counts, search included) and emits
`reset-filters`; `resetFiltersLabel` carries the app's translation. A reset keeps the
rows-per-page choice — it is the visitor's, not a filter.

`composables/` — cross-app composables whose only dependency is a backend contract
shared by the whole platform (not the design system, but equally duplicated
otherwise). They are auto-imported in every consumer just like the components.

| Composable      | What it does                                                              |
| --------------- | ------------------------------------------------------------------------- |
| `use-recaptcha` | Google reCAPTCHA Enterprise v3 (invisible): loads the loader script once, mints a token per action. Backend half: `utils/recaptcha`. |

#### Captcha (`use-recaptcha`)

The layer does not know where a service publishes its site key, so each app loads
its own public config on boot and pushes the result in:

```ts
// plugins/00.captcha.ts — before any form can be submitted
setRecaptchaConfig(await $fetch('/public/captcha', { baseURL: apiUrl }));
```

Forms then mint a token per submit; the action string must match the one the
backend's `recaptcha.Middleware(action)` expects:

```ts
const { execute } = useRecaptcha();
const recaptchaToken = await execute('opt_out'); // undefined while captcha is off
await service.submit({ ...payload, recaptchaToken });
```

`execute()` resolves to `undefined` whenever captcha is disabled (development, or
a deployment without Enterprise credentials), so the same call site works in both
modes. The badge is a vendor widget — its dark-theme override stays in the app's
`main.css` (see the rules below).

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

## Mobility (≤ 768 px) — since v0.5.0

The phone layout of every frontend is delivered from here, per
`DESIGN_MANIFEST_MOBILITY.md`. Applications get most of it for free and must add
exactly one thing.

**Free, from `hm-base.css`:** the bezel drops, gutters become 16 px, the header goes
sticky and sheds its nav links, the footer hides, buttons and toolbar icon buttons land
on 44 px, form controls on 48 px at 16 px type (below that iOS Safari zooms the page),
stat cards become a horizontal strip, every `.hm-modal` renders as a bottom sheet with a
drag handle, and toasts move to the bottom edge above the tab bar.

**Free, from the components:** `<UiTable>` renders its rows as cards (reusing the same
`${key}-data` slots) with an explicit sort control and compact pagination.

**The one required change** — mount the tab bar in `layouts/default.vue`, feeding it the
nav entries the desktop header already computes:

```vue
<UiMobileNav
  :entries="navEntries"
  :profile-url="authGatewayUrl && !authDisabled ? `${authGatewayUrl}/profile` : ''"
  :show-sign-out="!authDisabled"
  :meta="{ version: appVersion, buildSha: shortSha, env: appEnv, online }"
  @sign-out="signOut"
/>
```

It renders nothing above 768 px. The first three flat routes become tabs; everything
else — remaining routes, dropdown groups, *My Profile*, *Sign Out* and the footer's
version/build/online/env slots — lands in the "More" sheet.

**Do not** add a `@media (max-width: 768px)` block to an application's `main.css`: that
is a fork of the design system. Portable mobile rules belong in `hm-base.css` here.

## Application contract (peer dependencies)

The layer declares `@nuxt/ui` (`^4.11.0`) as a peer alongside `nuxt`, `yup`, `date-fns`
and `@vuepic/vue-datepicker`: `FormInput`, `FormTextarea`, `FormSelect`, `TableInput`,
`Form` and `Table` are built on it. It was an undeclared peer until 0.6.0 — the apps
happened to install it for themselves.

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
