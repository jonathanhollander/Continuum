# Backend schema and persistence cross-check

**Last Updated:** 2026-10-26 15:25 EDT

**Source reviewed:** `8751f224b2a1bf0d915940f61242829d08964d18` (`main`). Review and evidence only; application code unchanged.

## Scope and coverage

| Area | Source actually inspected | Result |
|---|---|---|
| Registered schema, defaults and IDs | `backend/database.py`; domain classes in `backend/estate_models.py`; all seven `backend/models/*.py` files; `backend/alembic/env.py` | Every one of the 46 registered model tables exists after a fresh SQLite upgrade; no missing model columns. Estate singleton cardinality remains defective (F1). |
| Schema history and runtime interaction | `create_db_and_tables` / `migrate_db`; initial migration table definitions examined in part; complete B0 drift repair, B0.1 nullability repair, B0.2 legacy financial mapping, X13 date conversion and X103 directive/index migrations | Entire upgrade chain executed once on a disposable database through `a8c3e1f5d7b9`. PostgreSQL-only branches were read where noted, not executed. Runtime migrator was inspected, not run against an existing database. |
| Generic API contracts | `backend/routers/estate_data.py`: model map, category predicate, primary-key conversion, generic GET/create/update/delete, singleton handling and custom-field definitions | Current Asset categories are filtered consistently for named collection reads and membership checks. Funeral/advanced/digital singletons have unique user IDs. No missing columns found. |
| Profile singleton and merge | `backend/main.py`: estate/profile payloads, estate read/write and profile GET/POST; `Estate` model | Two deterministic database interleavings reproduce duplicate roots (F1) and lost disjoint saves (F2). |
| Dedicated medical validation | `backend/routers/medical.py`; `backend/utils/table_body.py`; model fields | Required directive fields and table-model coercion helpers are present. Medical profile is keyed by user ID. |
| Foundational authentication/config/error paths | Database/domain/env settings portions of `backend/config.py`; `backend/auth.py` password/access/refresh helpers; signup/login/passkey-start/refresh/logout portions of `backend/routers/auth.py`; `backend/security.py`; exception classes/handlers in `backend/errors.py` and `main.py` | Functional source review only; security hardening excluded. Stale passkey retry challenge issue was handed to the shell reviewer to avoid duplication. No actual authentication/provider calls made. |
| Handover boundary | Estate lookups shared with profile/snapshot users; model/API fields | Detailed recipient/export membership and output rendering belong to the handover reviewer. Domain form fields belong to the relevant journey reviewer. |

Plan references examined: A1/A3, B0/B0.1/B0.2, B1–B3, C1–C9, X3/X52/X103/X107/X125/X302 and recorded completion evidence. The task board's sequential profile-save proofs do not cover the interleavings below.

## Confirmed findings

### F1 — P1: concurrent first profile visits can create two estate roots

**Classification:** source-confirmed defect with a disposable SQLite database interleaving proof. **Plan:** B3 (singleton semantics), X52 (shared profile contract), X103 (estate lookup/index); B3/X52 are marked complete.

**Evidence:** `backend/database.py:48–59` defines `Estate.user_id` with an index, without a unique constraint. `backend/main.py:399–405` creates an empty Estate after a query returns none; `main.py:442–446` does the same for profile saves. Neither path atomically gets/creates the singleton. The X103 migration (`backend/alembic/versions/a7c3e9d2b5f1_medical_directive_custom_attributes.py:35–39`) adds a nonunique index only. Later profile reads/saves select `.first()` (`main.py:423`, `442`), leaving any additional row outside the normal profile path.

**Trigger and impact:** two contexts first load/save the same fresh account before either creation commits. Both see an empty query, both insert, and both commits succeed. If their writes carry different personal details, subsequent reads select one row and hide the other row's information. This breaks the promised one-record profile and can make saved details appear lost.

**Pinpoint proof:** fresh Alembic SQLite, one synthetic user; two sessions both execute the same empty Estate lookup before either inserts. Commit an `owner_name` profile from session A and an `owner_phone` profile from session B. Output:

```text
SCHEMA_TABLES 46
MISSING_COLUMNS []
FIRST_READ_A None
FIRST_READ_B None
ESTATE_ROWS_FOR_ONE_USER 2
FIRST_ROW_PROFILE {"estate_profile": {"owner_name": "Owner Example"}}
ESTATE_UNIQUE_CONSTRAINTS []
```

This exercised the real migrated schema with the route's query/create interleaving; it was not a threaded HTTP/browser test.

**Smallest correction:** preserve/reconcile any existing duplicate root data, enforce unique `Estate.user_id` in model and migration, and use a transaction-safe get/create path with conflict handling. Do not discard duplicate profiles during reconciliation.

**Acceptance:** two simultaneous first accesses/saves yield exactly one Estate for the user; every submitted detail remains visible after reload and in the snapshot. Run the check with another account to confirm separation.

### F2 — P1: concurrent disjoint profile updates overwrite each other's saved keys

**Classification:** source-confirmed defect with a disposable SQLite database interleaving proof. **Plan:** B3 (profile settings merge), X52 (send changed slices safely). This is distinct from duplicate creation: it occurs with exactly one existing Estate.

**Evidence:** `backend/main.py:442–467` reads the Estate's JSON, copies the current profile, merges request keys in Python and replaces the entire `transparent_data` text. There is no row lock, compare-and-swap version or atomic database merge. X52's frontend SharedRecord queue serializes one JavaScript context; it cannot serialize a second tab/browser/device doing the same backend operation.

**Trigger and impact:** two contexts read the same current profile and save different fields before either can observe the other's committed update. Each reports success. Whichever complete JSON document commits last removes the other field despite the POST contract promising a key merge. Owner name, phone, wishes or other slices can disappear on reload.

**Pinpoint proof:** synthetic user and one Estate row; two sessions read the same JSON, apply the `save_estate_profile` copy/merge/serialize algorithm to `owner_name` and `owner_phone`, then commit in that order:

```text
FINAL_PROFILE {"owner_phone": "+1-202-555-0100"}
FIRST_DISJOINT_SAVE_SURVIVED False
SECOND_DISJOINT_SAVE_SURVIVED True
RESULT concurrent disjoint profile save loses first key; synthetic SQLite; no scheduler or email
```

This reproduced the database interleaving using the exact route algorithm, without invoking application startup or production data.

**Smallest correction:** serialize the read/merge/write at the database record or implement optimistic conflict detection and merge/retry. Preserve null-as-key-removal semantics and the existing top-level legacy-profile adoption. This can share a correction card with F1, but both acceptances must be checked.

**Acceptance:** concurrent disjoint updates from two contexts both survive independent reload and snapshot export; same-key conflicts have a defined outcome; explicit null deletion and unrelated stored keys still behave as documented.

### F3 — P1: legacy credit-card and loan rows migrate into the asset side of estate totals

**Classification:** actual migration reproduced on an in-memory legacy table; current reader impact confirmed from source and cross-checked with the financial reviewer. **Plan:** B0.2 legacy-field recovery, C10/debt scenario, D4 total semantics; the G0 intake already mentions legacy `credit` / `loan` mapping. This concerns old debt records, not the owner-deferred question of including separate property valuations.

**Evidence:** `backend/alembic/versions/d5f1b9c3a7e2_fill_financial_accounts_new_cols_from_legacy.py:36–39` includes `credit` and `credit card` in `_FINANCIAL`; `:54–60` converts them to `Financial` and copies unrecognized `loan` unchanged. `frontend/src/lib/stores/financialAssetsStore.svelte.ts:65–74` preserves that type. Its `isDebt` (`:8–10`) recognizes only `Debt` / `Liability`; `estateTotals` (`:22–30`) consequently adds positive legacy card/loan balances to assets. The shared total is read by the owner UI and export service, so agreement between displays alone cannot expose this wrong classification.

**Trigger and impact:** upgrade old financial rows whose newer `type` field is empty and whose `account_type` is `credit card`, `credit` or `loan`, with positive amounts owed. Amounts are preserved but receive asset semantics, overstating net estate value and misidentifying the liabilities in the handover. No claim is made that such rows currently exist in production.

**Pinpoint proof:** executed the actual migration's `upgrade()` through Alembic Operations against an in-memory table with representative old columns. Current reader classification was then applied according to the inspected `isDebt`/`estateTotals` source:

```text
MIGRATED credit card => Financial value= 500.0 isDebt= False
MIGRATED loan => loan value= 700.0 isDebt= False
MIGRATED savings => Financial value= 1000.0 isDebt= False
CURRENT_READER_NET 2200.0
EXPECTED_NET_FOR_TWO_DEBTS_AND_SAVINGS -200
RESULT actual B0.2 migration reproduced legacy-debt misclassification; in-memory data only; no application import
```

The TypeScript total function itself was source-traced, not executed by this Python proof.

**Smallest correction:** normalize known legacy liability types to current Debt semantics and provide a corrective path for already-upgraded rows identifiable from their retained legacy fields. Preserve any deliberate newer user classification; unknown types need an explicit review path rather than an invented debt/asset assumption. Changing only the old migration leaves already-upgraded records wrong.

**Acceptance:** pre-upgrade and already-upgraded legacy credit/card/loan examples retain their amounts/ownership, appear as liabilities and subtract from owner totals, analytics, binder, structured/printed/PDF exports and recipient full record. Verify item membership and drilldowns as well as equal totals, with ordinary bank/investment and explicitly reclassified records remaining correct.

## Observations without a new defect claim

- Fresh Alembic upgrade reached head successfully. Inspection found `financial_accounts.is_closed` nullable in the upgraded SQLite schema while the current model declares it nonnullable; no present user-visible failure was established, so this is not promoted to a fix card.
- Generic `medical_profiles` is listed in `MODEL_MAP`, although normal medical UI writes use the dedicated profile route; the generic create path assumes an `.id` that MedicalProfile lacks. No live UI caller of that generic write was established, so it is a latent API-contract observation rather than a confirmed user-journey omission in this report.
- The financial reviewer independently confirmed F3's mapper and total impact; this report owns that finding to avoid duplicate cards.
- Signup's reused registration challenge after expiry/consumption was sent to the shell reviewer, which confirmed it owns that finding. See the shell report.
- Missing automated tests, unused historical model classes and documented product deferrals were not treated as defects by themselves.

## Verification boundary

The profile/schema manual proofs were inline Python using the existing isolated venv, temporary working directories, reserved example addresses and disposable SQLite files. Imports resolved `.env` relative to the temporary directory; no owner configuration/database was inspected. The additional F3 proof used only SQLAlchemy/Alembic and an in-memory synthetic table, without application import. No application lifespan, scheduler, external message, production operation, dependency installation, test/script file, source edit or deployment was used. PostgreSQL execution, full HTTP/browser concurrency and upgrade of a copy of existing production data remain unverified.

## Canonical follow-up references

Progress and implementation status live only in [RECOVERY_EXECUTION_PLAN.md](../../RECOVERY_EXECUTION_PLAN.md). These are evidence cross-references, not another task board.

| Canonical card | Evidence reference |
|---|---|
| X312 | SCHEMA F1,F2 |
| X313 | SCHEMA F3 |
