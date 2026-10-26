# Contributing to Continuum

Thank you for your interest in contributing to Continuum! As a platform for estate planning and legacy management, we prioritize **reliability, security, and digital empathy**.

## Code of Conduct

Please be respectful and compassionate in all communications. The work we do directly impacts people during some of their most difficult life stages.

## Git Workflow

1. **Branching**: Use descriptive branch names.
   - `feature/feature-name`
   - `fix/bug-description`
   - `docs/documentation-update`
2. **Pull Requests**:
   - Provide a clear summary of changes.
   - Link to relevant GitHub issues.
   - Ensure all tests pass.
   - Request review from at least one peer.

## Coding Standards

### Backend (Python)
- Follow **PEP 8** style guidelines.
- Use explicit type hints everywhere.
- Document all public functions and classes.
- Use the centralized logger in `backend/utils/logger.py` instead of `print()`.

### Frontend (Svelte 5)
- Use **Svelte 5 Runes** (`$state`, `$derived`, `$effect`) for state management.
- Prefer Tailwind-like utility classes within Vanilla CSS when appropriate, but maintain the high-aesthetic design system.
- Ensure all components are accessible (ARIA labels, keyboard navigation).

## Security & Privacy

- **Never** log sensitive user data (PII).
- Ensure all endpoints requiring authentication use the `get_current_user` dependency.
- Be mindful of data encryption requirements—data in the "Encrypted Vault" must remain opaque to the server.

## Testing Requirement

No pull request will be merged without appropriate test coverage:
- **Major Logic**: Backend unit tests provided.
- **UI Components**: Verified in development or via frontend tests.
- **Regressions**: Ensure existing flows remain functional.
