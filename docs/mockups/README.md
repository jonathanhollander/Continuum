# Mockups

**Last Updated:** 2026-10-27 22:30 EST

## `/marketing2` with images (D5, awaiting owner decision)

Owner request: keep `/marketing2`'s wording and add images. Three directions were mocked up; none is merged or deployed. Each folder holds 1440-wide full-page shots (`marketing2.png`, `how.png`, `features.png`), a 390-wide phone shot (`marketing2-390.png`) and the agent's `PROPOSAL.md`.

| Direction | Folder | Branch / commit | Weakest part |
|---|---|---|---|
| Photo-led | [marketing2/photo](marketing2/photo/) | `worktree-agent-aae3615b9f422eaed` `3ae84a0` | Only three photos, each used twice; Pulse, lawyer and Security sections stay text only |
| Product-led | [marketing2/product](marketing2/product/) | `worktree-agent-a2e00069f2a020704` `ccd6019` | Hero has no photo; screenshots read as shapes at this size and go stale when the app changes |
| Hybrid | [marketing2/hybrid](marketing2/hybrid/) | `worktree-agent-a8d41406787ec418f` `b241d53` | Light-theme app screenshots are bright boxes on the dark page |

Side-by-side comparisons (Photo-led, Product-led, Hybrid, left to right): [home](marketing2/compare/marketing2-side-by-side.png), [How it works](marketing2/compare/how-side-by-side.png), [Features](marketing2/compare/features-side-by-side.png).

**Recommendation:** Hybrid, with its screenshots retaken in the app's dark theme so they blend with the page. It is the only direction where every section has a visual. Shipping it also means: drop the unused first-name field, move captions and alt text into `marketing2Dictionary.ts`, and make `/` redirect permanently (301) to `/marketing2`.
