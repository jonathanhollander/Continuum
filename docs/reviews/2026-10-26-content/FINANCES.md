# X385 — practical-record content

Last Updated: 2026-10-26 23:14 EDT. Reviewed base: `249763c`; implementation is in this report's commit. Scope: eight actual routes, two shared components and the approved financial summary label in `exportService.ts`.

| Reviewed page | Concrete correction | Checked interface |
|---|---|---|
| Financial accounts | Account/debt identifiers, statement source, ownership and questions for the institution; account-specific beneficiary label; financial-only net label | Guidance, add form, examples, three-record list, retained draft/retry, packet/PDF |
| Property | Locate items, title papers, keys and maintenance contacts; valuation date/source; blank example draft | Guidance, form, example |
| Insurance | Insurer/policy/claims sources; five recorded-detail checks explained without a validity/completeness claim | Guidance, form, example, source recount and packet membership |
| Digital Guardian | Provider-controlled access, recorded executor reference, manual practice checklist and recorded account wishes | Guidance, account form; existing provider controls retained |
| Subscriptions | Continue/review/close wishes and current provider requirements; editable enquiry with actual sender/capacity | Guidance, form, example, edited screen/print/PDF, second-service/account reset |
| Additional records | Four actual jobs: purchases, maintenance, claims and online account wishes; sources and next questions | Guidance, all four forms; transaction/maintenance/claim examples |
| Pet Care | Daily care, vet instructions, supply locations and an arrangement discussed with the carer; manual sharing guidance | Guidance, form, care-notes detail |
| Family & Contacts | Directory includes professional roles; call order and manually recorded notification state; explicit Pulse tier precedence | Guidance, form/tier hint, contact row, unchanged source counts |

No separate advisors route exists: the contacts form's Legal/Financial roles and practical notes cover it. Existing example buttons remain available, choose a relevant type where applicable, and open drafts without fictional monetary amounts, names, identifiers or beneficiaries. Typed fields are spread intact. The financial starter list is explicitly described as common record names with blank amounts; each saved starter carries that instruction. Writing-helper guidance explains the requested input, review step and destination of a suggested draft. Shared runtime chip/starter wording was handed to X388; no shared AI configuration was edited here.

## Focused proof

Approved temporary harness: `/private/tmp/continuum-x385-proof.mjs` (T-X385). Evidence: `/private/tmp/continuum-x385-2026-10-27T03-06-13.069Z/`. Actual Svelte routes at 1440×900 used a synthetic intercepted API; no backend, owner database, provider request or correspondence delivery was used. All eight before/after pages and forms were captured; additional-record forms and relevant lower fields were inspected. PDF pages were rendered and visually inspected, alongside extracted text.

- Independent financial arithmetic: half-up 50% of $100.01 = $50.01, less $30 owed = **$20.01**. The closed $999 record stays in the three-record list/packet and leaves totals; the separate $500 property leaves financial totals. UI, packet HTML and PDF use **Net financial value recorded** and the same membership. Numeric functions were not changed.
- Independent insurance recount: complete policy 5/5 plus partial policy 2/5 = **70%**, with the same five tests shown on screen. Both exact policy IDs remain in the UI/packet. The percentage is a count of recorded details; the packet contains the policy fields, not a separate readiness score. Existing active-premium/count functions were untouched.
- Contact figures retain the two source contacts and one manually marked notification. Labels now describe those recorded states; no delivery or Pulse-membership rule changed.
- Five page example paths plus maintenance/claim samples leave unknown amounts/IDs/personal fields blank. One forced account-save failure retained exact name/notes; Try Again resent the same captured payload once.
- The edited subscription body, `Morgan <Care> & Sample`, and actual capacity agreed in screen, escaped print HTML and downloaded Unicode PDF. A different service resets signature fields; an account change closes and clears the local letter. Sender fields belong to this draft, with no persistence claim.
- `npm run check`: 0 errors, 0 warnings. `npm run build`: passed. `git diff --check`: passed. Build/check logs are in `/private/tmp/continuum-x385-{build,check}.log`.

Harness failures were retained: visible CSS uppercase versus a case-sensitive assertion; an incorrectly snake-cased ownership field in the synthetic snapshot (the model's field is camelCase); and PDF line wrapping in a literal text assertion. Corrected fixture/assertions resumed affected/unfinished portions. No product failure was hidden. A few initial form captures caught transitions; settled captures replace those images while prior failure evidence remains.

## Limits and companions

This is a content/draft correction, not an API, numerical, legal or delivery feature. Existing insurance mapping and subscription saving coerce blank amounts to zero; X394 scopes that separate null/zero correction. Here new/example inputs are blank, and existing saved-number semantics remain unchanged. No broader financial calculations, historic records or schema were changed. X388 owns matching shared navigation/catalog labels, runtime chips and starters. The screenshots show this branch's shared labels/chips before that companion merges. Phone coverage is limited to the new subscription sender/capacity controls; the agreed full route matrix is desktop. The unchanged letter footer clips Reset to Default on a 390px phone; Print/Download and the new fields remain usable. This was reported for separate scope. No manual section or manual PDF was changed.
