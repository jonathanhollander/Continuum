**Last Updated:** 2026-10-27 21:45 EST

# D5 mockup: hybrid direction

Branch `worktree-agent-a8d41406787ec418f`, commit `b241d53`. Mockup only, not for merge.

## The idea in 3 lines
1. One emotional photograph, the glowing shoebox under a bed, sets the feeling in the hero. It is split to the right and dissolves into the dark page through a mask, with the marketing2 words on the left.
2. After the hero the pages show the real product. The screenshots are fresh captures of today's app with gentle sample data (Daniel, Clara, the blue folder), each in a quiet dark window frame with a one-line caption.
3. Story sections with neither a photo nor a screenshot get a small teal/gold line drawing (I drew them in inline SVG), so every section has one calm visual and none has two.

## Which image goes where, and why
| Page / section | Image | Why |
|---|---|---|
| `/marketing2` hero | `hero-shoebox.jpg` (glowing shoebox) | The copy dictionary calls section 1 "The Shoebox". The warm light is the feeling. I chose it over the cinematic trunk photo because the cardboard box of letters is more personal. |
| Kitchen story | SVG: kitchen table, lamp, warm cup, folded note | "Help them find a starting point" is a domestic moment. A line drawing keeps it gentle. |
| The Weight | SVG: photograph, letter with heart seal, key | "Practical guidance alongside your memories" means memories and practical things side by side. |
| The Guide | `shot-letters.jpg` (Letters page + drafting prompts) | Shows the "prompts and guided forms" the copy promises. |
| Pulse | `shot-pulse.jpg` (Wellness check-in, "I'm Here") | The real Pulse page is already dark and calm, so it sits naturally on this page. |
| The Distinction | SVG: signed document, dotted path to an open folder | "They create the plan. We help your family find it." It replaces the generic Shield icon. |
| Security | (unchanged Lock icon) | A screenshot would add nothing here. |
| What they'll receive | `shot-recipient.jpg` (recipient page preview) | The most direct answer to "what they'll receive". The caption says it uses sample details. |
| `/how` beats 01–03 | letters, accounts, recipient preview | Start → build → review and share, each beat with its real screen. These replace the icon orbs. |
| `/features` four cards | accounts, heirlooms, pulse, packet preview (The Red Binder PDF) | One real screen per category, at the top of each card. |

Captions added (all positive and truthful): "Letters, with optional prompts to help you begin." / "Your Pulse check-in page." / "A recipient page preview, shown with sample details." All marketing2 dictionary wording is unchanged.

## New images and how they were made
- **Screenshots:** the old `Marketing/product_shots/*` are outdated. They show the "Planning (Owner)" label, the old "Visit the Sanctuary" banner and an "ID / SSN" card, so I did not use them. I recaptured from the local build: a throwaway SQLite database seeded through the API with 3 accounts, 1 letter, 2 heirlooms and 1 recipient contact. Captures were taken with Playwright at 2x and clipped to the useful area, then saved as JPEG (quality 72) with `sips`.
- **Hero:** `images/hero_shoebox.png` (really a JPEG) re-encoded at 1024 px, quality 70.
- **Line art:** three inline SVGs in `LineArt.svelte`, using the brand colors `--color-primary` and `--color-gold`. They add no file weight.

| File (`frontend/static/images/marketing2/`) | Size |
|---|---|
| hero-shoebox.jpg | 164 KB |
| shot-letters.jpg | 126 KB |
| shot-recipient.jpg | 126 KB |
| shot-heirlooms.jpg | 101 KB |
| shot-packet.jpg | 96 KB |
| shot-accounts.jpg | 85 KB |
| shot-pulse.jpg | 50 KB |

The home page loads about 466 KB of images. Everything below the hero lazy-loads.

## What it would take to ship
- Files touched: `routes/marketing2/+page.svelte`, `how/+page.svelte`, `features/+page.svelte`. New files: `lib/components/marketing2/ProductShot.svelte`, `lib/components/marketing2/LineArt.svelte` and the 7 JPEGs. The how page also lost its dead icon-orb CSS and action. Its `.revealed` and `.animate-spin-in` rules became `:global` so svelte-check stays at 0 errors and 0 warnings.
- Checks: `svelte-check` 0/0, `npm run build` passes, no horizontal overflow at 390 or 1440, no failed requests.
- Screenshots should be recaptured from a curated demo account whenever the app UI changes. The seed script is in this folder (`seed.py`, `seed2.py`, `shots.mjs`).
- Should `/` redirect to `/marketing2`? Yes, if the owner picks the marketing2 wording, because one home page is easier to maintain than two. Do it as a server-side 301 (or by making `/marketing2` the `/` page) so links and SEO follow. Keep `/` for signed-in users going to `/dashboard` the way it works today.

## Weakest part of this direction
The light-themed app screenshots are bright rectangles on a near-black page, most visibly the Letters shot on the home page and the recipient preview. Even dimmed to 93% and framed, they break the candle-lit mood the hero sets. Sample data also has a cost: the screenshots must be kept in step with the UI, or they quietly become untrue. A cleaner fix would be a dark-theme capture of the app, if a dark theme existed for those pages.
