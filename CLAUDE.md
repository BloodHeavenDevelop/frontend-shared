Это `@bloodheaven/frontend-shared` — общий Nuxt-слой с каноничными UI-примитивами
design-system (`components/ui/*`). Единый источник правды для всех фронтендов проекта;
локальных копий `components/ui` в репозиториях быть не должно.

Подробности подключения, контракт peer-зависимостей и журнал разрешения расхождений —
в [README.md](README.md). Требования к дизайну — в корневом `DESIGN_MANIFEST.md`
проекта и `DESIGN_SPECIFICATION.md` потребляющих репозиториев.

Слой везёт и сам CSS дизайн-системы: `assets/styles/hm-base.css` (токены `--hm-*`, все
`.hm-*` примитивы, `@font-face` и вход в Tailwind 4) плюс `public/fonts/*.woff2`.

Tailwind 4 конфигурируется из CSS, и всё это живёт в `hm-base.css`:
`@import 'tailwindcss'` первой строкой (`@import` легален только до других правил),
следом `@import '@nuxt/ui'`, `@source` на `components/`, `pages/` и `app.config.ts`
слоя, шкала `hm-*` в `@theme` и мост `--ui-* → --hm-*`. Два `@source`/`@import` —
не украшение: Tailwind 4 не сканирует `node_modules`, где слой и `@nuxt/ui` и лежат
у потребителя, поэтому без них классы есть в разметке и отсутствуют в CSS.

Тема `@nuxt/ui` — в `app.config.ts` слоя. Nuxt мержит app-конфиги слоёв под конфиг
приложения, так что дизайн-система описана один раз на всю платформу; в приложении
`ui`-блока быть не должно, только его собственное (`authUi`). Темы `@nuxt/ui` 4 — это
Tailwind Variants (`slots`/`variants`), и мержатся поверх библиотечных, поэтому в
блоках только отклонения.
Потребители подключают его первой строкой своего `assets/styles/main.css`
(`@import '@bloodheaven/frontend-shared/assets/styles/hm-base.css';`) — не через `css:`
в конфиге слоя, иначе база встанет ПОСЛЕ правил приложения. Подробности — в README.md.

Кроме UI слой везёт `composables/` — композаблы, чья единственная зависимость это
общий для всей платформы контракт бэкенда (например `use-recaptcha` ↔ Go-пакет
`utils/recaptcha`). Они авто-импортируются у потребителей так же, как компоненты.
Доменные композаблы сюда не переносим — только то, что иначе дублируется в каждом
фронте один в один.

Правила:
- Поверх `.hm-*` классов из DESIGN_MANIFEST.md; никаких Tailwind-only компонентов рядом
  с manifest-aligned. Для каждой UI-роли — ровно одна реализация.
- Любое портируемое CSS-правило (новый примитив, токен, правка существующего класса) —
  в `hm-base.css` здесь, а не в `main.css` потребителя. В приложении остаётся только
  проектное: ширина канваса, auth-shell, оверрайд вендорного виджета.
- Мобильная вёрстка (≤768px) — по корневому `DESIGN_MANIFEST_MOBILITY.md`, и она тоже
  живёт здесь: блок `@media (max-width: 768px)` в `hm-base.css`, респонсив-ветки внутри
  `components/ui/*` и `MobileNav`. В приложении из мобильного — только монтирование
  `<UiMobileNav>` в лэйауте. `@media`-блок в `main.css` потребителя = форк дизайн-системы.
- Внутри слоя ссылки между ui-компонентами — **относительными** путями (`../X/...`),
  не `~/components/ui/...` (псевдоним `~` в слое указывает на потребляющее приложение).
- Импорты `~/composables`, `~/stores`, `~/utils`, `~/types`, `~/constants`, `~/services`,
  `~/api` намеренно остаются — это контракт приложения (см. таблицу в README). Доменный
  код сюда не переносим.
- **Темы.** Палитра и шрифты — тема: блок `--hm-*` под `:root[data-theme='<id>']` в
  `assets/styles/themes/<id>.css` (Nocturne — тёмная, по умолчанию; Daylight — светлая).
  Вне файлов тем никаких литеральных `rgba(…)`/hex в `hm-base.css` и `components/ui/*` —
  только токены, оттенок = `color-mix(in srgb, var(--hm-accent) 30%, transparent)`.
  Выбор темы — `useTheme()` / `<UiThemeSwitcher>`, см. README → Themes.
- **Каркас приложения** (хэдер, тело, футер, мобильная навигация) — `<UiAppLayout>`
  (`AppHeader`/`AppBody`/`AppFooter`). Лэйаут приложения только наполняет его данными и
  слотами; свою разметку `.hm-header`/`.hm-footer` в приложениях не держим.
- При расхождении версий между фронтами канон определяется по DESIGN_MANIFEST.md.
- Любой апдейт сущностей в UI — через amqp на messengers-gateway (см. корневой CLAUDE.md).
- Время приходит с бэка в **UTC**; отображаем в таймзоне пользователя в формате
  ISO 8601 `YYYY-MM-DD HH:MM:SS` (напр. `2026-06-15 14:30:05`). Сырой UTC в UI не
  показываем. Таймзона и локаль — настройки аккаунта в auth-gateway, слой их сам не
  читает: компоненты с календарём принимают `weekStart` / `locale` пропсами от приложения.

## Git Worktrees — FORBIDDEN

- **Never use git worktrees.** Do not run `git worktree add` / `list` / `remove` / `prune`, do not create or work inside a separate worktree directory, and never suggest a worktree as a way to isolate work.
- Do not use any tool or agent "worktree" isolation mode (e.g. the `EnterWorktree` / `ExitWorktree` tools, or `isolation: "worktree"` when spawning an agent).
- Work directly in the existing repository clone. If another branch is needed, verify the tree is clean and switch in place with `git switch`.
