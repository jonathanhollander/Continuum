# T0d — Tone review: Pulse and guardian pages

**Last Updated:** 2026-10-26 08:13 EST

Read-only review (card T0, decision 17). Format: `line | current | role | suggested`. Paths relative to `frontend/src/`. OWNER = planner; GUARDIAN = trusted contact on a token link.

Clean: `ThePulse.svelte`, `PetalDrift.svelte`, `LivingMesh.svelte`, `pulseTiers.ts`, `digitalGuardianStore.svelte.ts`, `modules/pulse/+layout.svelte`. `/pulse` now redirects, so the old `/pulse` seeds (X65) are gone.

**Highest:** pulse :176 "Seeking Connection", :98 "EXPIRED", safety-timer card (:239, :246, :278, :283-284); contacts :21 "if you fail to check in"; settings :117 raw alert "See console"; vault :100 "permanent"; verify :94-95 "systems are nominal", :68 "Error"; respond :37 "Invalid responder token"; history :154; messages :187, :196, :296. Then guardian-facing negatives (respond/portal "hasn't checked in", portal :239-244, :113, "Link Inactive").

## routes/modules/pulse/+page.svelte (owner)
- :98 | "EXPIRED" | "Your check-in time has arrived"
- :144 | "Synching..." | "Letting them know..."
- :152 | "Verified" | "Received, thank you"
- :176 | "Seeking Connection" | "Your check-ins are paused"
- :239 | "Immediate Escalation on Zero" | "Your circle is told when the timer ends"
- :246 | "Cancel Monitoring" | "I'm safe, end timer"
- :258 | option "Meeting stranger" | "Meeting someone new"
- :278 | "Activate Immediate Guard" | "Begin the timer"
- :283-284 | "Activate high-frequency monitoring for short durations. Notifies responders immediately if expired." | "Share a short walk or visit with your circle. If the time passes, the people you chose are gently told."
- :290 | "Start Safety Timer" | "Begin a safety timer"
- :313-314 | "View heartbeats and notes sent from your Guardians." | "Read the notes and check-ins from your guardians."
- :344 | "Visualize exactly what data your guardians can see and when." | "See what your guardians can see, and when"
- :350 | chip "Secure Disclosure" | "What is shared"

## routes/modules/pulse/contacts/+page.svelte (owner)
- :15 | "Back to Dashboard" | "Back to Wellness Check-in"
- :21 | "These are the people Continuum will contact if you fail to check in." | "These are the people Continuum will reach out to when a check-in has been quiet for a while."
- :22 | 'Use the "Escalation Plan" to configure when they are contacted.' | "In the Escalation Plan you choose how long Continuum waits before each group is contacted."

## routes/modules/pulse/escalation/+page.svelte (owner)
- :10 | "Escalation Plan" | "Who is told, and when"
- :21-22 | "Configure the Action Tiers. Determine how long Continuum waits…" | "Choose how long Continuum waits before reaching out to each group of your guardians."

## routes/modules/pulse/history/+page.svelte (owner)
- :62 | "Filter By:" | "Show:"
- :144 | "Verified" | "Received"
- :154 | "No check-in history found." | "Your check-ins will gather here."

## routes/modules/pulse/messages/+page.svelte (owner)
- :127 | "Bi-directional contact notes." | "Notes between you and the people you trust."
- :187 | "No messages yet" | omit, or "Say hello whenever you like"
- :196 | "No Pulse contacts yet" | "Your circle will appear here"
- :201-202 | "Add trusted contacts in Pulse Settings first. They'll appear here once you can message them." | "When you add trusted contacts in Pulse Settings, they will appear here."
- :267 | "Automated System Log" | "A gentle note from Continuum"
- :275 | "{msg.attempts} attempts" | "Sent {n} times"
- :296 | "No conversation history. Start chatting below." | "Write the first note below whenever you're ready."
- :313 | placeholder "Type a secure note..." | "Write a note for them..."
- :330 | "Select a conversation to view secured notes." | "Choose a person to read your notes together."

## routes/modules/pulse/settings/+page.svelte (owner)
- :117 | `alert("Could not register biometric device. See console.")` | notification: "Let's try setting up your device again in a moment."
- :129 | "Pulse Configuration" | "Your Check-in Settings"
- :146 | "Enable the automated wellness check-in system." | "Turn on gentle wellness check-ins."
- :176 | "Escalation Protocol" | "Who we reach out to"
- :218 | "Ghost Mode" | "Rest Mode"
- :224-225 | 'Pause all alerts for 7 days. Your inner circle receives a "Status: Resting" notification without an alert trigger.' | "Rest for 7 days. Your circle is told you are resting, and alerts wait until you return."
- :246-247 | "Deactivate" / "Activate (7 Days)" | "Return from rest" / "Rest for 7 days"
- :257 | "Vault Integration" | "Notes for your guardians"
- :261-262 | "Automatically decrypt specific files and instructions for your Guardians when an escalation Tier exceeds 24 hours." | "Share the notes you chose with your guardians once the quiet has lasted more than 24 hours."

## routes/modules/pulse/transparency/+page.svelte (owner)
- :54 | "Active (Normal)" | "Active"
- :93, :113 | "Exact Location", "Vault Access Codes", "Vault (If locked to Tier 4)" status | "Kept private for now"
- :105 | "Medical Directives (DNR)" | "Your medical wishes"
- :122 | "Tier N: Escalation" | "Tier N"
- :123 | "T + {n} Hours" | "After {n} hours"
- :144 | "Data Transparency" | "What your guardians can see"
- :236 | red badge "Critical" | "Shared last" (→ V0 for the red)
- :254 | "Still Encrypted" | "Kept private"
- :277 | "Loading Transparency Data..." | "Gathering this for you..."

## routes/modules/pulse/vault/+page.svelte (owner)
- :100 | "Remove these instructions from the vault? This action is permanent." | "Remove these instructions from your vault? You can add them again whenever you like."
- :149 | "Digital Dead-Drop Protocols" | "Notes for your guardians"
- :180 | "Stop editing" | "Set this aside"
- :195 | "Unlock At" | "Share with"
- :203-207 | "Tier 1 (Immediate Partners)", "Tier 3 (Local/Emergency)" | "Tier 1 (closest partners)", "Tier 3 (nearby help)"
- :218 | placeholder "The instructions to reveal..." | "What they should know..."
- :378 | "Secrets that reveal themselves when needed" | "Notes kept ready for when they are needed"
- :384-385 | "…things your trusted contacts only need access to in an emergency." | "…things your trusted contacts will be glad to have if something happens."
- :398 | "Add protocols using the form above. They'll appear here once saved." | "Notes you save in the form above will appear here."

## routes/pulse/respond/[token]/+page.svelte (guardian)
- :37 | "Invalid responder token." | "This link has rested. {Name}'s family or executor can share a fresh one."
- :87 | "Pulse Alert Response" | "Checking in on {name}"
- :108 | "Link Inactive" | "This link has rested"
- :121 | "Action Confirmed" | "Thank you, it's recorded"
- :146 | "Hasn't checked in for a little while" | "It has been quiet for a little while"
- :158 | "{name} hasn't checked in yet." | "We're waiting to hear from {name}."
- :179 | "I've confirmed they are OK" | "I've spoken with {name} and they're well"
- :198 | "Acknowledged" | "I've seen this"
- :201 | "I am aware and coordinating check-in" | "I'm looking in on them"

## routes/pulse/verify/[token]/+page.svelte (owner, from check-in email)
- :29 | "Invalid or expired link." | "This link has rested. You can check in from your Wellness Check-in page any time."
- :32 | "Connection timeout. Please verify you are online." | "Let's try again in a little while."
- :58 | "Sending Signal..." | "Letting your circle know..."
- :60 | "Verifying your secure heartbeat link." | "Opening your check-in."
- :68 | "Error" chip | remove
- :70 | "Link Inactive" | "This link has rested"
- :87 | "Confirmed" | "Received"
- :90 | "Signal Received" | "Thank you, we have you."
- :94-95 | "Your wellness has been recorded. Your Guardians have been notified that all systems are nominal." | "Thank you for letting us know. The people you trust know you are well."
- :110 | "Next Pulse in 48h" (hard-coded) | "Your next gentle check-in is in about {n} days" — read the owner's frequency (→ X if wrong)

## routes/pulse/portal/[token]/+page.svelte (guardian)
- :46 | "Invalid or missing token." | "This link is incomplete. {Name}'s family or executor can share a fresh one."
- :67 | "…The person who shared it can send you a new one." | "…{Name}'s executor or family can share a new one."
- :113 | "This link isn't active" | "This link has rested for now"
- :157-158 | "Hasn't checked in for a little while" | "It has been quiet for a little while"
- :166 | "No check-ins yet" | "Waiting for the first check-in"
- :183-184 | "…A hug or a quick hello from you may help." | "A hug or a hello from you may mean a lot."
- :186 | "{name} hasn't checked in yet." | "We're waiting to hear from {name}."
- :216 | "Acknowledge Status" | "Let them know I've seen this"
- :239-240 | "{name} hasn't left any notes here for you yet." | "Notes from {name} will appear here."
- :242-244 | "…There's nothing you need to do right now." | "Notes from {name} will appear here when they are needed. You are welcome to simply be present for now."

## lib/components/modules/pulse/GuardianPicker.svelte (owner)
- :83 | "Select Guardian" | "Choose a guardian"
- :109 | "Go to Family & Contacts" | "Add someone in Family & Contacts"
- :166 | "Confirm Guardian" | "Add them to my circle"
- :178 | "Manage Global Contacts" | "Open Family & Contacts"

## lib/components/modules/pulse/PulseContactsManager.svelte (owner)
- :75 | `alert(gentleRetry)` | use the notification store (copy fine)
- :154 | "Escalation Protocol" | "Who we reach out to"
- :161 | "Individual Nudge Settings Active" | "Personal timing set"
- :191 | "Loading Protocols..." | "Gathering your circle..."
- :201 | "Initialize Protocols" | "Set up your circle's plan"
- :215-221 | "Build Your Circle" / "Add your first Trusted Contact to start protecting your legacy." | "Choose the first person you trust, whenever you're ready."
- :227 | "Add First Guardian" | "Add a guardian"
- :326 | "+{n}h default" | "{n} hours by default"
- :384-385 | "Custom Delay (h)" | "Personal wait (hours)"
- :401 | "Overrides Tier" | "Used instead of the tier's wait"
- :423-424 | "Active Responder" / "Standard Only" | "Told when I start a timer" / "Told only if I'm quiet"

## routes/modules/digital-guardian/+page.svelte (owner)
- :398 | "Protect your digital legacy from being locked away forever" | "Keep your digital legacy within your family's reach"
- :399 | "…so your family isn't locked out of your photos, emails, and accounts." | "…so your family can reach your photos, emails, and accounts."
- :400 | "Without these specific setups, your family may lose access … Taking action now ensures …" | "With these set up, your family can reach your photos, accounts and memories, whenever the time comes."
- :470-471 | "Hope is not a strategy. Verify that your Legacy Contact can actually get in when you aren't there to help." | "Walk through it once with your Legacy Contact, so getting in is simple when it matters."
- :648-649 | "Allow someone to access your Apple account data after you pass away." | "Choose someone who can reach your Apple account data when you're gone."
- :745 | 'Google acts as a "Dead Man's Switch". If you don't log in for X months, it notifies your contact.' | "Google can notify your chosen contact after a period of no sign-ins that you choose."
- :816 | "Ensure your executor has access..." | "Make sure your executor can reach..."
- :832 | "Do NOT store your Master Password digitally." | "It is safest to keep your Master Password on paper, in your Red Binder."
- :851-852 | "Write the Master Password on it (it is usually blank)." | "You can write the Master Password on it."
- :855 | 'Seal it in an envelope marked "For Executor Only".' | 'You can seal it in an envelope marked "For Executor".'
- :923 | 'Alternatively, select "Delete After Death".' | 'Or you can choose "Delete After Death".'
- :980 | "LinkedIn does not allow pre-selection. Your executor must contact them." | "Your executor can contact LinkedIn when the time comes."
- :994-995 | "Executor will need: Link to obituary or death certificate." | "Your executor will have a link to the obituary or the death certificate ready."
