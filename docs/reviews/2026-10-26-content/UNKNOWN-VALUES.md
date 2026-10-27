# X394 — Unknown premiums and recurring costs

Verified 2026-10-27 UTC on `codex/X394`. Source checkpoint: `253f97b`; current main was merged afterward, preserving the X385 PDF cancellation/session companion. No production operation belongs to this card.

## Result

Blank insurance premiums and subscription costs are sent explicitly as null, survive create/edit/reload, and read as “Not recorded.” Entered zero remains zero. Existing zero/nonzero rows are preserved; there is no backfill or migration.

The six reserved frontend files contain the nullable types/mapper, explicit-null form payloads, row/table formatting and premium/cost packet formatting. Insurance arithmetic skips unknown amounts; subscription arithmetic uses only recorded open services with the existing cadence and cents rounding. Both screens disclose recorded/eligible amount counts. Existing eligible rows with every amount unknown show “Not recorded”; an empty eligible set yields zero; a recorded zero remains a recorded amount. Subscription packet summaries apply the same rule and counts, so binder, PDF and recipient outputs agree. The financial account summary label from X385 is unchanged.

One additional backend literal was approved after the actual API reproduction: `InsurancePolicy.premium_amount` had an ORM default of `0.0`. An explicit-null POST returned `200` with zero because SQLAlchemy applied that client default. Changing the model default to `None` preserves null on new INSERTs. The existing column is nullable; root separately confirmed production has no database default. No schema or production-record change was made.

## Focused proof (T-X394)

Root approved retained private harnesses `/private/tmp/continuum-x394-proof/api_harness.py` and `roundtrip.mjs`. They use the frozen CARD_BRIEF virtual environment, a disposable SQLite database migrated to the existing head, actual FastAPI routes and signed synthetic JWTs, and Chromium at 1440×900. Lifespan/scheduler and mail delivery are disabled. No authentication dependency override, provider call or real owner database is used. Nonessential browser endpoints are intercepted; financial writes, authentication, snapshot and recipient reads use the actual local API.

| State | Active insurance: recorded/eligible | Insurance monthly / annual | Open services: recorded/eligible | Services monthly / annual |
| --- | --- | --- | --- | --- |
| Empty eligible sets (inactive/closed rows retained) | 0/0 | $0 / $0 | 0/0 | $0 / $0 |
| All unknown | 0/1 | Not recorded / Not recorded | 0/1 | Not recorded / Not recorded |
| Unknown plus entered zero | 1/2 | $0 / $0 | 1/2 | $0 / $0 |
| Partial recorded values | 4/5 | $140 / $1,680 | 3/4 | $20.01 / $240.12 |

The independent recount uses source record IDs and raw API amounts. Final insurance members are active IDs 5–9, with ID 5 unknown; inactive ID 4 is excluded. Final open service members are IDs 4–7, with ID 4 unknown; closed ID 3 is excluded. Monthly, quarterly and annual premiums, monthly/yearly service cadence and closed/inactive membership were checked without changing their rules.

Actual forms created null, zero and nonzero records. Both forms edited nonzero amounts to blank, sent explicit-null PUTs, reloaded blank, and restored the entered value. A controlled insurance POST failure retained the blank draft. After the user typed 99, the old Retry still sent its captured null, persisted null, and retained the newer 99 draft until explicit dismissal. A separate synthetic account's existing zero rows and null cost stayed unchanged.

At each state, raw snapshot IDs/amounts, the readable packet, packet HTML and generated PDF fields/summaries agreed. A fresh browser checked Cards and Table views. The real binder and a fresh no-sign-in synthetic recipient page showed the same records; recipient financial sections exactly matched the owner's snapshot. The actual downloadable ZIP retained null/zero and membership in `snapshot.json`, included matching HTML/PDF, and reported zero expected files with a complete manifest. No attachment retrieval claim is made because this monetary proof contains no attachments. No page errors occurred.

Harness-only failures were retained in the tool transcript: PDF text wrapped a summary label across lines; a binder label's `innerText` reflected CSS uppercase; an output-only resume needed its row variable declared outside the skipped save block. Assertions were corrected and only unfinished output verification was resumed. Completed save scenarios were not replayed. None required an application change.

## Evidence and checks

Private evidence is retained in `/private/tmp/continuum-x394-proof-fbF86U/`: before screenshots, `failed-null-draft.png`, final `after-insurance-{cards,table}-detail.png` and `after-subscriptions-{cards,table}-detail.png`, binder/recipient captures, four state HTML/PDF pairs, recipient packet, ZIP and `result.json`. The final detail screenshots and insurance/recurring-services PDF pages were visually inspected. Counts, unknown values and explicit zeros are readable without overlap. Early captures taken during animation or above the records are superseded by the detail captures.

The one-line model fix, six frontend files and this report are the entire card scope. Read context included all changed files; `formSaveAttempt`, SyncManager's mapper/write/merge/read paths, `oneSpelling`, money/cadence/aggregation helpers, generic API create/update/list and model fields, snapshot serialization, binder, recipient snapshot and `RecipientStartPage`. No shared money helper, auth/private-access rule or unrelated content was changed.

Final merged-main type check: **0 errors, 0 warnings**. Production build: **passed**, static site written to `dist`. Complete logs: `/private/tmp/continuum-x394-final-check.log` and `/private/tmp/continuum-x394-build.log`; the build retains Node deprecation, media import and chunk-size warnings. Both owned servers (37194/36194) were stopped. The merged subscriptions source retains both the nullable cost changes and X385's pending-PDF job/session guards. Finished save cases were not repeated after this unrelated companion merge.

New/reused copy for T0: existing “Not recorded”; “Recorded annual premiums,” “Recorded monthly equivalent,” “Recorded annual cost,” and “N of M amounts recorded.” These describe recorded sums rather than a complete bill or policy average. No new out-of-scope repair remains from this trace. The production boundary was checked by root metadata only; functional proof here is SQLite/local, not a production feature test.
