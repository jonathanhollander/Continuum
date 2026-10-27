# T0a — Tone review: legacy and letters

**Last Updated:** 2026-10-26 08:20 EST

Read-only (card T0). Format: `line | current | suggested`. Paths relative to `frontend/src/`. Roles: planner (P), executor (E), family (F). No separate obituary/memories/ethical-will routes — those live in funeral/FuneralWizard and legacy-journal/EthicalWill.

Cross-cutting: shared cancel "Not right now" → "Maybe later" (owner rule bans "not"); raw "Cancel" → "Maybe later".

## routes/modules/legacy-journal/+page.svelte
- :81 sample "…lessons I learned weren't in school." → "…lessons I learned were beside Mom in the kitchen."
- :86 sample "hard work isn't just about the outcome..." → "hard work has always been about more than the outcome..."
- :198 "Without a place to write them down, precious memories fade and wisdom goes unshared." → "A place to write them down keeps precious memories close and shares your wisdom."
- :206 "Go to Timeline to Add" → "Add on your Timeline"
- :219 "Add Value" → "Add a value"
- :311 "Without writing them down, these precious moments may fade with time." → drop; keep "Your reflections become a legacy."
- :322 "Need inspiration? Click an example below to get started:" → "Here are a few examples to spark an idea:"
- :341 `No reflections match "{q}"` → `Showing reflections that match "{q}"` (empty body)
- :502 "…there's no right or wrong way to share…" → "Take your time. Share what is in your heart in your own way."
- :568 "Not right now" → "Maybe later"

## routes/modules/letters/+page.svelte
- :119 "The letter content appears to be empty. Please go back and try again." → "Your letter is waiting for its first words. Go back whenever you're ready."
- :389 generated fallback "Don't make the same mistake I did—or if you do, forgive yourself quickly." → "Be as gentle with yourself as I would be with you."
- :463 "…when you're no longer here to say them yourself… moments you can't physically attend." → "…These letters become your voice across time, present at the moments that matter."
- :821 "Provide the specific details to populate your formal..." → "Share a few details and we'll fill in your formal letter."
- :839 placeholder "Enter {variable}..." → "Share {variable}..."
- :930 "(Empty draft - please go back and fill in the form)" → "Your draft will appear here once you've shared a few details."
- :948 "Required Documents" → "Documents that may help"
- :1249 "Not right now" → "Maybe later"

## lib/components/modules/letters/LetterAssistant.svelte
- :159-160 "Adjusting the slider will rewrite your current draft…" — **false**: `handleRefine` (:40) never reads `sentimentValue`; only "Polish & Soften" rewrites. → "When you choose Polish & Soften, we'll offer a gentler version of your draft, and your words stay yours to keep or change." Remove the dead slider or wire it (→ X).
- :166 "Empathy Engine" → "Gentle Helper" (optional)

## lib/data/letterTemplates.ts (executor; followUp shown on screen)
- :41 "If no response within 5 business days, call..." → "After 5 business days, a call to the bank's estate services department can help."
- :44, :215, :238 titles "Credit Card Cancellation", "Utility Transfer/Cancel", "Subscription Cancellation" → "Closing a Credit Card", "Utility Transfer or Closure", "Closing a Subscription"
- :65 "Stop automatic payments immediately..." → "When you're ready, pause automatic payments and let merchants with recurring charges know."
- :89 "...to prevent policy cancellation." → "...to keep the policy in place."
- :113 "...Request account freeze to prevent trades during probate." → "Ask for an account freeze to protect the account during probate."
- :140 "...Return any benefits received after death immediately." → "...Any benefits received after the date of passing will need to be returned when you can."
- :161 "Final 1040 due April 15 of year after death. Estate tax return (Form 706) due 9 months after death if required." → "Final 1040 is due April 15 of the year after. Form 706 is due 9 months after, where it applies. Your CPA can help with the dates."
- :235 "Don't disconnect utilities if property is being shown…" → "Keep utilities on while the property is being shown or maintained."
- :278 "...must be done in person at a post office." → "...is arranged in person at a post office."
- :304 "Contact HR within 30 days. COBRA election must be made within 60 days…" → "HR can walk you through the 30 and 60 day windows for COBRA."
- :400 "Secure the property immediately and change locks if necessary (and legal)..." → "When you can, secure the property and, where appropriate, change the locks."
- :412 "They don't expose everything—just the essentials." → "They open only the essentials."
- :419 "Ensure all family members know..." → "It helps when family members know..."
- :433 "Please keep this document extremely secure..." → "Thank you for keeping this document somewhere safe, as it opens the whole estate plan."
- :483 "...any current deadlines or urgent actions required." → "...any upcoming dates the estate should know about."
- :508 "We request that you do not send further correspondence to the primary residence." → "Please direct all further correspondence to the Estate Address below."
- letter bodies :53, :65, :245, :400, :526 "immediately" → "at your earliest convenience"
- keep registry names "Deceased - Do Not Issue Credit" (:198), "Deceased Do Not Contact" (:265) — industry terms

## routes/modules/time-capsule/+page.svelte
- :787 "Cancel" → "Maybe later"

## routes/modules/visual-memories/+page.svelte
- :346 "Cancel" → "Maybe later"
- :439-440 "Select Items" / "Done Selecting" → "Choose items" / "Finished choosing"
- :550 "may not even know exist… could be lost forever… These aren't just files…" → "Your family's photos and videos live in many places. iCloud, Google Photos, Dropbox, old hard drives, Facebook albums each hold irreplaceable memories. Listing where they live helps your family find the visual story of your life: birthdays, vacations, quiet moments, family history."

## lib/components/modules/visual-memories/
- BulkActionBar.svelte:53 placeholder "Enter tag..." → "Add a tag..."
- BulkActionBar.svelte:95 title "Clear Selection" → "Start over"
- MemoryGallery.svelte:348 "No description provided." → blank, or "A memory waiting for its story."
- lib/stores/visualMemoryStore.svelte.ts:187 "We couldn't find that memory to save. It may have been moved — please refresh…" → "That memory has moved. Refresh whenever you're ready and it will be here to save."

## routes/modules/heirlooms/+page.svelte
- :221 "Unknown Treasure" → "Untitled treasure"
- :309 and :367 "Objects without stories become 'stuff'… Without its story documented… you're not just making a list… when you can't tell them anymore." → "Every object holds a story. That watch your grandfather wore every day, your wedding dress, the painting your mother loved. When you record their stories, you keep the emotional value that makes them irreplaceable, and your family will carry those stories forward."
- :674 "Not right now" → "Maybe later"
- components: VisionUploader.svelte:110 "Drag photo here or click to upload" → "Add a photo by dropping it here or choosing one"; :82 title "Change Image" → "Choose a different photo"; HeirloomCard.svelte:92 "SENTIMENTAL" → "TREASURED"

## lib/components/modules/legacy-journal/
- AccomplishmentsGallery.svelte:101 "Go to Timeline to Add" → "Add on your Timeline"
- AccomplishmentsGallery.svelte:105 "No matches found. Try clearing filters." → "Clear the filters to see everything you've gathered."
- AccomplishmentsGallery.svelte:142 "No description provided." → blank
- EthicalWill.svelte:23 "Doing the right thing, even when no one is watching." → "Doing the right thing, whoever is watching."
- EthicalWill.svelte:24 "Keep learning and asking questions." → "A love of learning and asking questions."
- EthicalWill.svelte:25 "Everyone is fighting a battle you know nothing about." → "Everyone carries something unseen."
- EthicalWill.svelte:26 "What matters is how you get up after a fall." → "What matters is how you rise after a fall."
- LifeLessons.svelte:327 "...before it fades." → "...to keep it close."

## routes/modules/funeral/+page.svelte
- :77 native `prompt("Enter song name (Artist - Title):")` → in-page input labelled "Share a song (Artist - Title)"
- :199 "Embalming & Prep" → "Embalming and preparation"
- :203 "Transfer of Remains" → "Transport of your loved one"
- :376 "Come back to this when you're ready. There's no rush." → "Come back to this whenever you're ready."
- :443 "…over the national average." → "…above the national average."
- :550 "Update This Detail" → "Refine this detail"
- :603 "Save Expense" → "Save this detail"

## lib/components/modules/funeral/FuneralWizard.svelte
- :241 "Select the tradition that best honors your life and values." → "Choose the tradition that feels closest to your life and values."
- :298-299 "Decisions regarding the preparation and resting place of the body." → "Your wishes for your final resting place."
- :356 badge "Typically Forbidden in {tradition}" → "Many {tradition} families choose burial." (colour → V)
- :360 "Process of reducing the body to ashes/fragments." → "A gentle return to ashes, held in an urn or scattered."
- :543 native `prompt("Add Song (Artist - Title):")` → in-page input "Share a song (Artist - Title)"
- :648 "Next Step" → "Continue"

## lib/data/funeralTraditions.ts
- :64 "No flowers (Charity instead)" → "Charity gifts in place of flowers"
- :72 "Prompt Burial (24h)" → "Burial within 24 hours"
- :89 "Garlanding the Body" → "Garlanding your loved one"

## routes/modules/funeral/traditions/[type]/+page.svelte
- :64 "Checklist Items" → "Things to consider"
- :93 "Tradition not found" → "Choose a tradition to see its details"

## lib/components/media/VideoRecorder.svelte
- :51 "Camera access denied. Please verify permissions." → "The camera is waiting for your permission. You can turn it on in your browser settings."
- :158 "Camera Error" → "Your camera needs a moment"
- :239 "Retake" → "Record again"
