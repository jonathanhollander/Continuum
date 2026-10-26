# Development Setup Guide

Welcome to the Continuum SaaS development environment. Follow these steps to get the application running locally.

## Prerequisites

- **Python 3.10+**: Core backend logic.
- **Node.js 18+**: Frontend build system (Svelte 5).
- **SQLite**: Local database (PostgreSQL used in production).

## Backend Setup

1. **Navigate to the root directory**:
   ```bash
   cd Continuum_SaaS
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Mac/Linux
   # venv\Scripts\activate  # Windows
   ```

3. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env` (if provided) or ensure the following are set:
   ```bash
   DEBUG=True
   DATABASE_URL=sqlite:///./continuum_saas.db
   JWT_SECRET_KEY=dev-secret-key
   ```

5. **Initialize Database**:
   The database tables are auto-created on the first run of the app.

6. **Start Backend Server**:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

## Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173).

## Development Workflow

- **Backend API**: Accessible at [http://localhost:8000/api](http://localhost:8000/api).
- **Interactive Documentation**:
  - **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
  - **Redoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Troubleshooting

- **Bcrypt Issues**: If you encounter `AttributeError: module 'bcrypt' has no attribute '__about__'`, typically this is a mismatch between `passlib` and newer `bcrypt` versions. Ensure you are using the versions specified in `requirements.txt`.
- **Port Conflicts**: If port 8000 or 5173 is in use, you can specify different ports via command line arguments.
