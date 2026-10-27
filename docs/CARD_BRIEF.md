# Card Brief (agents follow this exactly)

**Last Updated:** 2026-10-26 13:05 EST


1. Your card's row is in /Users/jonathanhollander/AI Code/Continuum/docs/RECOVERY_EXECUTION_PLAN.md (find `| <ID> |` in the Wave U or Wave X table). That row and the "Agent brief template" section (line ~190) are your instructions. Columns: ID | Card | Agent | Owns | Change | Acceptance (a few early U rows put the problem text in the Agent column).
2. Work ONLY in your worktree `.worktrees/<ID>` (branch card/<ID>). `git merge main` before you start and again right before your final commit. Commit on card/<ID>. Do not push, do not merge, do not edit the plan doc.
3. NEVER use `git stash` — the stash is shared by every worktree and has already swapped two agents' work. For "before" shots, take them before you edit, or `git worktree add --detach $SCRATCH/<ID>-before main` and build there.
4. Proof: throwaway SQLite (DATABASE_URL in the scratchpad, `alembic upgrade head`), backend on YOUR port only (never 8765), venv /private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/a1venv, playwright in .../scratchpad/pw/. Build with `VITE_API_URL= npm run build` and restart the server after every build. Kill your server by port when done.
5. Before/after screenshots at the same size, 1440×900, in .../scratchpad/<id-lowercase>/. Report what changed in pixels.
6. Owner copy rule, verbatim: "NEVER SAY NEGATIVE THIS LIKE NOT IN PAGE . Better to jsut leave out." Add no negative wording; reuse existing site wording; new lines are flagged for the tone card T0.
7. Send NO real email (local outbox only; @example.com addresses). Never commit .db, outbox, uploads or node_modules.
8. svelte-check: errors only matter on lines you touched.
9. Report: files changed, the one proof run's output, surrounding code read, small bugs fixed, bigger/out-of-file findings as new-card proposals, done or stopped (why).
