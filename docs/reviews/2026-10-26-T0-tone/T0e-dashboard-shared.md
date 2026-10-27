# T0e — Tone review: dashboard, navigation, settings, onboarding, marketing, shared UI

**Last Updated:** 2026-10-26 08:20 EST

Read-only (card T0). Format: `line | current | suggested`. Paths relative to `frontend/src/`. Items also listed in T0b (GhostRow, ConfirmModal, CustomFieldsManager, EmptyStateGuide, LegalDisclaimer, VideoRecorder) and T0c (executor components) belong to those cards — skipped here.

## lib/services/errorHandler.ts (every role; toasts)
- :38 "Something went wrong. Please try again." → "Something unexpected happened. We can try again whenever you're ready."
- :59 (400) "There was an issue with your request. Please check your information and try again." → "A little more information will help us here. Take a look when you're ready."
- :61 (401) "Your session has expired. Please sign in again." → "Your session has rested. Sign in again whenever you're ready."
- :63 (403) "You don't have permission to do that." → "That belongs to someone else's access. The person who set up this space can open it for you."
- :65 (404) "We couldn't find what you're looking for." → "That may have moved. Let's look together from the dashboard."
- :67 (409) "This already exists. Please try a different name." → "A page with that name is already here. A different name will make it its own."
- :69 (413) "The file you're trying to upload is too large." → "This space holds files up to 10 MB. A smaller copy will fit."
- :71 (429) "You're doing that too quickly. Take your time—…" → "Take your time. We're here when you're ready."
- :73 (500) "We encountered an unexpected issue. Our team has been notified." → "Something unexpected happened on our side. We're looking into it."
- :75, :89 (503) "We're having trouble connecting… Please try again in a moment." → "Connecting is taking a moment. Your words are kept safe here, and we'll try again shortly."
- :77, :100 "…Please try again or contact support." → "Something unexpected happened. We can try again together, or support is here to help."
- titles: :146 "Session Expired" → "Your session is resting"; :152 "Not Found" → "That may have moved"; :155 "Please Check Your Information" → "A bit more information"; :164 "File Too Large" → "A smaller copy will fit"; :167 "File Type Not Supported" → "This space keeps images and documents"; :177 "Something Went Wrong" → "Something unexpected happened"

## Shared ui
- ErrorNotification.svelte "Dismiss" → "Close for now"
- ProfileSwitcher.svelte:211 "Cancel" → "Maybe later"
- MediaGallery.svelte:156 "Gallery is empty" → "Photos you add will appear here."; :270 title "Delete" → "Remove this"
- FileUploader.svelte:199 "Click to upload or drag image here" → "Add an image here, or drag one in"
- UniversalUploader.svelte:89 "Please upload an image file." → "This space keeps images."; :93 "Please upload a document (PDF, Text)." → "This space holds PDF and text documents."; :267 "Click to upload" → "Add a file here"
- EvidenceGalleryUploader.svelte:149 "Processing media..." → "Preparing your photos..."; :161 "Click to Upload Evidence" → "Add a photo or document"
- SyncBadge.svelte:41 "We couldn't save just now. Your words are still here." → "Saving is taking a moment. Your words are still here, and we'll try again."
- EstateCard.svelte:44 "No description provided." → blank
- BreakOffer.svelte:105 "We noticed you've been moving through many pages quickly." → "You've been exploring a lot. A pause is always here for you."; :206 "Don't show this support again" → "Hide these notes"
- GriefChecklist.svelte:23 "immediate care of your loved one" → "early care of your loved one"; :29 "Notify immediate family and close friends" → "Let close family and friends know"; :47 "Ensure any dependent animals are fed…" → "When you can, see that any animals are fed and the home is secure."; :75 "There's no rush" → "Move at your own pace"
- lib/utils/contextualMessages.ts:166 "No contacts have been recorded yet…" → "Contacts can be gathered here when you're ready. Other sources can help."; :171 "No documents have been uploaded yet…" → "Documents can be added here. Physical copies may help."; :176 "No memories have been recorded." → "Memories can be added here."; :183 "Nothing here yet…" → "This space is ready for what you add."; :350 "Progress isn't linear…" → "Progress comes in its own time. Rest whenever you need to."
- lib/utils/encouragements.ts:27 "…something most people put off forever." → "You're doing something thoughtful and brave."; :134 "There's no rush—write when you're ready." → "Write when you're ready."; :138 "…aren't always valuable—they're meaningful." → "What matters most is meaning, more than value."; :141 "Nothing here yet" → "This space is ready"
- help/GettingStartedWizard.svelte:82 "This helps us hide tools you don't need." → "This helps us show the tools that fit you."; :95 "…no complex trusts." → "…straightforward trusts."; :179 "Just a quick check - do you know where these valid docs are?" → "Do you know where these documents are kept?"
- concierge/AIPromptBar.svelte:267 "We couldn't copy that just now. You can select the text…" → "Select the text to copy it."
- layout/ConciergePanel.svelte:397 "Dictated - Please verify" → "Spoken words, ready for a read-through"
- layout/MarketingLayout.svelte:72 "Continuum Legacy Systems. Forever." → "Continuum. Here for the people you love."
- layout/FocusFooter.svelte:18 "Focus Mode Active" → "A quiet space for you"; :28 "Complete & Return" → "Return when you're ready"
- dashboard/FocusCard.svelte:28 "Critical Priority" → "Worth a look" (no importers; low)

## lib/components/ui/CommandCenter.svelte
- :128 "funeral Planner" → "Final Wishes"
- :155 `Policy #${… || "N/A"}` → omit the number when empty
- :163 `${p.type} - ${… || "Unknown"}` → omit the breed when empty
- :247 placeholder "Search modules, features, or tools... (e.g. 'Will')" → "Find what you're looking for..."
- :263 "Quick Navigation" → "Where would you like to go?"
- :304 `No results found for "{query}"` → drop; keep "Try 'Digital', 'Executor' or 'Will' to find your way."

## lib/components/ModuleContent.svelte (preparation / executor hubs)
- :43 "Verify information accuracy" → "Take a look to see it all reads right"
- :121 "This module is a critical component of the ${role} workflow." → "This section is part of your {role} journey."
- :124-128 "…organize and secure… ensures that your estate planning remains comprehensive…" → "This is a place to gather what matters, so it's easy for others to find."
- :138 "Priority Level: High" → remove
- :143 "Estimated Time: 15-30 mins" → "A short while, at your pace"
- :214-216 "If you're unsure… consult the master guide or contact your estate attorney" → "Whenever you'd like more guidance, your attorney is a good place to start." (there is no master guide)

## routes/dashboard/+page.svelte
- :321 "…so you don't lose your place here." → "We've opened the Treasure Hunt in a new tab so your place here is kept."
- :641 chip "Needs attention" → "Worth a look"
- :674 `Nothing found for "${q}"` → `Let's find "${q}" another way. Try a different word.`
- :764 "No modules with this status" → "Sections with this status will appear here."

## lib/config/navigation.ts (tooltips)
- :165 "Securely document bank accounts and investments" → "A place for your bank accounts and investments"
- :192 "Recurring payments and memberships to cancel" → "Recurring payments and memberships your family may want to review"
- :218 "Wills, trusts, and critical legal files" → "Wills, trusts, and the legal papers that matter"
- :262 "Generate a physical backup of your plan" → "A printed copy of your plan to keep close"
- :347 "Comprehensive database of all items" → "Everything you have recorded, in one place"
- :356 "Developer tools for customizing Continuum" → "Customize how Continuum works for you"
- :365 "Interactive guide to finding important items" → "A gentle guide to finding what matters"
- :373 "Manage your account and preferences" → "Your account and preferences"

## routes/login/+page.svelte
- :85-86 "Login Successful" → "Welcome back"
- :95 "Login was cancelled or timed out. Please try again." → "That sign-in paused. We can try again whenever you're ready."
- :100 "Your device does not support passkeys. Please use email link instead." → "An email link will open the door on this device."
- :123 "We'll need your email address to continue." → "Your email address will let us send your link."
- :288-300 "…nothing to remember and nothing to type." → "…a way to sign in with what's already on your device."
- :373 "Click the link in your email to continue. The link expires in 15 minutes." → "Your link is on its way. Open it from your email to continue; it stays open for 15 minutes."
- :402 "Don't have an account?" → "New here?"
- :418 "industry-standard protection" — use one honest phrase shared with signup :370

## routes/signup/+page.svelte
- :61 "Please enter your email address" → "Your email address will help us begin."
- :97 "Account creation failed:" → "Your account paused"
- :107 "This email is already registered. Please sign in instead." → "Welcome back. This email already has a space here. You can sign in whenever you're ready."
- :165 "Passkey registration did not finish:" → "Your passkey paused. We can try it again."
- :264 "No passwords required. Ever." → "Your passkey is all you'll use to sign in"
- :310 "Please follow the prompts on your device…" → "Your device will guide you to create your passkey with your fingerprint, face, or PIN."
- :370 "military-grade security" → "end-to-end encryption" (same phrase on login :418)

## routes/auth/verify/+page.svelte
- :18, :53 "This link may have been used already or expired…" → "This link has been used or has rested. A new one is a tap away whenever you're ready."
- :90 "Please wait while we securely log you in" → "Signing you in securely..."
- :127 "Verification Failed" → "This link has finished its job"

## routes/welcome, start, onboarding
- welcome:105-106 "Adding even one trusted person is the most impactful thing you can do today." → "A single trusted person is a lovely place to begin."
- welcome:132 "Your family will thank you for this step" → "This is a gift to the people you love"
- start:86-87, :166 "Bypass the guide and go straight to the Dashboard. Best for returning experts." → "Go straight to your dashboard, if you know your way around."
- start:110 "System Booting" → "Opening your space"
- start:173 "Skip to Dashboard" → "Go to my dashboard"
- start:196 "Your session is now active. I am ready to document…" → "I'm here whenever you'd like to begin."

## routes/settings/data/+page.svelte
- :316-322 "Data Confidence" / "System-wide persistence verification…synchronization truth…" → "Your records, kept safe" / "See what is saved on this device and in your Continuum space."
- :324 "Verify Truth" → "Take a look"
- :362-365 "Validation Suite" / "Generate schematic-compliant data to prove persistence." → "Sample data" / "Add sample entries to see how saving works."
- :369 "Click AGAIN to Confirm" → "Tap again if you'd like to continue"
- :393 "Purge Validation Data" → "Remove sample data"
- :452 "Test Active" → "Sample data shown"
- :645 "Cloud Only" → "Saved online"
- :653 "Unknown" → "Checking"

## routes/tools/ai-audit/+page.svelte
- :133 "AI Completeness Check" → "Plan Check-in"
- :136-137 "Our algorithmic audit scans your entire estate plan for holes, missing documents, and overlooked assets." → "A gentle check across what you've recorded, to see what is well covered and where a little more could help."
- :168 "Audit Score" → "How well covered"
- :208 "Action Items" → "Gentle next steps"

## routes/help/+page.svelte
- :105-107 "These contacts have been verified for quality and reliability." → "Professionals who specialize in estate planning." (unverifiable claim)
- :117 "Frequently Asked Questions" → "Common questions"

## routes/resources/grief-support/+page.svelte
- :232 "You don't have to carry the weight alone." → "You can lean on others as you carry this."
- :296-298 "…please call your local emergency services immediately." → "If you are in danger or facing a medical emergency, please reach out to your local emergency services right away."
- :449 "We haven't found support in that area yet. You might try a nearby city…" → "A nearby city may have more support. We're glad to help you find resources."

## routes/modules/analytics/+page.svelte
- :308 "Systems Optimal" → remove or "All in order"

## routes/admin (admin only)
- health:21 "Deep diagnostics to detect data rot, missing metadata, and security risks." → "A look at how current each record is."
- health:31 "Risk Level" → "Care Level"
- health:51 "Critical Metadata Gaps" → "Records worth a closer look"
- health:59 "All systems nominal. No gaps detected." → "Everything is current."
- health:86 "Records that haven't been updated in over 180 days risk becoming obsolete." → "Records last updated over 180 days ago may need a refresh."
- health:95 "No Zombie Data Detected" → "All records are current"
- health:98 "Timestamp data mock not yet active" → remove
- admin/+page:19-26 "System Administrator… technical command center…'zombie' modules" → "Estate readiness overview"
- readiness:45-47 "Track the completion status of every critical module…" → "See how complete each section is."

## Marketing — lib/stores/marketing2Dictionary.ts (English block ~:21-156; mirror in the other five languages)
- :30 kitchenDesc "…You don't know where anything is… don't even know where they kept the tea." → "After they're gone, you're standing in their kitchen, wishing the answers were in one place."
- :31 kitchenPunchline "That feeling? You can spare your family from it." → "Give them clarity instead."
- :34-36 weight "Someday, someone will need to figure out your life… Unless you leave them something better… they're not alone" → "Someday someone will care for your story. Leave them clarity." / "they have you beside them"
- :40-41 "You don't have to know where to start." / "There's no right order. No required fields." → "Start anywhere you like." / "Any order feels right. Gentle guidance, at your pace."
- :44-48 pulse "You don't have to have the difficult conversation." / "if one day you're not there to check in…" / "Your executor won't face a mystery." → "Let the conversation be gentle." / "…if you ever pause your check-ins…" / "Your executor receives clarity."
- :51-54 "We're not lawyers or financial advisors." / "doesn't write wills" → "We organize what your professionals create." / "Your professionals write the plan; we keep it findable."
- :58-61 "we can't read it, sell it, or share it" / "No data selling" → "Your data stays yours: encrypted, private, and never sold." / "Your data stays yours"
- :69 "Nothing to hunt for." → "Everything where they expect it."
- :77 "There's no deadline here. No pressure." → "Take your time. Come back whenever you wish."
- :98 "Skip anything that doesn't feel right today." → "Leave for later what doesn't feel right today."
- :102 "No complexity. No overwhelm." → "Three gentle steps, at your pace."
- ~:113 "You don't need to learn them all." → "Start anywhere. The guide takes you where you need to go."
- ~:115 "There's more here than you'll ever need." → "There is room here for your whole story."
- ~:135 footerDisclaimer "We do not provide legal, financial, tax, or medical advice." → "Continuum helps you organize; your attorney, financial advisor and doctor guide the advice."
- ~:147 "If you stop, it reaches out…" → "If you pause your check-ins, it reaches out…"

## lib/data/registry.json
- #5 subscriptions "…money your family won't lose to forgotten charges… after you're gone." → "Every subscription you document keeps money with your family. A short list can save them a great deal in the months ahead."
- #7 contacts "…when things go wrong…" → "…who can help when things are hard, and who will carry out your wishes."
