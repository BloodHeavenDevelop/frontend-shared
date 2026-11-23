# Security Audit Report Format

This document defines the weekly security audit report. The layout follows the Hacken
*Code Review and Security Analysis Report*. It is identical in every repository of the
workspace. If you change it, change every copy.

- How a single finding is written: [FINDING_FORMAT.md](FINDING_FORMAT.md)
- Register of this repository's findings: [README.md](README.md)

---

## 1. What a report is

- A report is a **snapshot**: the state of the code at one commit and the state of all
  findings on one date. It is never edited after publication, except for typo fixes. Later
  changes go into the next report.
- Reports are produced **weekly** for every repository under audit. Ad-hoc reports (an
  initial audit, a DAST engagement, a re-verification) use the same format.
- File: `reports/<YYYY-MM-DD>.md`, where the date is the report date. The weekly report covers
  the **whole repository**: backend, every frontend and every other component in one document.
  Only ad-hoc reports (e.g. a DAST engagement on one component) may be split; they get a scope
  suffix: `reports/2026-09-15-frontend-admin.md`.
- **Findings** are authoritative in `findings/<ID>-*.md`. The report carries a condensed block
  for each finding (see §3.8) and links to the finding file for the full PoC.
- Language: English. Confidentiality: Confidential.

### 1.1 Weekly procedure

1. Pick the commit: the current head of the base branch (`main`, `stage`, …). Record its full hash.
   List the repository's components (§1.2) and decide the scope: every component changed since
   the previous report, plus every component that is **due** (§1.2).
2. Re-verify every finding whose status is not `Fixed`, `Accepted` or `Withdrawn`. For each one,
   read the current code or re-run the PoC. Spot-check `Fixed` ones touched by recent commits
   for regressions.
3. Review the changes since the previous report's commit (`git log <prev>..<head>`), focusing
   on authentication, authorization, input handling, secrets, dependencies and infrastructure.
4. File new findings in `findings/` (see [FINDING_FORMAT.md](FINDING_FORMAT.md)) and update the
   `Status`, `Resolution` and `Last verified` fields of existing ones.
5. Update the register in [README.md](README.md).
6. Write the report from the template in §4. Counters must reconcile with the register.

### 1.2 Component coverage

A **component** is a separately built or deployed part of the repository: the backend, each
frontend (e.g. `frontend-admin`, `frontend-client`, promo sites), a browser extension, a worker
or queue service, shared packages that ship to clients, and the infrastructure files (Dockerfiles,
k8s manifests, CI).

- Every report lists **every** component in Appendix 2 with its coverage for this report:
  `Reviewed` (what was checked: changed code, full review, DAST), `Not reviewed` (with the reason),
  or `Not applicable`.
- Frontend and backend of one repository are reported **together**, in the same weekly report.
  A frontend is not "out of scope" just because the backend is the focus.
- A component is **due** when it has not been `Reviewed` in any of the last 4 weekly reports.
  A due component must be reviewed in the next weekly report: at minimum its auth/session
  handling, rendering of untrusted data (XSS sinks, `v-html`, `innerHTML`), redirects, token and
  secret storage, security headers/CSP, third-party scripts and `pnpm audit` of its lockfile.
- The coverage table carries the date each component was last reviewed, so "due" can be read
  directly from the previous report.

---

## 2. Section order

Section names below are fixed strings. Keep them verbatim and in this order.

| # | Section | Required |
|---|---|:---:|
| 1 | Title, `Customer`, `Date` | yes |
| 2 | `Document`, `Review Scope` | yes |
| 3 | `Audit Summary` (counters, `Findings by Severity`, summary table) | yes |
| 4 | `Changes Since Previous Report` | yes, except for the first report |
| 5 | `Documentation quality`, `Code quality`, `Test coverage` | yes |
| 6 | `Table of Contents` | yes |
| 7 | `System Overview`, `Privileged Roles` | yes |
| 8 | `Potential Risks` | yes |
| 9 | `Findings` → `Vulnerability Details` | yes |
| 10 | `Disclaimers` | yes |
| 11 | `Appendix 1. Definitions` | yes |
| 12 | `Appendix 2. Scope` | yes |
| 13 | `Appendix 3. Additional Valuables` | optional |

---

## 3. How to fill each section

### 3.1 Title

`# Code Review and Security Analysis Report — <repository>`, then `**Customer:**` and
`**Date:**` in `DD/MM/YYYY`. Customer is `Tokenizer.Estate` for tokenizer-* repositories and the
gateways, `SwitchCase` for deployer, health-monitor and blogme. Customer is `BloodHeaven` for repositories of the BloodHeaven workspace.

### 3.2 Document and Review Scope

| Field | Content |
|---|---|
| Name | `Code Review and Security Analysis Report for <repository>` |
| Audited By | Who performed the review (people, or the tool and its operator) |
| Approved By | Who signed it off; `Pending sign-off` until someone does |
| Website | Product website |
| Changelog | `DD/MM/YYYY - <Preliminary Report / Weekly Report / Re-verification>`; one line per revision |
| Platform | e.g. `Web backend (NestJS, PostgreSQL)` |
| Language | e.g. `TypeScript`, `Go` |
| Tags | Short keywords: `API`, `OAuth2`, `Web3`, `SSRF`, … |
| Methodology | White-box review / black-box DAST / SCA, and a link to [REPORT_FORMAT.md](REPORT_FORMAT.md) |

**Review Scope**: `Repository` (URL), `Branch`, `Initial Commit` (first commit reviewed in this
audit series, or the previous report's commit), `Final Commit` (the commit this report describes).
A report without a commit is invalid.

### 3.3 Audit Summary

Start with one sentence: "The system users should acknowledge all the risks summed up in the
risks section of the report."

Counters (all findings in the register, not only this week's):

| Total Findings | Resolved | Accepted | Mitigated | Pending |
|:---:|:---:|:---:|:---:|:---:|

- **Resolved** = `Fixed`. **Pending** = `Pending Fix` + `Fix Submitted`.
- `Unconfirmed` and `Withdrawn` are not counted. List them in Appendix 3 if relevant.

**Findings by Severity**: always all five levels, including zeros
(Critical, High, Medium, Low, Info).

Summary table: `Vulnerability | Severity | Status`. One row per finding, the ID linked to the
finding file, sorted by severity (Critical → Info), then by ID.

### 3.4 Changes Since Previous Report

A short list: new findings (ID and title), status changes (`ID: Pending Fix → Fixed`, with the
PR or commit), regressions, and severity changes with a reason. Link the previous report.

### 3.5 Documentation quality / Code quality / Test coverage

Short bullet lists, stated plainly. Write only what was checked. Unknown → "Not assessed in this
review." Don't invent coverage numbers.

### 3.6 System Overview and Privileged Roles

One or two paragraphs: what the system is, its components, who calls it. Then **Privileged
Roles**: every role, API key type or service identity with elevated power, in the form
`ROLE_NAME: what it can do`. This section shows where control is concentrated.

### 3.7 Potential Risks

Design properties that are not bugs but affect security or trust: concentration of power in a
role, a single shared API key, a kill-switch flag, data that is public by design, and so on.
Write each as a paragraph: mechanism → risky scenario → consequence. No ID and no severity. If it
has a concrete exploit path, it is a finding instead.

### 3.8 Findings → Vulnerability Details

One block per finding, in the same order as the summary table. Two forms:

**Full block.** Use it for findings that are new in this report, or that changed status or
severity:

````markdown
### [<ID>](../findings/<ID>-<slug>.md) - <Title> - <Severity>

**Description:** <context, defect and analysis, condensed to 1–3 paragraphs; a key code excerpt
if it helps>

This can lead to:
- <consequence>

**Assets:**
- `path/to/file` [<repository URL>]

**Status:** <Status>

**Classification**

| | |
|---|---|
| Impact Rate | N/5 |
| Likelihood Rate | N/5 |
| Exploitability | … |
| Complexity | … |
| Severity | … |

**Recommendations**

**Remediation:** <what to change>

**Resolution:** <how it was fixed / what remains / "—">

**Evidences:** PoC, PoC code and results — see [<ID>](../findings/<ID>-<slug>.md#evidences).
````

**Short block.** Use it for findings carried over unchanged from the previous report:

````markdown
### [<ID>](../findings/<ID>-<slug>.md) - <Title> - <Severity>

**Status:** <Status> (unchanged since <DD/MM/YYYY>). Re-verified at `<commit>`: <one line>.
````

### 3.9 Disclaimers

Copy the boilerplate from the template in §4 unchanged.

### 3.10 Appendix 1. Definitions

Copy the severity table and the Potential Risks definition from the template unchanged.

### 3.11 Appendix 2. Scope

Repository, branch, initial and final commit (**full hashes**), requirements documents if any,
then the **component coverage table** (§1.2): every component of the repository with its type,
coverage in this report and the date it was last reviewed. Add an **Out of scope** list. It is
mandatory: without it the report reads as exhaustive, which it is not.

### 3.12 Appendix 3. Additional Valuables

Optional: remediation order, what was done well (verified controls), withdrawn/false-positive
items with the reason, tooling used (`pnpm audit`, `govulncheck`, DAST tools), and references
(NIST SP 800-115, PTES, OWASP ASVS, ISO/IEC 27001 A.8.8).

---

## 4. Template

Copy, then replace every `<…>`.

````markdown
# Code Review and Security Analysis Report — <repository>

**Customer:** <Tokenizer.Estate | SwitchCase>
**Date:** <DD/MM/YYYY>

## Document

| | |
|---|---|
| Name | Code Review and Security Analysis Report for <repository> |
| Audited By | <auditors> |
| Approved By | Pending sign-off |
| Website | <https://tokenizer.estate/ | https://switchcase.dev/> |
| Changelog | <DD/MM/YYYY> - <Weekly Report> |
| Platform | <…> |
| Language | <…> |
| Tags | <…> |
| Methodology | <White-box code review, SCA>; [REPORT_FORMAT.md](../REPORT_FORMAT.md) |

## Review Scope

| | |
|---|---|
| Repository | <https://github.com/switchcase-devs/<repo>> |
| Branch | `<base branch>` |
| Initial Commit | `<sha>` |
| Final Commit | `<sha>` |

## Audit Summary

The system users should acknowledge all the risks summed up in the risks section of the report.

| Total Findings | Resolved | Accepted | Mitigated | Pending |
|:---:|:---:|:---:|:---:|:---:|
| <N> | <N> | <N> | <N> | <N> |

### Findings by Severity

| Severity | Count |
|---|:---:|
| Critical | <N> |
| High | <N> |
| Medium | <N> |
| Low | <N> |
| Info | <N> |

| Vulnerability | Severity | Status |
|---|---|---|
| [<ID>](../findings/<ID>-<slug>.md) - <Title> | <Severity> | <Status> |

## Changes Since Previous Report

Previous report: [<DD/MM/YYYY>](<YYYY-MM-DD>.md)

- **New:** <ID> - <Title>
- **Status changed:** <ID>: <old> → <new> (<PR / commit>)
- **Regressed:** none

## Documentation quality

- <…>

## Code quality

- <…>

## Test coverage

- <…>

## Table of Contents

- [System Overview](#system-overview)
- [Potential Risks](#potential-risks)
- [Findings](#findings)
- [Disclaimers](#disclaimers)
- [Appendix 1. Definitions](#appendix-1-definitions)
- [Appendix 2. Scope](#appendix-2-scope)
- [Appendix 3. Additional Valuables](#appendix-3-additional-valuables)

## System Overview

<…>

### Privileged Roles

- `<ROLE>`: <…>

## Potential Risks

- <…>

## Findings

### Vulnerability Details

<blocks per §3.8>

## Disclaimers

### Audit Disclaimer

This review analyses the source code listed in the scope, at the stated commit, against
industry practice at the time of writing. The report makes no statement or warranty that all
vulnerabilities have been identified or that the code is secure. It covers only the code
reviewed and may not hold after any modification. It is not a final or sufficient assessment of
the code's safety, fitness or correctness. Independent audits, continuous review of changes and
a responsible-disclosure channel are recommended in addition to this report.

### Technical Disclaimer

The software runs on third-party platforms (runtimes, frameworks, databases, cloud services,
blockchains) that may contain their own vulnerabilities. The auditors cannot guarantee the
security of the reviewed system as a whole.

## Appendix 1. Definitions

### Severities

Severity is derived from Impact Rate × Likelihood Rate, as defined in
[FINDING_FORMAT.md §2](../FINDING_FORMAT.md#2-classification-severity-scoring).

| Severity | Description |
|---|---|
| Critical | Straightforward to exploit, usually without special access. Leads to compromise of the platform, of all user data, of secrets or of funds. |
| High | Requires some precondition (an account, a role, a configuration) or has narrower scope, but still leads to account takeover, personal-data exposure, access to secrets or loss of funds. |
| Medium | Bypass of a business or security control, privilege escalation inside one service, or exposure limited in scope. Major deviations from security best practice. |
| Low | Limited technical information leakage, denial of service of a single component, or a hardening gap with no direct exploit path. |
| Info | No direct security impact: code hygiene, defence in depth, documentation. |

### Potential Risks

The Potential Risks section lists issues that are not direct vulnerabilities but may affect the
system's security, reliability or users' trust. They come from design choices, architecture or
operational practice, and may lead to problems under certain conditions. They can also mark
areas outside the audit's scope that limit how complete the assessment is.

## Appendix 2. Scope

| | |
|---|---|
| Repository | <URL> |
| Branch | `<branch>` |
| Initial Commit | `<full sha>` |
| Final Commit | `<full sha>` |
| Requirements | <link or N/A> |

| Component | Type | Coverage in this report | Last reviewed |
|---|---|---|---|
| `backend/` | Backend service | Reviewed — <changed code / full review / DAST> | <DD/MM/YYYY> |
| `frontend/` | Frontend (Nuxt SPA) | Reviewed — <…> / Not reviewed — <reason> | <DD/MM/YYYY> |
| `Dockerfile`, `k8s/` | Infrastructure | <…> | <DD/MM/YYYY> |

**Out of scope:**

- <…>

## Appendix 3. Additional Valuables

### Remediation Order

1. <…>

### Verified Controls

- <…>

### Frameworks and Methodologies

The review follows OWASP ASVS, NIST SP 800-115 and PTES, and ISO/IEC 27001:2022 control A.8.8
(management of technical vulnerabilities).
````

---

## 5. Pre-publication checklist

- [ ] Repository, branch and **full** final commit hash are stated (Review Scope and Appendix 2).
- [ ] Counters reconcile with the summary table and with the README register.
- [ ] `Findings by Severity` lists all five levels, including zeros.
- [ ] Summary table is sorted by severity, then ID; every ID links to its finding file.
- [ ] Every new or changed finding has a full block; every unchanged one has a short block.
- [ ] Severity matches Impact × Likelihood for every finding.
- [ ] `Privileged Roles` lists every privileged role, key type and service identity.
- [ ] Potential Risks contains nothing with a concrete exploit path.
- [ ] Appendix 2 lists **every** component of the repository (backend, each frontend, other
      parts) with coverage and last-reviewed date; no component is due (§1.2) and left unreviewed.
- [ ] `Out of scope` is filled in.
- [ ] No live secret appears anywhere in the report.
