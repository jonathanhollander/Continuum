# T0c — Tone review: family, contacts, recipient, calendar, medical, executor

**Last Updated:** 2026-10-26 08:20 EST

Read-only (card T0). Format: `line | current | suggested`. Paths relative to `frontend/src/`. Roles: owner (O), executor (E, grieving), recipient (R), family (F). PulseContactsManager/GuardianPicker items are in T0d; recipient.py backend items in T0f.

## routes/modules/family-hub/+page.svelte
- :445 "Update Memory"/"Save Memory" → "Save this memory"
- :493 "Skip tour, go to dashboard" → "Continue to your dashboard"
- :503 "…Identify your key players to unlock the full power of the Continuum." → "Your plan is held by trusted people. Add them here whenever you feel ready."
- :504 timeEstimate "5 mins" → "At your own pace"
- :507-513 "Connect 3 Family Members", "Designate an Executor", "Upload a Shared Memory" → "Welcome 3 family members", "Name your executor", "Share a memory"
- :621 title "Delete Memory" → "Remove this memory"
- :774-775 "Watch our guide videos to understand your role…" → "Our guide videos are here for you, whenever you want to learn more about your role."

## routes/modules/contacts/+page.svelte
- :77 hint "Among the very first to be called, directly." → "Hears from you or your family first, in person."
- :291 whyMatters "removes the panic of 'who do I call?'" → "gives your family a clear place to turn"
- :338 "Pending Immediate" → "Still to reach"
- :397 "Contact Directory Empty" → "Your contact directory is ready for its first person"
- :399 "No Contacts Yet" → "Contacts will gather here"
- :402 "If no contacts were recorded, you may need to gather…" + "Building this directory will help ensure all necessary parties are properly notified" → "Phone records, address books and family members are good places to find contact details, when you feel ready. Gathering these details helps each person hear in the right way."
- :404 "This directory will be populated as information becomes available." → "Contacts gather here as details are shared."
- :405 "Without this list, your family won't know… won't have to search…" → "With this list, your family knows who your lawyer is, who has your keys, and who should be at your bedside. Whoever handles your affairs can reach the right people without searching old emails."
- :423-425 "Caller Strategy: …designed to prevent bad news from spreading via social media…" → "A gentle order: the people closest to your loved one hear directly, before the news travels further."
- :440 chip "Call Now" → "First to call"
- :627 "or simply remembered" → "or gently remembered"
- :752 placeholder "Be gentle, they are fragile" → "e.g. 'Speak gently; they love hearing your voice'"
- :774 "Not right now" → "Maybe later"
- ContactRow.svelte:11-15, :68 status chips "Pending", "Left Msg", "Unreachable" → "Waiting", "Left a message", "Will try again"

## routes/modules/anniversary-manager/+page.svelte
- :111 "Remove this item?" → "Remove this remembrance?"
- :170, :215 "Without guidance on how to observe significant dates… may struggle…" → "With your guidance, your family has gentle rituals for the dates that carry emotion."
- :200-207 "Next 365 Days" → "The year ahead"
- :215 "…rather than aimless." → "Your family will have a ritual to follow, making hard days feel purposeful."
- :424-426 "We don't flood you with notifications. Only intentional reminders." → "Reminders arrive only when they matter."
- :432-434 "Dates aren't just deadlines; they are opportunities for rituals." → "Each date is an opportunity for remembrance."
- :463 "Curated by Estate Concierge Psychology experts." → remove (unverifiable claim)
- :562 "Ritual Instructions (Optional)" → "Ritual guidance, if you wish"

## routes/modules/calendar/+page.svelte
- :288 "Ensure your birthday, holidays, and anniversaries are celebrated exactly how you want…" → "You can shape how your birthday, holidays and anniversaries are celebrated."
- :289, :307 "Without your guidance, special dates become painful reminders…" → "With your guidance, special dates become moments of connection."
- :307 "…will still arrive after you're gone." → "Birthdays, anniversaries and holidays will keep arriving, and your family can feel your presence on them."
- :446 "…or just a Tuesday." → "…or an ordinary Tuesday."
- :637 "A simple instruction creates connection." → "A small instruction creates connection."
- :650-652 "Your executor can click a button to open this in their email client…" → "Your executor can open this in their email, ready for them to send for you."
- :707 "Not right now" → "Maybe later"

## routes/modules/medical/+page.svelte
- :224 "Remove this directive? This should only be done if the document has been revoked." → "Remove this directive? Do this when the document has been replaced."
- :251 "Medical uncertainty places a heavy burden… agonizing guessing games" → "Clear directives give your family certainty and ease."
- :298 blood type fallback "Not Set" → omit the line when blank (or "Add blood type" link)
- :318, :383 "Critical Allergies" → "Allergies"
- :322 "None reported" → omit, or "Add any allergies"
- :343 "Organ Donor Status Unknown" (red icon) → "Add your donor wishes" (calm colour → V)
- :355 "Update Profile" → "Edit my profile"
- :413, :702 "Not right now" → "Maybe later"
- :433-435 "It removes the burden of uncertainty" → "It gives your family certainty"
- :541 "Without advance directives, doctors and family members must guess… agonizing… not making impossible decisions" → "With advance directives, doctors and family know what you would want, and your loved ones feel the ease of honoring your choices."

## routes/modules/executor-toolkit/+page.svelte
- :114-120 "Sudden Passing Mode Active … Focus on the "Urgent" items first." → "Gentle first steps. These come first because they help most right now." (colours → V)
- :134-136 "Planned Passing Mode… verify and mark them off." → "Much of the groundwork may already be in place. Look it over when you're ready."
- :252-253 "Mark this step done" / "Done — tap to reopen" → "Mark this step as finished" / "Finished — tap to reopen"
- :329 chip "Urgent" → "First days"

## lib/data/tasks/phase1.ts … phase5.ts (executor task callouts)
- phase1:10 "Without these, you cannot proceed… within 24-48 hours of death." → "These documents open the way for the steps that follow. Take this at the pace that feels right."
- phase1:11 "URGENT: The will must be filed… Missing this deadline…" → "Most states ask for the will to be filed within 30 days. Your attorney can confirm the date for your state."
- phase1:38 "Order 10-15 certified copies immediately - ordering more later is expensive…" → "Many people find 10-15 certified copies helpful to have from the start."
- phase1:69 "you must secure all property… Empty homes are targets for theft." → "Within the first days, it helps to secure the home and valuables."
- phase1:83 "INSURANCE WARNING: …or coverage may lapse." → "Telling the insurer helps keep coverage in place."
- phase1:94 "Pets need immediate attention - they cannot be left alone..." → "Pets need caring for soon, and they will need someone close by."
- phase1:105-106 "Last resort, no-kill shelter only", "Don't Forget" → "A no-kill shelter is a gentle option if no family can take them", "Worth remembering"
- phase1:122 "you must systematically notify..." → "It helps to tell extended family and close friends directly. This spares anyone from learning through social media."
- phase1:180, :193 "time-sensitive", "Call the bank ASAP" → "Calling the bank early helps"
- phase1:224 "You CANNOT be reimbursed for..." → "You can be reimbursed for estate costs. Your time, routine meals and personal purchases fall outside that."
- phase1:279 "URGENT: Some benefits have SHORT CLAIM WINDOWS" → "Some benefits have short claim windows. HR can share the dates."
- phase2:10-11 "required… mandatory… Failing to file can result in fines or criminal penalties." / "LEGAL DEADLINE" → "Most states ask for the will to be filed within about 30 days. Filing it keeps things in good order."
- phase2:38 "Without them, banks… won't let you access accounts." → "With them, banks and agencies can work with you."
- phase2:73-74 "Report death ASAP… Failure to report… URGENT… Do NOT spend that money." → "Reporting early helps benefits stop smoothly. Payments received in the month of death are reclaimed, so it helps to set that money aside."
- phase2:85 "SSA does not send benefits automatically. You must call…" → "Survivor benefits begin when you call to request them."
- phase2:136, :141 "Separate estate funds (Critical)", "…crucial. NEVER mix..." → "Keeping estate funds in their own account keeps things clear."
- phase2:163 "They cannot open the account without it." → "They open the account once you have it."
- phase3:10 "Banks must be notified..." → "Letting banks know early helps stop automatic withdrawals."
- phase3:26-27 "Cancel cards immediately… You are NOT personally liable" / "You are not responsible for deceased's debt" → "You are personally responsible only for debts you hold jointly. The estate pays the rest."
- phase3:60-61 "DO NOT CANCEL", "Notify insurer immediately" → "Keep the policy active", "Let the insurer know soon"
- phase3:77 "KEEP PAYING: Do not miss payments! Foreclosure is still possible." → "Keep the mortgage current to protect the home."
- phase3:154 "Do this ASAP." → "A prompt notice protects their identity."
- phase4:10 "You must create a complete inventory" → "A complete inventory helps the probate court."
- phase4:12 "Tax assessment is NOT enough" → "An appraisal gives the value the court needs."
- phase4:17 "DEADLINE: Court inventory usually due within 90 days." → "Courts usually ask for the inventory within 90 days."
- phase4:35 "INSOLVENT? …creditors get nothing. Do not pay from your own pocket." → "If debts are larger than assets, the estate settles what it can. Your own funds stay yours."
- phase4:62 "Vacant homes risk vandalism and voided insurance." → "Keeping the home secure and insured keeps it safe."
- phase4:78 "Secure jewelry/valuables immediately to prevent theft or family 'borrowing'." → "Placing valuables somewhere safe early keeps everything accounted for."
- phase4:84 "items not specified in the will" → "items the will names no one for"
- phase5:10 "You must file a final Form 1040" → "A final Form 1040 covers Jan 1 through the date of death."
- phase5:26, :28 "Federal return only needed if…", "Even if no tax owed" → "A federal return applies when the estate is over $13.61 million…"
- phase5:29 "PROFESSIONAL HELP: Never DIY an estate tax return. Hire a specialist." → "A specialist can guide an estate tax return with you."
- phase5:55, :59 "DO NOT do this until debts/taxes are paid.", "BENEFICIARIES MUST SIGN RECEIPTS." → "Distribute once debts and taxes are settled.", "Ask each beneficiary to sign a receipt."
- phase5:87 "One wrong move can lead to personal liability." → "A coordinated team keeps everything on track."
- phase5:103, :118, :155, :159, :172, :187 "must keep running", "Secure these immediately", "Manage market risk", "Portfolio Risk", "You must coordinate", "DEADLINE: Form 706..." → same pattern ("helps", "when you can", "Form 706 is usually due within 9 months of death")

## routes/modules/executor-guide/+page.svelte
- :19 "Immediate Actions (First 48 Hours)" → "First Days"
- :24-28, :38-42, :52-56 imperative steps ("Locate…", "Verify…", "Ensure…", "Obtain…", "Conduct…") → invitations ("When you're ready, find the original will.")
- :55 "Digital Kill Switch records" → "Digital Guardian records"
- :111 "Need Pro Help?" → "Professional help is here when you want it"
- :119 "Browse Directory" → "Explore the directory"
- :175 "Pro Tip for Executors" → "A thought for executors"
- :180-183 "…Keep beneficiaries updated weekly, even if there is no major news. Transparency prevents most estate…" → "Kind communication matters as much as the paperwork. Updating beneficiaries gently, even when there is little news, keeps trust strong."

## routes/executor/+page.svelte and lib/components/executor/* (also in T0e — this list wins)
- executor/+page.svelte:43-105 imperative step lists ("Obtain…", "Locate…", "Notify…", "Identify…") → "Gather certified copies of the death certificate when you're ready", "Let close family know", "Let Social Security know", "Let the banks know", "Look after the property"
- :124-125 "Timeline & Deadlines" / "Important dates and filing requirements" → "Important Dates" / "Dates that matter, gathered in one place"
- :194 "These are the core areas you'll need to address." → "These are the core areas to explore when you're ready."
- ExecutorHub.svelte:30 "People who need to be notified" → "People to let know when you're ready"
- ExecutorHub.svelte:111 "Focus on these key areas first." → "These areas may help most first."
- ExecutorHub.svelte:168-172 "Need to explore more?" → "Explore more, whenever you like"
- ExecutorHub.svelte:176 "Focus on what matters most right now." → "Rest with what matters most right now."
- ExecutorWelcome.svelte:29 "There are no deadlines here" → "Take all the time you need."
- ExecutorWelcome.svelte:32, :204 "Get Started" → "Begin when you're ready"
- ExecutorWelcome.svelte:85 "with compassion and without pressure" → "with compassion and room to breathe"
- ExecutorWelcome.svelte:100 "Skip introduction" → "Come back to this later"
- ExecutorWelcome.svelte:112 "There's no rush" → "Take your time"
- ExecutorWelcome.svelte:128-131 "Skip what you don't know. Leave sections blank if you don't have the information yet." → "Leave a section for later, and fill it in whenever the details come."
- ExecutorWelcome.svelte:141 "This work can be emotionally taxing." → "This work is tender. Rest is part of it."
- ExecutorWelcome.svelte:177 "completely optional" → "share only if you wish"
- ExecutorProgressTracker.svelte:19 "You're just getting started." → "You've begun. Take it one step at a time."
- ExecutorProgressTracker.svelte:27 "…is comprehensive." → "…is thorough."
- ExecutorProgressTracker.svelte:105 "Complete Profile" → "Profile"
- SupportResources.svelte:40 "Need Support?" → "Support is here for you"
- SupportResources.svelte:86 "In crisis?" → "If you need someone right now"

## Recipient
- lib/components/recipient/RecipientPageState.svelte:17 "The person who shared it can send you a fresh link whenever it is needed." → "This page is closed for now. The executor, or the person who shared it, can open it again for you." (the sharer may have died)
- lib/components/recipient/RecipientLinkPanel.svelte:61 "The link is closed. A fresh one is a click away." → "This link is closed for now. A fresh one is ready when you are."

Not covered: `lib/data/familyGuides.ts`, `lib/data/faqs.ts` — sweep them in the same card.
