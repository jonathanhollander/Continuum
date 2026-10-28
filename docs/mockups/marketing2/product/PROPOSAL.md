**Last Updated:** 2026-10-27 21:41 EST

# D5 mockup: product-led (`product`)

Branch `worktree-agent-a2e00069f2a020704`, commit `ccd6019`. Mockup only: not merged, pushed or deployed.

## The idea in 3 lines
Show the real app beside the words that describe it, so every promise on marketing2 sits next to the screen that keeps it.
The screenshots are fresh captures of today's UI, filled with one invented, warm family (Margaret Whitfield, her daughter Clara, son Daniel, neighbor Rosa, attorney Martin Okafor).
Each one sits in a simple dark window frame (traffic-light dots, address pill, soft gold-tinted shadow, a slight 3D tilt on desktop that flattens on hover), so the shots match marketing2's dark, quiet look.

## Which image goes where, and why
| Page / section (copy unchanged) | Image | Why |
|---|---|---|
| `/marketing2` Kitchen: "Help them find a starting point." | `recipient-start.webp` (the `/for/…` page: "From Margaret Whitfield", a note, "The first steps") | The page a family member opens *is* the starting point |
| `/marketing2` Weight: "Leave practical guidance alongside your memories." | `letter-editor.webp` (letter "My dear Clara…" in the editor) | "in your own words", shown literally |
| `/marketing2` Guide: "Your guide shows you where to begin." | `dashboard.webp` | The overview with counts and the My Legacy cards |
| `/marketing2` Pulse | `pulse.webp` (Wellness Check-in, "I'm Here", next gentle nudge), full width under the text | The one-button check-in is the clearest Pulse picture |
| `/marketing2` Gift: "What they'll receive" | `recipient-letters.webp` ("Letters for you" + "The full record" with the download button) | What they receive, as they receive it |
| `/how` 01 "You start, wherever feels right." | `letters.webp` (Your letters + template filters) | Choosing a record or letter, with starting points |
| `/how` 02 "You build, over time." | `accounts.webp` (two accounts, "Statements in the blue folder") | Saved records plus where originals are kept |
| `/how` 03 "Review and share a useful copy." | `recipient-start.webp` | The recipient preview the step names |
| `/features` The Practical | `accounts.webp` | Accounts |
| `/features` The Personal | `heirlooms.webp` (four heirlooms, each with its story and recipient) | Heirlooms with stories |
| `/features` The Protective | `pulse.webp` | Pulse check-ins |
| `/features` The Prepared | `recipient-letters-wide.webp` | Recipient preview and download |

On `/how` the big decorative icon orbs were replaced by the shots; each step keeps a small icon above its number. Security, Distinction and the hero stay text-only, so the page still breathes.

## New images: how they were made, and sizes
- Local server on a throwaway SQLite, signed in as the dev user. Data seeded through the app's own API (`/api/contacts`, `/api/data/letters|heirlooms|financial_accounts`, `/api/pulse/settings` + one check-in, `/api/estate/profile`, `/api/recipient/links`). All names invented; emails `@example.com`, phones `555-01xx`.
- Captured with Playwright + Chrome at 1440×900, device scale 1.5, reduced motion. App pages cropped to drop the sidebar (keeps the text legible at half width). The Pulse shot keeps the sidebar. Recipient pages are cropped to their centre column. Encoded with `cwebp` (q80–82) at 1280×800 (recipient pages: 1088×1080).
- Files in `frontend/static/images/product/`: accounts 32 KB, dashboard 24 KB, heirlooms 40 KB, letter-editor 28 KB, letters 35 KB, pulse 26 KB, recipient-letters 45 KB, recipient-letters-wide 34 KB, recipient-start 39 KB. **Total 308 KB**, against 3.5 MB for the four old PNGs.
- Capture/seed scripts (not committed): `scratchpad/punch/mkt/product/work/seed.py`, `shoot2.js`.

## The old `Marketing/product_shots/*.png`: outdated?
Yes, in the details, and they are too heavy for the web. They date from 2026-10-26 (X271/X272) and use the same app shell, but:
- The header reads "Planning (Owner)"; it now reads "Owner view".
- `shot_vault.png` (Financial Accounts) shows the empty state: "Net estate value $0.00", the old subtitle "Manage bank accounts, investments, and liabilities" (now "Bank accounts, investments and debts, gathered in one place."), the button "Share an asset" (now "Add account or debt"), and example cards named after real brands (Chase, Amex, Ledger).
- `shot_letters.png` shows "Ready when you are" and the "We're sitting with you / Visit the Sanctuary" band. Today the page shows a letter count and a "Grief support" row.
- They show empty or example data rather than a believable family's records, and they weigh 0.8–1.0 MB each (2918×2154 PNG).
I left them untouched.

## What it would take to ship
- Files: `frontend/src/lib/components/marketing2/ProductShot.svelte` (new, about 70 lines), the three marketing2 `+page.svelte` files, and `frontend/static/images/product/*.webp`. svelte-check reports 0 errors and 0 warnings, and the build passes.
- Alt text is English-only and hard-coded. Shipping would move the 12 alt strings into `marketing2Dictionary.ts` for all languages. The screenshots themselves show the English UI.
- Should `/` redirect to `/marketing2`? That is the owner's call, and it is separate from this mockup. If marketing2 becomes the home page, this layout works as it is. The redirect would be one line in `+page.ts` or a swap of the route files. The current `/` and its shoebox imagery would then retire.
- Upkeep: re-shoot when the UI changes. The scripts make that about a five-minute job.

## Weakest part of this direction
The screenshots will go stale. Every UI tweak, such as a renamed button or a new header pill, makes the marketing look older than the product. The old PNGs went stale within a day, and that is the proof. At half width the app text is also too small to read (about 6–8 px effective), so the shots work as mood and shape rather than as something to read. The dashboard is dark navy while the other app pages are light. Placed side by side, that mix looks less unified than an illustration set would. The "YOUR PLAN · Me" chip in the Pulse shot's sidebar is the app's real label, but it reads a little oddly in marketing.

## Deliverables
- `scratchpad/punch/mkt/product/marketing2.png`, `how.png`, `features.png` (1440 wide, full page), `marketing2-390.png`
- Full-page captures show the fixed header part-way down and a faded hero. That is the scroll-linked hero opacity in a stitched screenshot. The live page shows neither.
