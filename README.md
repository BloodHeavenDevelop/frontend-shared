# @bloodheaven/frontend-shared

Общий **Nuxt-слой** (layer) с каноничными UI-примитивами design-system BloodHeaven.
Единственный источник правды для `components/ui/*` — кнопки, таблицы, модалки, формы,
селекты, тосты, попапы и т.д. Все фронтенды (`ai-template`, `auth-gateway`,
`health-monitor`, …) подключают этот слой и тянут компоненты отсюда, а не держат
собственные копии.

Компоненты построены поверх `.hm-*` CSS-классов из `DESIGN_MANIFEST.md`.

## Что внутри

`components/ui/` — универсальные примитивы design-system (используются во всех фронтах):

```
AppIcon  AppLoadingIndicator  Badge  Banner  Button  ButtonBack  CircularLoader
DatePicker  DateRangeFilter  EnvBulkInput  Form  FormInput  FormSelect  FormTextarea
HmSelect  IconButton  Input  Modal  NavDropdown  PopupBox  PopupContainer  SearchInput
SegmentedControl  Table  TableActions  TableInput  Toast  ToastsContainer
```

Авто-импорт сохраняет привычные имена: `components/ui/Button/Button.vue` → `<UiButton>`.

### Чего здесь намеренно нет (доменные компоненты)

В слой попадают только компоненты, чьи `~/...`-зависимости есть в **каждом**
потребляющем приложении. Иначе компонент валит typecheck там, где зависимости нет
(в Nuxt-слое typecheck-аются все компоненты у каждого потребителя). Поэтому
доменно-связанные виджеты остаются **локально** в своих приложениях:

| Компонент                         | Живёт локально в | Завязан на                                   |
| --------------------------------- | ---------------- | -------------------------------------------- |
| `DateTimePickerUtc`, `WeekdayPicker` | ai-template, health-monitor | `~/utils/utc-datetime`, `~/constants/maintenance` → resource-домен |
| `ImageUpload`, `ImageCropper`, `QrCode` | auth-gateway | `~/stores/files.store`, `~/services/files.service`, `~/types/file` |

## Как подключить (в каждом фронтенде)

Слой — это не приложение, его нельзя запустить отдельно. Подключение в `nuxt.config.ts`
потребляющего приложения:

```ts
export default defineNuxtConfig({
  // через git (после публикации репозитория):
  extends: [['github:BloodHeavenDevelop/frontend-shared', { install: true }]],
  // или локально в этом workspace (соседняя папка):
  // extends: ['../../frontend-shared'],
});
```

После этого `<UiButton>`, `<UiTable>` и прочие доступны как раньше — через авто-импорт.

### ⚠️ Явные импорты `~/components/ui/...`

В коде приложений сотни **явных** импортов вида
`import UiButton from '~/components/ui/Button/Button.vue'`,
`import { useToasts } from '~/components/ui/ToastsContainer/composables'` и т.п.
Псевдоним `~` в коде приложения указывает на само приложение, а не на слой, поэтому
после удаления локальной `components/ui` эти импорты сломаются. Два пути:

1. **Alias (минимум правок).** Добавить в `nuxt.config.ts` приложения отдельный
   псевдоним и переписать импорты на него (sed-ом), `#shared-ui/` → слой:
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
   и `~/components/ui/` → `#shared-ui/` по всему приложению. Префикс **не** `#ui` —
   он занят `@nuxt/ui`; и не `~/components/ui`, чтобы не конфликтовать с базовым `~`.
2. **Только авто-импорт.** Убрать явные импорты компонентов (использовать `<UiX>` напрямую),
   а для не-компонентных экспортов (`useToasts`, типы `TableColumn`/`ButtonVariant`/`BadgeVariant`)
   завести их в авто-импортируемые директории слоя. Больше работы, чище результат.

## Контракт приложения (peer-зависимости)

Часть компонентов обращается к модулям, которые **остаются в каждом приложении**
(в слое их намеренно нет — это доменный код, а не design-system). При `extends`
алиас `~` внутри компонентов слоя резолвится в потребляющее приложение, поэтому эти
пути должны там существовать:

| Компонент          | Требует в приложении                                                            |
| ------------------ | ------------------------------------------------------------------------------- |
| `EnvBulkInput`     | `~/utils/parse-env`                                                            |
| `Table`            | `~/composables/use-table-column-preferences`                                   |
| `PopupContainer`   | `~/composables/use-popup-components`, `~/composables/use-popup-management`, `~/types/popup/interfaces` |
| `Modal/TFAModal`   | `~/composables/use-popup-control`, `~/composables/use-tfa-modal`, `~/types/popup` |

Все перечисленные пути присутствуют в каждом фронте проекта, поэтому слой
typecheck-ится чисто во всех потребителях.

Дополнительно: каноничный `TFAModal` использует i18n-ключи `twoFactor.*` и `common.cancel`.
Они есть в `auth-gateway`, но **отсутствуют** в `ai-template`/`health-monitor` — если те
рендерят TFA-модалку, ключи нужно добавить в их `i18n/locales`.

## Разрешение расхождений (эталон — DESIGN_MANIFEST.md)

На момент выноса версии компонентов в разных фронтах слегка расходились. Каноничная
версия выбрана по `DESIGN_MANIFEST.md`:

| Компонент            | Канон | Обоснование (манифест)                                                       |
| -------------------- | ----- | ---------------------------------------------------------------------------- |
| `Button`             | auth  | § 17.1: спиннер центрируется отрицательными margin, не `transform` (тот перебивается анимацией `hm-spin`). Версии ai/hm нарушали правило. |
| `FormSelect`         | auth  | § 11.2 / стр. 1298: добавлен `filter`-аффорданс (pixel-twin `.hm-input`, 30px, mono, 8px). |
| `HmSelect`           | hm    | § 11.2: тот же `filter`-аффорданс для toolbar.                               |
| `Modal/TFAModal`     | auth  | i18n вместо хардкод-строк — полнее и корректнее.                             |

Остальные компоненты во всех фронтах были идентичны. (`DateTimePickerUtc` тоже
расходился — hm-версия канонична по стр. 831, `flex-wrap: wrap` — но компонент
доменный и остаётся локально, см. выше.)
