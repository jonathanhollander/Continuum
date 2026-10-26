# Files

- [Backend API and Routers](backend-api.md) - How the FastAPI app in backend/main.py is assembled — middleware, router registration order, the generic /api/data collection API driven by MODEL_MAP, dedicated domain routers, and the dual-message error layer.
- [Data Model and Migrations](data-model-and-migrations.md) - Where Continuum's SQLModel tables are defined, how the database engine is created for SQLite and PostgreSQL, the runtime column patching in database.py, and the Alembic migration chain.
- [System Architecture Overview](overview.md) - How Continuum's static SvelteKit single-page app, the FastAPI backend that also serves it, and the SQLite/PostgreSQL database fit together, and how a request flows from a module page to the database and back.
