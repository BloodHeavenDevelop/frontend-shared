# Security Finding Format

This document defines how a single security finding is written and stored. It is identical in
every repository of the workspace. If you change it, change every copy.

- Weekly reports that summarise findings: [REPORT_FORMAT.md](REPORT_FORMAT.md)
- Register of this repository's findings: [README.md](README.md)

A **finding** is a confirmed defect with a concrete path to harm: missing authorization, an
injection, a leaked secret, a vulnerable dependency, and so on. A design property without a
concrete exploit path is a **Potential Risk**. It goes into the report's *Potential Risks*
section, not into `findings/`.

---

## 1. Location and naming

```
docs/security-audit/
├── README.md              # register: one row per finding, list of reports
├── FINDING_FORMAT.md      # this document
├── REPORT_FORMAT.md       # weekly report format
├── findings/
│   └── <PREFIX>-<NN>-<short-slug>.md
└── reports/
    └── <YYYY-MM-DD>[-<scope>].md
```

- One finding = one file = one task = one fix branch = one PR.
- `<PREFIX>-<NN>` is the finding **ID**. It is immutable: it is quoted in the Kanban task, the
  branch, the PR, the CHANGELOG and every report. Never renumber, never reuse a withdrawn number.
- `<NN>` is sequential within the prefix (`01`, `02`, … `100`). Gaps are allowed.
- `<short-slug>` is kebab-case English, 3–8 words, describing the defect.

### Repository prefixes

| Prefix | Repository / component |
|---|---|
| `AG` | auth-gateway |
| `BM` | blogme |
| `CG` | coingecko-gateway |
| `CR` | currency-rates-gateway |
| `DP` | deployer (`DP-01…DP-18` are inherited by tokenizer-deployer) |
| `DT` | tokenizer-deployer (findings specific to the fork) |
| `FG` | feedback-gateway |
| `HM` | health-monitor |
| `MG` | messengers-gateway |
| `PC` | tokenizer-payout-connector |
| `TB` | tokenizer-bi |
| `TC` | tokenizer-crm |
| `TCW` | tokenizer-crm-white-label |
| `TP` | tokenizer-platform — backend |
| `FA` | tokenizer-platform — frontend-admin |
| `FC` | tokenizer-platform — frontend-client |
| `W3` | web3-gateway |
| `AT` | ai-template |
| `CH` | charts-gateway |
| `CT` | contracts |
| `DB` | dashboard |
| `DC` | deploy-witness-cli (filed in the private deploy-witness repository) |
| `DW` | deploy-witness |
| `FS` | frontend-shared |
| `LD` | landing |
| `MA` | mail-auditor |
| `MT` | metrics-gateway |
| `PG` | payments-gateway |
| `TS` | test-platform |
| `TT` | task-tracker |
| `UT` | utils |
| `WH` | webhooks-gateway |

A new repository gets a new 2–3 letter prefix. Add it to this table in every copy.

---

## 2. Classification (severity scoring)

Severity is derived from the scores, not chosen by feel. Every finding carries all five fields.

### 2.1 Impact Rate (1–5)

| Score | Criterion |
|---|---|
| 5 | Compromise of the platform or of all user data; RCE on a node; loss of funds |
| 4 | Account takeover, personal-data leak, access to secrets |
| 3 | Privilege escalation inside one service, bypass of a business control |
| 2 | Technical information leak, denial of service of one component |
| 1 | Informational; affects code hygiene only |

### 2.2 Likelihood Rate (1–5)

| Score | Criterion |
|---|---|
| 5 | Exploitable anonymously from the internet, no special conditions |
| 4 | Requires any authenticated account (including self-registration) |
| 3 | Requires a privileged role or access to the internal network |
| 2 | Requires a race, a MITM position or an uncommon configuration |
| 1 | Requires physical access or an already complete compromise |

### 2.3 Exploitability and Complexity

| Field | Values |
|---|---|
| **Exploitability** | `Independent` — no outside conditions · `Semi-Dependent` — needs one condition (a role, a flag, a victim action) · `Dependent` — needs several conditions or a prior compromise |
| **Complexity** | `Simple` — a few requests or one script · `Complex` — chaining, timing, or deep protocol knowledge |

### 2.4 Severity

Risk score = Impact Rate × Likelihood Rate.

| Severity | Rule | Kanban priority | Remediation deadline (from confirmation) |
|---|---|---|---|
| **Critical** | score 15–25 | `blocker` | 24 hours to a control (fix or workaround) |
| **High** | score 10–14 | `high` | 7 calendar days |
| **Medium** | score 5–9 | `medium` | 30 calendar days |
| **Low** | score 2–4 | `low` | within 90 days |
| **Info** | Impact Rate = 1 (no direct security impact) | `low` | scheduled |

Do not use the `urgent` Kanban priority: the board queue sorts it last.

### 2.5 Status

| Status | Meaning |
|---|---|
| `Pending Fix` | Confirmed, not fixed yet |
| `Fix Submitted` | A fix PR exists but is not yet verified on the base branch |
| `Fixed` | Fix is on the base branch and post-fix verification passed |
| `Mitigated` | Risk reduced (partial fix or compensating control); the root cause remains. The remainder is described under **Resolution** and, if it is a separate defect, filed as a new finding |
| `Accepted` | The risk owner accepted the risk in writing (who, why, review date — under **Resolution**) |
| `Unconfirmed` | Could not be reproduced yet. No severity counts until confirmed |
| `Withdrawn` | False positive. The file stays with an explanation; the ID is never reused |

A regression of a `Fixed` finding reopens the same ID (status back to `Pending Fix`, with a note
under **Resolution**). A new defect discovered while re-testing gets a new ID.

---

## 3. File template

Section names and field labels are fixed strings (they match the Hacken report layout). Keep
them verbatim. Optional sections are marked; drop them if empty.

````markdown
# <ID> - <Title in Title Case> - <Severity>

| | |
|---|---|
| **Task** | [<CODE>](https://bi.tokenizer.estate/kanban/task/<CODE>) |
| **Confidentiality** | Confidential |
| **Identified** | YYYY-MM-DD |
| **Audited at** | `<branch>` @ `<commit>` |
| **Last verified** | YYYY-MM-DD @ `<commit>` |
| **CWE** | CWE-XXX (Name) |
| **CVSS v3.1** | <score> (<vector>) — optional |
| **Risk owner** | <role or name> — optional |
| **Fix branch / PR** | `security/<slug>` · PR #<n> — optional |

## Description

<Context: which mechanism is involved and where.>

<The defect: what exactly is wrong, with a code excerpt.>

```ts
// path/to/file.ts — functionName()
<vulnerable code>
```

<Analysis: step by step, why the logic fails.>

This can lead to:

- <concrete consequence>
- <concrete consequence>

## Assets

- `path/to/file.ts` — `functionName()` [<repository URL>]

## Status

<Status> — <one line: what state the code is in now, as of Last verified>

## Classification

| | |
|---|---|
| **Impact Rate** | N/5 — <justification> |
| **Likelihood Rate** | N/5 — <justification> |
| **Exploitability** | Independent / Semi-Dependent / Dependent |
| **Complexity** | Simple / Complex |
| **Severity** | Critical / High / Medium / Low / Info (score N×N=NN) |

## Recommendations

### Remediation

<The specific control to implement. Several options → ordered by priority.>

### Resolution

<How it was fixed: PR, commit, what changed. For Accepted: who accepted, why, review date.
For Mitigated: what remains. "—" while Pending Fix.>

## Evidences

### PoC

**Reproduce:**

1. <step>
2. <step>

**PoC Code:**

```bash
<minimal request / script / test>
```

**Results:**

```
<actual output that proves the defect>
```

### Post-fix verification

<Steps or a test that proves the control works.>

## Residual Risk

<Optional. What the fix does not cover and what to do about it.>

## Related Findings

<Optional. Links to other IDs.>
````

---

## 4. Writing rules

1. **English only.** Code, identifiers and log output stay verbatim.
2. **Confirm before filing.** Read the code to the end of the call chain, or reproduce with a
   test or a request. A finding that cannot be confirmed is filed as `Unconfirmed`.
3. **One defect per file.** Two consequences of one root cause → one finding. Two root causes →
   two findings.
4. **Evidence for claims.** "Leads to account takeover" only when the path is shown in
   *Description* or *PoC*. For Medium and above a PoC is mandatory. For Info, pointing to the
   location is enough.
5. **No live secrets.** Never paste a working key, password or token into a finding. Show the
   first 4 characters and `…`. A secret found during the audit counts as compromised: file a
   rotation task with priority `high` or above.
6. **Precise names.** Functions, routes, roles, env vars and file paths exactly as in the code at
   the audited commit. Use `file:line` where it helps.
7. **Present tense, impersonal.** "The handler returns…", not "we found that…".
8. **Keep history.** Never delete a finding file. Status changes are written under **Status**
   and **Resolution**, and the `Last verified` field is updated.
9. **Keep the register in sync.** Every change of title, severity or status is mirrored in the
   [README.md](README.md) register in the same commit.
10. **Classification:** findings are Confidential and live in private repositories only.
