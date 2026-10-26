# R0 — current composed completion rehearsal

**Last Updated:** 2026-10-26 18:20 EDT  
**Result:** PASS — 23/23 historical completion steps, four added record/sharing groups, and the existing T-A3 script's 17/17 checks. Initial harness failures were preserved and only affected checks resumed. No application source changed.

## Source and isolation

| Source | Exact cut |
|---|---|
| Commit | `e8e357640c0759ae8169ea5477ebbed5da5a84c0` |
| Full tree | `ed68406b02fb506766fdf61028ed7dc38cb6ac07` |
| Backend tree | `be0527253b62b3e320d2c7257df1c6fadae81d84` |
| Frontend tree | `9b41bf790498a0157b5a9dde9e296206c3171ee1` |

`.worktrees/R0-current` fast-forwarded cleanly to that exact commit. Its frontend check ran once: **0 errors, 0 warnings**. Its static production build ran once and passed (Node `v26.10.0`). Root independently checked the same feature source.

The approved private T-R0-CORRECTIONS harness, `/private/tmp/continuum-r0-current.mjs`, executed one composed run at **18:08:54–18:09:54 EDT**, then affected rechecks at **18:13:10–18:13:36**. Initial/corrected harness SHA-256 values are respectively `e8209ba702dde40f70198011d558bfe991822c919ad7e494e00fae9df9ef782a` and `2774e1efe8e60fd37fdaf49e9dfdbcb1fdb16e01963b59381a295fbbc12517b1`.

The actual built application ran on `localhost:35748`, using real domain routers and real password-token authentication. A fresh SQLite DB migrated through Alembic head **b2e4a6c8d0f1**, separate uploads/outbox, and two synthetic users were used. A disposable working directory and explicit child environment prevented reading the owner's `.env`; no owner DB/config was used. Uvicorn lifespan was **off**, preventing startup seeding and Pulse scheduler execution. Provider credentials were blank, SMTP/S3 disabled, and the outbox remained empty. No correspondence or provider calls occurred. Chrome captures used **1440 × 900**.

## Historical completion steps

IDs below are actual persisted source IDs. All actions used the working UI with synthetic names and reserved example addresses.

| Step | Outcome |
|---|---|
| 1 | PASS: Ada Advisor, contact **1**, role/relation, phone, email, caller notes, first-call tier |
| 2 | PASS: Sam Synthetic, contact **2**, son and explicit executor |
| 3 | PASS: account **1**, institution, number, URL, value, 50% ownership, beneficiary/email, notes, transfer instructions |
| 4 | PASS: debt **2**, actual Debt option, amount owed, institution, number, payoff notes |
| 5 | PASS: insurance **1**, insurer/number, monthly premium, beneficiary, agent/contact, claim procedure, notes |
| 6 | PASS: document **1**, actual uploaded PDF/media **1**, original location, witnesses, signed date |
| 7 | PASS: water-shutoff **1**, provider and red-valve instructions |
| 8 | PASS: long letter **1** for chosen contact **2**, without an AI call |
| 9 | PASS: journal lesson **1**, complete prose and tags |
| 10 | PASS: photo record **1**, media **2** |
| 11 | PASS: video record **2**, media **3** |
| 12 | PASS: heirloom **1**, chosen Sam and complete grandfather's-watch story |
| 13 | PASS: one intercepted account PUT500; original server value unchanged; draft A retained. Edit B; notification Retry saves immutable A while preserving visible B; explicit Save persists B (**$13,000.50** and edited notes) |
| 14 | PASS: reopen/edit the same letter by PUT; one row, same ID, postscript retained |
| 15 | PASS after harness correction: reload accounts, insurance, vault, contacts, letters, journal, media, heirlooms, household, registry tabs, executor toolkit; reopen account editor; independently fetch all fields and original file bytes |
| 16 | PASS: enable Sam's recipient page, save opening note, create link, open actual owner preview |
| 17 | PASS: fresh recipient browser context has **no owner token**; opening note visible |
| 18 | PASS: first steps, Ada, and executor role found |
| 19 | PASS after case correction: advisor name/phone and **FIRST CALL** badge found |
| 20 | PASS: original's location found; recipient downloads stored will with original exact hash |
| 21 | PASS: full **4,786-character** letter, all24 paragraphs, Unicode punctuation, café, postscript; exact text equality |
| 22 | PASS: photo decodes; actual video playback reaches **0.506807s**, duration3s, readyState4 |
| 23 | PASS after policy correction: source, reader, binder, four PDFs, both ZIPs, structured JSON, record membership, manifests and original file bytes agree |

Added UI records also survive reload and appear in the copies:

| Supplement | Actual identity / evidence |
|---|---|
| Asset history | `8bc038b4-1739-4940-b8e5-4883964831cc`; actual `financial:1`, purchase, date, description, **$5,000.00** |
| Maintenance | `808ccf2a-e104-4f5b-9468-53094490fd00`; boiler service, provider, dates, **$185.25** |
| Claim | `31e59be4-199f-453f-ab09-86a3b942da6d`; actual policy1, number, **$1,250.50**, full note |
| Executor note/sharing | checklist row **1**, task `task-01`; full note; explicitly save/reload **All recipients**, include current row in both copies |

Other note-sharing policy edges retain the separately reviewed X320 proof; they were not repeated here.

## Copies, fields and membership

Screen, binder, app PDF, browser print PDF, and both ZIP PDFs preserve the full letter, heirloom/lesson prose, account transfer instructions and representative fields. The full account value **$13,000.50**, owned share **$6,500.25**, debt **$8,200.00**, and net **−$1,699.75** agree.

Binder and recipient full-record DOM membership exactly matches their ZIP manifests and extracted HTML article IDs: **16 members**, listed below. Each structured ZIP snapshot equals its independently fetched source sections. The recipient comparison applies the router's deliberate removal of contact `recipient_note`; Sam's own note is verified separately atop his page. All other fields and IDs agree.

```text
financial_accounts:1, financial_accounts:2; assets:1; insurance_policies:1
asset_transactions:8bc038b4-1739-4940-b8e5-4883964831cc
maintenance_logs:808ccf2a-e104-4f5b-9468-53094490fd00
insurance_claims:31e59be4-199f-453f-ab09-86a3b942da6d
documents:1; contacts:1, contacts:2; executor_steps:1; letters:1
journal_entries:1; visual_memories:1, visual_memories:2; utilities:1
```

Both ZIPs contain `packet.html`, `packet.pdf`, `snapshot.json`, `manifest.json`, and **3/3 files**, complete, with no file issues or retry entries. Both extracted HTML packets open from the filesystem using their real relative file paths. File sizes, hashes and every source-record/field reference agree between originals, stored reads, and copies:

| Media / source | File | SHA-256 |
|---|---|---|
| 1 / document1 (`media_id`, `file_path`) | `R0-will.pdf` | `33ed547ff6ab752d976aafa5ca64751e22428acab196370bffc52732ba3a0a02` |
| 2 / visual memory1 (`url`) | `R0-photo.png` | `cb98d2b4aaca2b71a654637d57c6c3dd50a8beb0a9ff23208f2c5ec03520433b` |
| 3 / visual memory2 (`url`) | `R0-video.mp4` | `02024387767a0b2a361d8a39714796365fe2f199a247bea8854d779da66c18e4` |

Exact UTF-8 letter hash: `b98c39381d394bd605a76e06b51da0759e2b45b52b6fe5abf3f70624c2eb6696`.

## Existing T-A3 and preserved harness failures

The unchanged existing `scripts/smoke_test.py` ran **once** with `--base` and `--verbose`: **17 PASS, 0 FAIL**. Its CLI hardcodes the local dev login, so the matching account was seeded as a **separate synthetic user**, not R0's owner. Real authentication was used. Because the script always exits0, its printed summary was parsed. Full output and script hash are retained. Independent before/after source comparisons prove its records/upload did not alter R0 owner sections or attachments. No second smoke run or build occurred.

The initial `result.json` remains unchanged: 25 passing groups and four failing harness groups, including complete stacks/responses/console events and screenshots. Only these source-confirmed assumptions were corrected:

| Initial assertion | Correction / actual contract | Recheck |
|---|---|---|
| Notes must appear in account summary | `AssetManager.svelte` card shows selected details/transfer instructions; reopen `#asset-notes` for saved notes/value | PASS |
| Badge must equal case-sensitive “First call” | `RecipientStartPage.svelte` uses uppercase CSS; actual label is **FIRST CALL** | PASS |
| Recipient contact fields must include private opening notes | `backend/routers/recipient.py:107–110` strips `recipient_note`; `_view` separately exposes only this recipient's note | PASS |
| Token init may access storage in every frame | Harness now checks origin/catches opaque-frame storage access; application helper already catches storage failures | PASS |

The original guard also blocked Google Fonts stylesheets, producing retained blocked-resource console events. The targeted run fulfilled those known requests locally with empty CSS, retaining installed fallback fonts without external traffic/errors. No other external attempts occurred. The corrected checks recorded **zero page errors, console errors, API failures or unplanned external actions**. The original, expected PUT500 remains in the original log. No application defect was established by these four assertions.

## Visual findings, evidence and O2 handoff

Actual desktop captures were inspected for retained draftB, reloaded account editor, owner preview, full recipient letter, sharing choice and photo/video playback. Reviewed PDF pages were app **1/3/4/6/7/8/11/12/14**, binder-print **1/3/5/7/8/9/12/13/15**, owner ZIP **1/3/8/12/14**, recipient ZIP **1/3/8/12/14**. Names, financial totals/prose, history/maintenance/claim, executor note, and multi-page letter are legible, with no overlap/clipping in the reviewed pages. Entire-text comparisons independently cover all pages. All selected renders remain available.

Private evidence root: `/private/tmp/continuum-r0-current-2026-10-26T22-08-54-081Z/`. It contains original `result.json`, `targeted-result.json`, source hashes, check/build/migration/backend logs, complete `T-A3-smoke.log`, `agreement.json`, source snapshots/manifests, both ZIPs, four PDFs/text, desktop captures and PDF page renders.

**Immutable reference handed to O2:** `completed-fixture/completed-manifest.json` under that evidence root.

- Manifest SHA-256: `5592600a0a6f4db7b93e033b58c920788738620b29c95eeff18d99356a696a74`.
- Completed DB SHA-256: `cf2a634ac93c55c4941bfc64818e22038ea16dbfd8ab552b53c5bee4d25debff`.
- Manifest hashes **15 reference files**: DB, uploads, snapshots/manifests, specification, exact source cuts, synthetic environment/runtime/IDs and owner storage state. Files are read-only and reference directories non-writable.
- O2 received instructions to **copy** this reference into its disposable runtime, retain the synthetic JWT secret for storage-state auth, redirect DB/uploads/outbox paths, and keep lifespan off. No credentials/tokens are included in this report.
- There are no guardian/check-in token fixtures or separate signed-in executor/family accounts; Sam is a chosen recipient contact explicitly marked executor.

This is local desktop acceptance; it does not claim production user-data checks, mobile acceptance, live delivery, or completion of separate O1/O2 gates. Google Fonts were isolated, so captures prove fallback-font rendering. Both R0 browser/runtime sessions stopped. Worktree/frozen data remain for the active O2/root handoff; root owns eventual cleanup and this report's commit. No application source or task board was edited.
