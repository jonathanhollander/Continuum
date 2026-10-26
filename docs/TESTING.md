# Testing Guide

Reliability is paramount for Continuum. This guide explains how to run and write tests for the application.

## Backend Testing (Pytest)

The backend uses `pytest` for unit and integration testing.

### Running Tests

1. **Active virtual environment**:
   ```bash
   source venv/bin/activate
   ```

2. **Run all tests**:
   ```bash
   pytest
   ```

3. **Run with coverage**:
   ```bash
   pytest --cov=backend
   ```

### Writing Tests

- Place tests in the `backend/tests/` directory.
- Use meaningful names prefixed with `test_`.
- Mock external services (Email, Passkeys) using `unittest.mock`.

## Frontend Testing (Vitest)

The frontend uses `Vitest` for component and store logic testing.

### Running Tests

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Run all tests**:
   ```bash
   npm run test
   ```

3. **Run in watch mode**:
   ```bash
   npm run test:watch
   ```

## E2E Testing (Playwright)

End-to-end tests verify critical user flows in a real browser.

### Running E2E Tests

1. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

2. **Run E2E suite**:
   ```bash
   npm run test:e2e
   ```

## Testing Mindset

- **Test the edge cases**: What happens if a user misses a check-in? What if their session expires?
- **Prioritize critical flows**: Auth, Pulse check-ins, and data persistence must always be verified.
- **Maintain coverage**: Aim for at least 80% coverage on core business logic.
