# Continuum AI prompt suitability — X378

Last Updated: 2026-10-26 EDT. Reviewed primary source `b3a52541c59800230139c56c38733b4210d2ef16`; implementation base `66b308f2b7177432e4c8a4ee4b9e9082e67f524c`.

The finite defaults now support personal words and practical handover equally. They use the supplied recipient and author; no person's name is embedded. Every change uses the existing shared → purpose → variant settings and the existing 33 asset entries. Model selection, API shapes, privacy restoration, suggestion acceptance and sharing choices are unchanged. The owner's saved Shared Fireworks DeepSeek V4.1 Flash selection remains authoritative. Root's separate production metadata review found empty request-config overrides, so shipped prompt defaults can take effect without a database write. Explicit future Admin overrides still take precedence.

## Source findings and implementation

- `backend/ai_defaults.json` previously had identical 4,051-character concierge/module systems: repeated courage/sacred-work introductions, empathy/data-second and a contact-first intake checklist. All 19 module selectors inherited this text. Replaced with one concise shared factual/voice policy, purpose instructions and 19 task-specific module overrides. Main chat follows the current task; grief has its own supportive role branches.
- The former JSON examples claimed a daughter was already recorded and linked `/resources/grief`, rather than the existing `/resources/grief-support`. Removed fabricated examples; retained the JSON message, optional extraction/resource fields and existing intent vocabulary. Module output remains a reviewed/copied suggestion.
- Generic first-person, warm-paragraph instructions were inappropriate for caller notes, care instructions and institutional correspondence. The nine writer variants now identify the field's purpose; contact drafting uses practical caller instructions. Personal letters preserve the author's words without a mandatory farewell, spouse assumption or added sentiment.
- Two QR cover-letter bodies promised scoped family-only access or master keys/password access. They now explain signed-in owner shortcuts and the separate existing recipient link. Other institutional bodies remove invented appointments/enclosures/completed transfers/refund entitlement; requests with supplied identities remain requests. SSN examples use an identifying reference rather than a nested/full-SSN placeholder.
- All model-bound input/context/history instructions remain Admin-visible. Full available relevant user/model history is enabled, with no message-count truncation; existing overflow refusal and application bounds remain. Current job/brief/recipient/notes/facts and edited-versus-proposed draft slots remain explicit. Rewrites place the original in the task once.

## All 41 registered call combinations

`M` below means `concierge.module_prompt/<variant>` through `AIPromptBar.svelte` → `aiConciergeService.modulePrompt`. All M requests retain relevant module conversation/current job; pages without an engaged writing job supply their request and module context, not an automatic estate collection. Each M override supplies the named task and uses JSON `message` with the existing optional response fields. Token settings are maximum output budgets, not a promise of output length or empirical quality.

| Combination | Actual caller/workflow | Specific resulting defaults | Temperature / max tokens |
|---|---|---|---|
| `concierge.chat` | `ConciergePanel` → account-local `conciergeEngine` | Current requested task, full job-related conversation, reviewed extraction, explicit requested navigation; no intake diversion | 0.3 / 4000 |
| `grief.chat` | `/resources/grief-support` → `aiGriefService` | Plain supportive conversation; follows expressed concern, optional practical help; localized support choices without invented numbers | 0.4 / 1500 |
| `letter.draft` | Letters → `LetterAssistant` bullets | Recipient-specific personal or institutional draft from notes/context; no added promises, authority or attachment claims | 0.35 / 4000 |
| `letter.rewrite` | Letters → `LetterAssistant` Refine | Preserve current original, recipient, voice, uncertainty and signature; explicit warmth and review | 0.2 / 8000 |
| M `obituary` | `/modules/funeral` | Supplied obituary/eulogy/notice facts; unknown dates/relationships remain unknown | 0.4 / 3000 |
| M `letters` | Letters, Legacy Journal, Time Capsule | Recipient-specific letter/journal/future message; original memory survives revisions; reading occasion does not imply delivery | 0.4 / 3000 |
| M `executor` | Registered service selector; **no mounted UI caller** | General estate questions using stated authority; retained for compatibility, no new workflow claimed | 0.2 / 3000 |
| M `heirlooms` | Heirlooms, Family Hub, Timeline | Object/memory/recipe/milestone story; exact provenance, ownership and uncertainty; no invented image interpretation | 0.4 / 3000 |
| M `legal_explainer` | Legal Documents | General concepts and questions for a local professional; no unseen-document validity assessment | 0.2 / 3000 |
| M `contacts` | Family & Contacts | Supplied identity, relationship, contact and communication preferences; preserve sharing choices | 0.2 / 3000 |
| M `medical` | Health & Medical | Care wishes, documents and team questions; no diagnosis/treatment or validity claim | 0.2 / 3000 |
| M `pets` | Pets | Supplied routines, contacts, care and memories; no invented dose or guardian agreement | 0.2 / 3000 |
| M `property` | Property & Real Estate | Recorded ownership description, originals and practical instructions; no invented value/title/transfer right | 0.2 / 3000 |
| M `insurance` | Insurance | Supplied policy/beneficiary information and insurer questions; no payout/entitlement determination | 0.2 / 3000 |
| M `digital-guardian` | Digital Guardian | Recovery-instruction locations and official provider processes; protected secret placeholders | 0.2 / 3000 |
| M `visual-memories` | Visual Memories | Archive locations/captions from supplied descriptions; no assumed visual analysis | 0.2 / 3000 |
| M `financial` | Financial Accounts | Account/debt/currency/ownership descriptions and originals; recorded versus verified values kept distinct | 0.2 / 3000 |
| M `activity-log` | Activity Log | Explain maintenance/change records; actual entries only if supplied | 0.2 / 3000 |
| M `subscriptions` | Subscriptions | Supplied recurring charges, continuation wishes and cancellation enquiries; no guaranteed cancellation/refund | 0.2 / 3000 |
| M `advanced-registry` | Advanced Registry | Purchases, maintenance, warranties/claims and source documents; no invented history or approval | 0.2 / 3000 |
| M `qr-codes` | QR Codes | Actual signed-in shortcuts versus separately issued recipient link; no access expansion | 0.2 / 3000 |
| M `home-manual` | Home Manual | Author-supplied equipment/vendor instructions and their locations; no invented shutoff or safety procedure | 0.2 / 3000 |
| M `calendar` | Calendar, Anniversary Manager | Supplied occasion and optional remembrance wishes; no spouse/religion/delivery assumption | 0.4 / 3000 |

Each row below covers **two distinct combinations**, `writer.draft_text/<variant>` and `writer.rewrite_text/<variant>`: 9 × 2 = 18. Actual shared caller: `SmartTextarea` → `writerService.aiDraftText/aiSoftenText`. They remain one-shot reviewed suggestions, with current original/job context rather than an invented chat history. Draft output is plain text, max 2000; rewrite output plain text, max 8000. Rewrite warmth thresholds 33/66 remain. Draft temperature is 0.35 and rewrite 0.2, except the three practical variants use 0.2 for both.

| Variant | Actual field(s) | Task-specific suitability |
|---|---|---|
| `heirloom` | Heirlooms → `VisionUploader` provenance | Known history/meaning versus uncertain recollection; intended recipient preserved |
| `timeline` | Timeline Details | Dated first-person memory; no invented chronology or participants |
| `contact` | Contacts Caller Notes | Concise timing/method/support/wording instructions for a caller; not a farewell letter |
| `pet` | Pets Tribute & Notes | Follow notes' memory/care emphasis and exact supplied care facts |
| `funeral` | `FuneralWizard` values, atmosphere, obituary notes | Write only the requested wishes; selected tradition does not invent beliefs/rituals |
| `letter` | Letters editor and interview answer | Actual recipient and original message; no romantic assumption |
| `ethical_will` | Legacy Journal → `EthicalWill` | Author's own beliefs, including ambiguity; no conventional virtues inserted |
| `life_lesson` | Legacy Journal → `LifeLessons` | Actual experience and lesson, kept distinct |
| `storytelling` | Timeline reflection | Actual scene/turning point; no invented dialogue or sensory detail |

**Count:** 4 no-variant calls + 19 M selectors + 18 writer selectors = 41 registered; 40 have mounted UI consumers. The executor selector is not presented as a completed UI feature.

## All 33 registered application assets

Keys are abbreviated only by shared path prefixes below; registered keys, shapes, placeholder vocabularies, primary labels and consumer metadata are retained. Adopted/saved user text is never rewritten by these new defaults.

| # | Existing asset key/group | Disposition |
|---|---|---|
| 1 | `AIPromptBar.svelte:quickPrompts` | Updated recipient/known-story, QR and actual-instruction wording; retained factual concept prompts. Only the existing 11 live default-chip variants consume this map; inactive defaults remain compatibility entries. |
| 2 | `writerService.ts:CONTEXT_SUGGESTIONS` | Unchanged open-ended starters across nine contexts; new native task rules prevent an answer from inventing facts or beliefs. Both writer purposes remain consumers. |
| 3 | `reflectionPools.ts:letters` | Loved-one questions now work beyond a romantic partner; ethical-will questions retained as optional elicitation, not prescribed beliefs. Existing `spouse` key remains an implementation key. |
| 4 | `reflectionPools.ts:heirlooms.story` | Factual memory/provenance questions; removed object-speaking fiction and importance pressure. |
| 5 | `letterTemplates.ts:bodies` | All 24 reviewed: two QR covers corrected; bank/brokerage/IRS/DMV/credit bureau/insurance/social/USPS/professional/charity/pet/refund wording revised where assumptions existed. Credit-card, mortgage, utility, employer, pension, landlord, VA and medical requests remain factual placeholder-based requests. |
| 6 | `funeralTraditions.ts:smartTextareaPrompts` | Existing 63 optional, selected-tradition strings retained except two: political identity → family/community memories; implied time pressure → stated burial wishes. No tradition is inferred for the author. |
| 7 | `EthicalWill.svelte:EXAMPLE_LETTER` | Fill-in author's values/experience/message instead of asserting generic moral beliefs. |
| 8 | `legacy-journal/+page.svelte:journalPromptPool` | Explicit author notes/relationships; son or chosen recipient; no assumed romance. |
| 9 | `letters/+page.svelte:emotional_drafts` | Two neutral author-answer layouts; removed invented romance, feelings and promises. Signature placeholder retained; recipient/closing placeholders stay editable text. |
| 10 | `letters/+page.svelte:writing_prompt_append` | Unchanged composition and draft/prompt/separator slots. |
| 11 | `letters/+page.svelte:writing_prompt_separator` | Unchanged paragraph separation. |
| 12 | `advanced-registry/+page.svelte:prompts` | Actual supplied purchase/maintenance/claim documents and questions. |
| 13 | `anniversary-manager/+page.svelte:prompts` | Actual date, recipient and optional remembrance. |
| 14 | `calendar/+page.svelte:prompts` | Removed assumed spouse/Christmas; optional occasion-specific message. |
| 15 | `family-hub/+page.svelte:prompts` | Supplied memory/tradition/recipe; photo caption explicitly uses supplied details. |
| 16 | `home-manual/+page.svelte:prompts` | Actual instructions/locations/vendors rather than invented safety procedures. |
| 17 | `letters/+page.svelte:prompts` | First-class letter to son, author-preserving revision and chosen-recipient options. |
| 18 | `qr-codes/+page.svelte:prompts` | Unchanged already-accurate signed-in shortcut/recipient-link wording. |
| 19 | `subscriptions/+page.svelte:prompts` | Actual continuation choices, billing questions and reviewed cancellation enquiry. |
| 20 | `time-capsule/+page.svelte:prompts` | Son/chosen recipient, actual occasion and reading later; no delivery assertion. |
| 21 | `timeline/+page.svelte:prompts` | Unchanged relevant memory/milestone requests. |
| 22 | `conciergeEngine.ts:PIVOT_GREETINGS` | Brief task-specific invitation; no courage/protection/completion claims. |
| 23 | `conciergeEngine.ts:contextGreetings` | Same concise scope-specific questions for first opening. |
| 24 | `conciergeEngine.ts:greeting_prefix_first` | Unchanged short welcome. |
| 25 | `conciergeEngine.ts:greeting_prefix_return` | Unchanged short return. |
| 26 | `conciergeEngine.ts:greeting_home` | Equal personal writing, finances and handover choices; no contact-first intake. |
| 27 | `conciergeEngine.ts:greeting_other` | Record/revise the requested module. |
| 28 | `conciergeEngine.ts:greeting_join` | Unchanged prefix/body slots. |
| 29 | `conciergeEngine.ts:pivot_fallback` | Plain invitation for the selected context. |
| 30 | `conciergeEngine.ts:pivot_join` | Unchanged context/lead-question slots. |
| 31 | `grief-support/+page.svelte:greeting` | Optional talk/remember/write invitation, without a scripted relationship claim. |
| 32 | `aiConciergeService.ts:AI_UNAVAILABLE` | Unchanged UI-only resting notice; current failures remain outside eligible conversation history. |
| 33 | `SmartTextarea.svelte:starter_suffixes` | Unchanged punctuation; both writer modes retain their scoped configuration. |

## Validation and limits

The approved one-run inline Python proof passed **41/41 actual resolver/assembler cases and 12 additional contract assertions**. It used the worktree's real `resolve_configuration`, `StructuredRequest`, validation and `assemble_request`, with one synthetic Shared Fireworks selection and 16 user/model history messages plus an excluded app greeting. It verified current job/brief/recipient/facts, original-first history retention, JSON-versus-text response instructions, all 19 distinct module tasks, all nine writer contexts, saved override precedence and no unresolved template slots. All 33 asset keys/shapes/placeholder vocabularies and all 77 consumer entries match the base registry. **22 assets changed; 11 retained.** No HTTP, database connection/startup, provider inference or production write occurred. Evidence: `/private/tmp/continuum-x378/proof.log` and `proof.json`.

An independent source/content review then found one remaining canned sentiment, "proud", in the charity/alumni template. That sentence was made neutral; only the affected asset's shape, placeholders and factual wording were rechecked, with the original successful matrix retained. Numeric generation choices are initial task budgets, not measured model-quality claims.

Source paths read include `backend/ai_defaults.json`, `ai_capabilities.py`, `ai_request.py`, `ai_settings.py`, `routers/ai_proxy.py`, `routers/ai_settings.py`; frontend `aiCapabilities`, concierge/grief/writer services, `conciergeEngine`, `AIPromptBar`, `SmartTextarea`, `LetterAssistant`, their 23 module-page callers and the funeral/journal/heirloom helper callers. Output/parser and redaction/acceptance paths remain unchanged. Admin saved overrides and future edits remain authoritative.

Two explicit limits remain: prompt text cannot prove factual/legal/clinical correctness of a model response; a long rewrite may still reach the provider output budget (the current frontend does not inspect `finish_reason`). This card changes defaults, not that response-handling contract. Application-name transport metadata belongs to X379 and is intentionally absent here.
