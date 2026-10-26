---
type: architecture
title: Data Model and Migrations
description: Where Continuum's SQLModel tables are defined, how the database engine is created for SQLite and PostgreSQL, the runtime column patching in database.py, and the Alembic migration chain.
tags: [backend, database, sqlmodel, alembic, migrations]
verified:
  - by: openwiki/0.4.3
    at: 2026-10-26T04:52:34.633Z
sources:
  - id: openwiki-source-cd05e17dc0e73b55df1e0b66
    resource: repo://backend/alembic/env.py
  - id: openwiki-source-c112d421d441f61095f46dc3
    resource: repo://backend/alembic/versions/817c6b026811_add_view_preferences_to_users.py
  - id: openwiki-source-5af055e79e2d237dc33daf46
    resource: repo://backend/alembic/versions/a7c1b0e3d9f4_add_model_columns_missing_from_schema.py
  - id: openwiki-source-82a325da453da1db06378e6d
    resource: repo://backend/config.py
  - id: openwiki-source-408c8b90f290498ea40f5f42
    resource: repo://backend/database.py
  - id: openwiki-source-7c71a30249a930334214acfd
    resource: repo://backend/estate_models.py
  - id: openwiki-source-fcffbe3e28749eaf9a39557c
    resource: repo://backend/main.py
  - id: openwiki-source-988e9d9be22f74fe8d2eaaca
    resource: repo://backend/routers/auth.py
  - id: openwiki-source-4be256b5d86d6f7252b493a6
    resource: repo://backend/routers/estate_data.py
  - id: openwiki-source-cbabb1e94c55bf9759ad206c
    resource: repo://backend/routers/heirlooms.py
generated: { by: "claude-code", at: "2026-10-26T04:52:34.633Z" }
---

# Data Model and Migrations

Persistence uses SQLModel (SQLAlchemy underneath). Local development defaults to SQLite; Railway production uses PostgreSQL. Two schema mechanisms run side by side — `create_all` plus hand-written column patches at startup, and Alembic migrations — so a schema change has to account for both.

## Where models live

| File | Tables |
|---|---|
| `backend/database.py` | `users` (`User`), `refresh_tokens` (`RefreshToken`), `estates` (`Estate`) |
| `backend/estate_models.py` | Module data: `assets`, `heirlooms`, `financial_accounts`, `vendors`, `home_access`, `utilities`, `documents`, `letters`, `journal_entries`, `subscriptions`, `calendar_events`, `insurance_policies`, `medical_profiles`, `medical_directives`, `pets`, `family_memories`, `visual_memories`, `external_archives`, `contact_relationships`, life events, time-capsule messages, funeral data, advanced asset data, and `user_custom_field_definitions` |
| `backend/pulse_models.py` | Pulse: settings, vault, check-ins, escalation log and tiers, contacts, safety timers, messages, WebAuthn credentials |
| `backend/models/` | `media_files`, `email_logs`, `audit_logs`, `activity_log_entries`, `qr_access_packs`, `qr_asset_labels`, `acceptance_tasks`, `automation_rules` |

Almost every user-owned table has an indexed `user_id` foreign key to `users.id`; the API layer filters and checks ownership on it (see [Backend API and Routers](/openwiki/architecture/backend-api.md)).

Notable shapes:

- **`Estate`** holds a per-user `transparent_data` JSON string (readable by the server; the estate profile lives under its `estate_profile` key) and an `encrypted_vault` byte blob intended to be encrypted on the client.
- **`Asset`** is a generic table with a `type` column; the generic API maps `properties`, `digital_assets` and `heirlooms` onto it. A separate `Heirloom` model and `heirlooms` table back the dedicated `/api/heirlooms` router, so heirloom data can exist in two places.
- **`custom_attributes`** columns store user-defined fields as a JSON string; the generic API serialises dict values before saving.
- Some columns use camelCase names (for example `Asset.ownershipDetails`), matching frontend field names.
- **`User.view_preferences`** is a nullable JSON column (added by migration `817c6b026811`) holding per-module card/table view choices, read and merged by `/api/auth/me/preferences`.

## Engine and sessions

`backend/database.py` builds a single module-level `engine` from `settings.DATABASE_URL`. For PostgreSQL URLs it uses the configured pool size and overflow and forces `sslmode=require` (from `settings.get_database_connect_args()`); other URLs get a pool of 5. `pool_pre_ping` and a one-hour `pool_recycle` are always on. Request handlers get a session through the `get_session` generator dependency.

## Startup schema creation and runtime patching

On application startup `create_db_and_tables()` runs `SQLModel.metadata.create_all(engine)` and then `migrate_db()`, retrying the connection up to five times, three seconds apart, so a sleeping database does not crash boot.

`migrate_db()` inspects live tables and issues `ALTER TABLE ... ADD COLUMN` for a hard-coded list of columns that may be missing: user onboarding and preference columns, extra `assets`, `subscriptions`, `documents` and `utilities` columns, newer `pulse_settings` and `pulse_contacts` columns. On PostgreSQL it also makes `users.public_key` nullable. Each failure is logged and rolled back rather than raised. `create_all` only creates missing tables; it never alters existing ones, which is why these patches exist.

The patch defaults do not always match the models: `migrate_db()` adds `users.user_role` with default `'owner'`, while the `User` model defaults it to `"planning"`.

## Alembic

Alembic lives in `backend/alembic/` (run from `backend/`, for example `cd backend && alembic upgrade head`). `env.py` puts the project root on `sys.path`, imports every model module explicitly, sets `target_metadata = SQLModel.metadata`, and overrides the URL with `settings.DATABASE_URL`. A model that is not imported in `env.py` is invisible to `--autogenerate`.

The revision chain is linear. The original schema and feature columns:

`539c7f1c89af` initial schema → `3648ce386dc0` heirlooms → `1e6d20bb64d7` storage provider/category → `ec250ef45965` passkey AAGUID → `14d9f7ed9ba1` asset columns → `57c5130143b3` calendar columns → `2d53606557e8` custom fields → `bef362c8a2e2` contact custom attributes → `be215ed3bf6a` letter fields → `f6fd52b98296` subscription fields → `f343b5ae2de8` financial account fields → `08fcd9308bab` nullable institution → `817c6b026811` users.view_preferences.

Then a series of idempotent drift repairs, written because production's schema had diverged from the models:

- `a7c1b0e3d9f4` compares `SQLModel.metadata` with the live database and adds any missing table or column, never dropping or altering existing ones. New columns are nullable, or get a server default taken from the model's scalar default when the model column is NOT NULL.
- `c4e8a2f6b1d7` makes columns nullable where the model says nullable but the live database is NOT NULL (for example `financial_accounts.institution`). It never tightens, drops or retypes.
- `d5f1b9c3a7e2` carries legacy financial-account values forward into the newer columns.
- Later revisions continue the same pattern for single columns (for example `assets.category` and the type of `calendar_events.date` on PostgreSQL).

Each repair checks the live schema first, so running it again changes nothing. Run `alembic heads` before upgrading to confirm there is a single head.

## Related pages

- [Backend API and Routers](/openwiki/architecture/backend-api.md)
- [Development, Configuration and Deployment](/openwiki/operations/development-and-deployment.md)
