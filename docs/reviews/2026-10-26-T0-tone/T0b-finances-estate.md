# T0b — Tone review: finances and estate

**Last Updated:** 2026-10-26 08:20 EST

Read-only (card T0). Format: `line | current | suggested`. Paths relative to `frontend/src/`.

Cross-cutting:
1. "Not right now" (shared cancel) violates the owner's no-negatives rule → "Maybe later" everywhere: insurance :1270, property :697/:965/:1312, subscriptions :785, digital-guardian :1122, advanced-registry :1015, pets :626, DocumentVault :661/:921, home-manual :264/:314/:365, ConfirmModal :52.
2. Every `whyMatters` "Without X, your family could/may…" → "With X, your family can…".
3. "Critical" labels → "Important" (insurance :1220, property :797/:1256, home-manual :755, estate :45).

## routes/modules/financial-accounts/+page.svelte
- :111 "We couldn't save that just yet. Your words are still here — try again when you're ready." → "Your words are safe here. We can save them again whenever you're ready."
- :144 "…isn't just about numbers—…isn't left searching…" → "Gathering your financial accounts in one place gives your family a clear path to the resources meant for them, and a steady footing during a time of uncertainty."
- :145 "Unclaimed assets and lost accounts are a common burden…" → "Documenting your accounts now helps your resources reach the people you love, with ease."

## lib/components/archetypes/AssetManager.svelte
- :585 "Add Asset" → "Share an asset"
- :592 "Export CSV" → "Save a copy as a spreadsheet"
- :608-609 "…Ensure all valuations are up to date for probate filing." → "You can view and update everything here, whenever the time is right."
- :815 "Verification" → "Supporting documents"
- :910 "Cancel" → "Maybe later"
- :919 "Add to Inventory" / "Update Asset" → "Save this asset" / "Save my changes"
- :946, :1164 title "Edit Asset"/"Edit" → "Edit these details"
- :953, :1171 title "Delete Asset"/"Delete" → "Remove this item"

## lib/components/ui/GhostRow.svelte
- :87-88 "Click to Add Real {type}" → "Add your own {type}"

## lib/components/ui/CustomFieldsManager.svelte
- :47 `Delete field "${name}"? Data in this field will remain but be hidden.` → `Remove the field "${name}"? Anything you saved in it stays safe.`
- :181-182 "Cancel" → "Maybe later"

## lib/components/ui/EmptyStateGuide.svelte
- :53-54 "Ensure their stories aren't lost." → "Keep their stories alive for the people who will treasure them."
- :76/~92 "e.g. Colorful / No Black" → "e.g. Colorful and bright"
- :98-99 "Securely log locations of critical documents. We verify that you know where they are." → "Note where each important document is kept, so your family can find it."
- :112-113 "Don't leave them guessing. Log trusted vendors and critical shutoff locations." → "Give your family a clear guide to the people and places that keep your home running."
- :126 "Identify 'Zombie Bills' and services that need cancellation." → "Gather the recurring charges your family may want to review."
- ~:132 "Diff: Hard" → "Cycle: Monthly"
- :146 "Status: Complete"/"Pending" → "Status: Ready"
- :152 "This section is empty. Add your first item to begin." → "Your first entry can go here whenever you're ready."

## routes/modules/insurance/+page.svelte
- :411 "when you're no longer here to provide it" → "to look after them"
- :412 "…simply because beneficiaries didn't know policies existed." → "Cataloging your policies here helps every benefit reach the people you love."
- :804, :855 "Without documentation, they may never find these benefits…" → "With documentation, your family can find each benefit and the protection you worked for reaches them."
- :1220 "CRITICAL" badge → remove, or "Helpful for your family"

## routes/modules/property/+page.svelte
- :503 "…your family won't have to search for deeds…" → "…means your family can find deeds, titles, and proof of ownership with ease."
- :504 "Without clear records… legal complications…" → "Clear records of what you own, and where the documents are, give your family a steady path to ownership and access."
- :797, :1256 "Critical Documents" → "Important Documents"
- :867 "Register First Asset" → "Share your first asset"

## routes/modules/subscriptions/+page.svelte
- :376 "money your family won't lose to forgotten charges… after you're gone" → "Every subscription you document helps your family keep money that might otherwise go to forgotten charges."
- :377 "After you're gone, these charges will keep hitting… won't know… one less headache" → "A short list of your subscriptions gives your family the names and steps to close each one, one less thing for them to carry."
- :414 "Identify your 'zombie bills'" → "Gather your recurring charges"
- :415 whyMatters "…isn't just about savi…" → "Documenting your subscriptions also gives your family the steps to close each one."
- :486 "Inflation Alert" + "Review annually. Prices tend to creep up." → "A gentle reminder" + "A yearly look keeps these amounts current."
- :660 "Subscriptions keep charging even when no one's watching…" → "Documenting these gives your family a clear path through closing each subscription."
- :721 "Difficulty to Cancel" → "How easy it is to close"
- :866 "[Executor Name Not Set]" → "[Executor name]"
- SubscriptionRow.svelte:88 "{difficulty} Cancel" → "{difficulty} to close"; :109 "Cancellation Protocol" → "Steps to close this subscription"; :123 "Go to Account Management" → "Open the account page"; :141 "Generate Formal Letter" → "Prepare a letter for me"

## routes/modules/digital-guardian/+page.svelte (also in T0d — one card owns it)
- :398 "Protect your digital legacy from being locked away forever" → "Keep your digital legacy within your family's reach"
- :399 "…so your family isn't locked out…" → "…so your family can reach your photos, emails, and accounts."
- :400 "Without these specific setups… Taking action now ensures…" → "These setups keep your family connected to irreplaceable memories, important accounts, and digital assets."
- :467 "The Fire Drill" → "A gentle practice run"
- :470-471 "Hope is not a strategy. Verify…" → "Walk through it once with your Legacy Contact, so getting in is simple when it matters."
- :648-649 "Allow someone to access your Apple account data after you pass away." → "Choose someone who can reach your Apple account data when you're gone."
- :745 'Google acts as a "Dead Man's Switch". If you don't log in…' → "Google can notify your chosen contact after a period of no sign-ins that you choose."
- :816 "Ensure your executor has access to your master password" → "You can let your executor know where to find your master password"
- :832 "Do NOT store your Master Password digitally." → "It is safest to keep your Master Password on paper, in your Red Binder."
- :851-852 "Write the Master Password on it (it is usually blank)." → "You can write the Master Password on it."
- :855 'Seal it in an envelope marked "For Executor Only".' → 'You can seal it in an envelope marked "For Executor".'
- :923 'Alternatively, select "Delete After Death".' → 'Or you can choose "Delete After Death".'
- :980-981 "LinkedIn does not allow pre-selection. Your executor must contact them." → "Your executor can contact LinkedIn when the time comes."
- :994-995 "Executor will need: Link to obituary or death certificate." → "Your executor will have a link to the obituary or the death certificate ready."
- :1033 "Run Discovery Wizard" → "Walk me through my accounts"
- :1041 "Add an account" → "Share an account"

## routes/modules/advanced-registry/+page.svelte
- :140 (ids :58, :200, :582) tab "Kill Switch" (Skull icon) → "Account Wishes" (label only; keep ids)
- :179 "Complete Record" → "Your Full Record"
- :180 "Precision tracking for assets, maintenance, and digital legacies" → "A fuller record of your assets, upkeep, and digital legacy"
- :182 "Detailed asset records prevent costly mistakes…" → "Detailed asset records give your family the history behind each asset."
- :334 whyMatters "Without this record… audit trail…" → "This record helps your family understand where each asset came from and who it is meant for."
- :426 "…unnecessary repairs… before they become emergencies." → "…helps them care for what you built and keeps warranties in view."
- :544 "Insurance claims can take months… no money is left on the table…" → "Open claims can take a while. Noting them here gives your family what they need to follow through."
- :600 "Digital Inheritance Protocols" → "How to care for your online presence"
- :605-608 "…memorialization or total data deletion." → "…clear wishes for your executor about memorializing or removing each account."
- :963-964 option "Delete / Close" → "Remove / Close the account"

## routes/modules/pets/+page.svelte
- :223 "…no matter what happens" → "…for the rest of their life"
- :224, :390, :405 "Without a documented plan, your pets could end up in a shelter…" → "A documented plan places your pets with someone who knows their needs, fears, and routines."
- :394, :409 ctaLabel and :471 title "Protect your companion" → "Share your companion's story"
- :474 "Your pet depends on you completely. This information ensures…" → "Your pet will be cared for by someone who truly understands them."

## routes/modules/home-manual/+page.svelte
- :382 "…Don't leave your family guessing…" → "Give your family a clear guide to turning off the water and who to call when something breaks."
- :383 "In a crisis… Without these details…" → "These details make everyday tasks gentler for your family during a difficult time."
- :438 "…your family won't know who to call…" → "When something breaks, your family will know exactly who to call."
- :476 "Who To Call" → "Who to turn to"
- :608 "…invisible barriers that could lock your family out… police response" → "These details open the door for your family and let them settle in with ease."
- :609 "Start with your most critical code" → "Start with the code you use most, the alarm or front door."
- :715-716 "When seconds matter" / "A burst pipe at 2am… searching frantically…" → "Where to find the shutoffs" / "Knowing where the water main, gas valve, and electrical panel are keeps your family calm and safe."
- :755 "Critical Shutoffs" → "Important Shutoffs"

## lib/components/archetypes/DocumentVault.svelte
- :367-371 "critical information" → "important information"
- :913 description "This action is permanent." → check real behaviour; if removal is final: "This clears the document from your vault."

## lib/components/archetypes/TaskDashboard.svelte (executor)
- :211 "Estate settlement is a marathon, not a sprint." → "Estate settlement unfolds in its own time, one small step at a time."
- :306 "{progress}% Complete" → "{progress}% done so far"
- :404 "You're all caught up. Breathe easy." → "Everything here is looked after for now."
- :447 "Mark Complete" → "Mark as done"

## routes/estate/[id]/+page.svelte (executor)
- :41 "Immediate Action Required" → "A gentle first step when you're ready"
- :42-43 "…the highest priority is securing legal documentation." → "A good place to begin, whenever you're ready, is gathering the legal documents."
- :58 "Executor Control Center" → "Your Executor Space"
- :132 "Vault Empty" → "Your vault is ready for its first document"
- :171 "Immediate Actions" → "Gentle next steps"
- :176 "No tasks assigned yet." → "Tasks will appear here as you add them."
- :77 `MechanicalIcon urgency="urgent"` → calm treatment (→ V)

## lib/components/modules/legal-documents/
- JargonSlayer.svelte:164 "This clause typically requires careful review." → "This clause is worth a careful look."
- LegalDisclaimer.svelte:8 "We are not a law firm, and this is not legal advice… Please consult…" → "Continuum shares this information to help you learn and organize. For legal guidance specific to your situation, a qualified attorney can help, since laws vary by jurisdiction." (keeps the disclaimer's meaning in positive form)
