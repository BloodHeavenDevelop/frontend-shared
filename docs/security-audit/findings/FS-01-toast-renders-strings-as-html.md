# FS-01 - Toast Container Renders Plain Strings As HTML - High

| | |
|---|---|
| **Task** | Not filed |
| **Confidentiality** | Confidential |
| **Identified** | 2026-11-23 |
| **Audited at** | `main` @ `f89655e7fb5a971d2f16db409a2992eb7c655f6b` |
| **Last verified** | 2026-11-23 @ `f89655e7fb5a971d2f16db409a2992eb7c655f6b` |
| **CWE** | CWE-79 (Improper Neutralization of Input During Web Page Generation) |

## Description

`useToasts().add()` is the notification API of every platform frontend. Its contract is `title: string` and `description?: string`, and nothing in the type or name says the value is HTML. `ToastsContainer.vue` nevertheless assigns both through `v-html`.

```vue
<!-- components/ui/ToastsContainer/ToastsContainer.vue:31-39 -->
<p class="text-hm-text text-[13px] font-semibold" v-html="toast.title" />
...
<p v-html="toast.description" />
```

Neither `add()` nor `update()` in `components/ui/ToastsContainer/composables.ts` escapes or sanitises. Call sites pass entity names and backend messages. One confirmed chain in the deployer frontend, which mounts this container in `app.vue:33`:

```ts
// deployer/frontend/pages/cloudflare/index.vue:76 — onVerify()
toast.add({ title: `${credential.name} is valid`, type: 'success' });
```

1. `POST /api/cloudflare/credentials` and `PATCH /api/cloudflare/credentials/:credentialId` require `DashboardCreate`.
2. `ICredentialCreate.Name` has only `binding:"required"`. `Create` and the update path apply `strings.TrimSpace` and store the value, so markup survives. Creation needs a token Cloudflare accepts; a rename of an existing credential does not need a new one.
3. A second user with `DashboardCreate`, or a superAdmin, presses **Verify** on that credential.
4. The name is assigned to `innerHTML`. An event-handler payload such as `<img src=x onerror=...>` runs in the deployer origin.
5. The deployer keeps the access and refresh tokens in `localStorage` (`deployer/frontend/stores/auth.store.ts:94-95`), so the script can read and exfiltrate both.

The platform has no Content-Security-Policy in any audited frontend or container config. The platform proxy config is not in the audited snapshot, so a CSP set there could not be checked.

This can lead to:

- Takeover of the victim's session, including a superAdmin's, in the affected product.
- Vertical escalation from `DashboardCreate` to whatever the victim holds. On the deployer that reaches server and deployment control.
- The same sink being reachable from any other call site that passes stored or server-supplied text. All frontends on `frontend-shared` v0.16.0 render through it.

## Assets

- `components/ui/ToastsContainer/ToastsContainer.vue` — toast `title` and `description` slots [https://github.com/BloodHeavenDevelop/frontend-shared]
- `components/ui/ToastsContainer/composables.ts` — `useToasts()` [https://github.com/BloodHeavenDevelop/frontend-shared]
- Confirmed call site: `deployer/frontend/pages/cloudflare/index.vue` — `onVerify()` [https://github.com/BloodHeavenDevelop/deployer]

## Status

Pending Fix — both toast slots render through `v-html` at the audited commit.

## Classification

| | |
|---|---|
| **Impact Rate** | 4/5 — account takeover through theft of access and refresh tokens |
| **Likelihood Rate** | 3/5 — the confirmed chain requires a privileged permission (`DashboardCreate`) |
| **Exploitability** | Semi-Dependent — needs the permission and a victim pressing Verify |
| **Complexity** | Simple |
| **Severity** | High (score 4×3=12) |

## Recommendations

### Remediation

1. Render `title` and `description` as text (`{{ toast.title }}`) in `ToastsContainer.vue`, release a new `frontend-shared` version, and bump every consumer.
2. If a toast genuinely needs markup, add a separate slot or `customComponent` at that call site. Do not accept an HTML string in the general API.
3. Grep consumers for toast strings containing intended markup before release, since they would start showing literally.
4. Add a CSP at the platform proxy as defence in depth.

### Resolution

—

## Evidences

### PoC

Verified by code reading; not executed.

**Reproduce:**

1. As a user holding `DashboardCreate`, rename an existing Cloudflare credential to a harmless marker payload.
2. As a second user, open `/cloudflare` and press **Verify** on it.
3. The toast assigns the name to `innerHTML` and the handler runs.

**PoC Code:**

```http
PATCH /api/cloudflare/credentials/<credentialId>
Authorization: Bearer <token of a DashboardCreate holder>
Content-Type: application/json

{"name":"<img src=x onerror=console.log(document.domain)>"}
```

**Results:**

```
Not executed. Expected: the victim's console shows the deployer origin when the toast appears.
```

### Post-fix verification

A component test adds a toast whose title is `<img src=x onerror=...>` and asserts no `img` element exists and the text is shown literally.

## Residual Risk

Tokens stay in `localStorage` by platform design, so any other XSS has the same impact. Call sites other than the confirmed one were listed but not each traced to their data source; each service's auditor should check its own.
