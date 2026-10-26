# T0f — Tone review: emails and backend messages

**Last Updated:** 2026-10-26 08:11 EST

Read-only review (card T0, decision 17). Rule: no negatives (not/isn't/no/yet/don't/won't/couldn't), no demands, no clinical or alarm language. Format: `line | current | who receives it | suggested`. Paths from repo root.

**Priority:** tier 3 and tier 4 escalation emails → `base.html` footer → `errors.py` → auth/pulse token messages guardians see. Model the rewrites on `pulse_safety_timer.html` (already the best-toned template).

## backend/templates/emails/base.html (every recipient)
- :10-11 | header "Digital Guardian System" | "Continuum" + a quiet line such as "Here with you."
- :21 | "This is an automated message from Continuum Pulse." | "A message from Continuum Pulse, sent with care."
- :23 | "User ID: {{ user_id }}" | remove
- :29 | "…sent only when configured by you or when your designated guardians need to be alerted." | "These notifications are sent when you set them up, or when a guardian's care is called for."

## magic_link.html (anyone signing in)
- :8 | "Click the button below to securely access your digital estate" | "Whenever you're ready, this button opens your Continuum space:"
- :11 | "Sign In Securely" | "Open my space"
- :22 | "If you did not request this link, you can safely ignore this email." | "If someone else typed your address, leaving this email alone keeps your space closed."
- :22 | "Security Notice: … can only be used once" | "Security note: this link opens once and rests after 15 minutes."
- :26 | "we recommend setting up passkey authentication" | "Whenever you like, you can add a passkey in settings for an even gentler way in."
- subject `services/email_service.py:348` "Your Secure Continuum Login Link" | "Your way back into Continuum"

## welcome.html (new user)
- :6 | "Your Digital Legacy is Now Protected" | "Welcome. Your space is ready."
- :8 | "…protecting what matters most." | "…caring for what matters most."
- :11 | "Go to Your Dashboard" | "Open my space"
- :16-22 | "What's Next?" + numbered Set Up/Add/Upload/Enable | heading "When you're ready"; each item an invitation ("You might begin with your Pulse …")
- :25 | "Privacy First: … only accessible by you and your designated guardians under specific conditions" | "Your data is encrypted and open to you and to the guardians you choose, on the terms you set."
- :28-34 | "Key Features:" | "What's here for you"
- :39 | "…peace of mind, not pressure." | "Take your time setting up your account. This is about peace of mind."
- :43 | "Questions? Visit our help center or reply to this email." | "We're glad to answer anything; just reply to this email."
- subject `email_service.py:404` "Welcome to Continuum - Your Digital Legacy is Protected" | "Welcome to Continuum"

## pulse_escalation_tier1.html (guardian)
- :6, :9 | "Welfare Check Notification", "Tier 1 Alert: Standard wellness check-in" | "A gentle check-in about {{ user_name }}"; drop "Tier 1 Alert"
- :12 | "We have not received a scheduled check-in from … within their standard timeframe" | "{{ user_name }}'s scheduled check-in is still waiting for them."
- :14 | "…you can reset the timer by confirming their wellbeing" | "If you've spoken with them lately, you can let us know through the Guardian Portal."
- :24 | "no immediate action required" | "There is room to take this at your own pace."
- :26 | "Simply confirming recent contact will reset the wellness timer" | "Confirming recent contact resets the timer."
- subject `email_service.py:375` "Standard Welfare Check" | "A gentle check-in about {name}"

## pulse_escalation_tier2.html (guardian)
- :6, :9 | "Level 2 Wellness Escalation", "Extended period without contact" | "A closer look at how {{ user_name }} is doing"; "It has been a while since we heard from them."
- :12 | "has missed their standard check-in window by a significant margin. This is an escalated notification." | "{{ user_name }}'s check-in is running later than usual."
- :14 | "Recommended Action: Please attempt to contact them directly" | "If you can, a call, text or visit would be kind."
- :31-34 | imperative list ("Check social media …", "Use the Guardian Portal to reset the timer") | rephrase as "You might …"
- :38 | "please update the status … additional escalation tiers are available." | "If you reach them, a note in the Guardian Portal lets us rest. If you feel worried, the portal can bring in the next circle of people."
- subject :376 "Level 2 Escalation" | "Checking in on {name}"

## pulse_escalation_tier3.html (guardian — highest harm)
- :6 | "URGENT: Tier 3 Medical/Legal Release" | "{{ user_name }}'s medical and legal information is now open to you"
- :9 | "Critical information has been unlocked" | "Important information is now available to you"
- :12 | "This is an urgent escalation … We have been unable to confirm their wellbeing" | "{{ user_name }}'s check-ins have gone quiet for longer than we hoped, and you are one of the people they trusted."
- :14 | "CRITICAL INFORMATION NOW ACCESSIBLE:" | "Now available to you:"
- :19 | "Legal documents requiring immediate attention" | "Legal documents they wanted you to have"
- :23 | "Access Critical Information" | "Open what {{ user_name }} left for you"
- :28-34 | "Recommended Actions" with bold commands ("Review … immediately", "Attempt physical welfare check", "Contact local authorities") | "When you're ready, here are some steps that may help"; drop "immediately"
- :37 | "Important: … make informed decisions" | "This access is here to help you care for {{ user_name }}."
- :41 | "if they become incapacitated" | "if they could not act for themselves"
- :45 | "If this alert was triggered in error … please update immediately to prevent further escalation." | "If you've heard from {{ user_name }}, tell us through the Guardian Portal and everything settles back."
- subject :377 "URGENT - Medical/Legal Release" | "{name} may need you; important information is open to you"

## pulse_escalation_tier4.html (guardian — likely after a death)
- :6 | "EMERGENCY: Full Vault Access Granted" | "{{ user_name }}'s vault is now open to you"
- :9 | "Tier 4 EMERGENCY: Complete digital estate access activated" | "Everything {{ user_name }} saved for you is now available."
- :13 | "highest level of escalation … Extended attempts to confirm their wellbeing have been unsuccessful." | "{{ user_name }} chose you to have access to everything they saved. We are so sorry if this reaches you in a hard moment."
- :16 | "FULL ACCESS NOW GRANTED TO:" | "Now open to you:"
- :27 | "Access Complete Vault" | "Open what {{ user_name }} left for you"
- :32 | "IMMEDIATE ACTIONS REQUIRED:" | "When you feel ready"
- :34-38 | "Verify … contact authorities if you have not already", "Secure critical accounts", "Follow documented procedures" | optional steps ("You might begin by …"); remove "if you have not already"
- :42-44 | "Legal and Ethical Responsibility … All information must be used solely …" | "{{ user_name }} trusted you with this, and honoring their documented wishes is the best way to care for it."
- :55 | "If this is a false alarm: … please immediately reset the system" | "If you've heard from {{ user_name }}: we're so glad. Let us know in the Guardian Portal and the vault closes again."
- :59 | "If you need assistance … contact our support team." | "We're here if you'd like help; reply to this email."
- subject :378 "EMERGENCY - Full Vault Access" | "{name}'s vault is open to you"

## pulse_safety_timer.html (guardian)
- :8 | "it has now run out without being stopped" | "the timer finished and was left running."
- :10 | "This may simply mean they forgot to stop it. … a quick call or message" | "This may mean they forgot to stop it. … a call or message"

## backend/errors.py (compassionate messages, every role)
- :88 | "We couldn't verify your identity. Please try signing in again." | "Let's try signing in again together."
- :101 | "You don't have permission to access {resource}. If you believe this is an error, please contact support." | "This {resource} belongs to another account. If you think it should be yours, we're here to help."
- :114 | "Your session has expired. Please sign in again to continue." | "Your session rested. Sign in again whenever you're ready."
- :131-132 | "We couldn't find that {resource_type}. It may have been moved or deleted." | "That {resource_type} may have been moved."
- :147, :149 | "This {resource_type} already exists." | "You already have this {resource_type}."
- :172 | "Please check the {field} field. {reason}" | "Let's look at {field} together. {reason}"
- :189 | "We encountered an issue with your request. Please try again or contact support." | "Something unexpected happened. Try once more whenever you're ready, or reach out."
- :208 | "We're having trouble saving your changes right now…" | "Saving is taking a moment. Your words are kept here; try again shortly."
- :227 | "We couldn't send that email right now…" | "That email is waiting its turn and we'll send it again soon."
- :244 | "We're having trouble connecting to {service_name}…" | "{service_name} is taking a moment. Try again shortly."
- :263 | "We couldn't upload your file. {reason}" | "This file paused on its way up. {reason}"
- :283 | "This file is too large … Please choose a file under X MB." | "This space holds files up to X MB. A smaller copy will fit."
- :300 | "This file type isn't supported. Please use one of: …" | "This space keeps these file types: …"
- :323 | "You're doing that too quickly…" | "Let's pause for a moment. We'll be ready again in N seconds."
- :355 | "Something went wrong. Please try again." | "Something unexpected happened. Try again whenever you're ready."
- :367 | "We encountered an unexpected issue. Our team has been notified…" | "Something unexpected happened, and our team knows. Try again whenever you're ready."

## backend/csrf.py
- :165 | "We couldn't confirm this request came from your session. Please refresh the page and try again." | "Refreshing the page will bring things back; then try again whenever you're ready."

## backend/routers/auth.py
- :79 | "Could not validate credentials" | "Let's sign in again."
- :165, :306 | "Email already registered" | "This email already has a space. Signing in will take you there."
- :266 | "Incorrect email or password" | "Let's check the email and password together."
- :350, :506, pulse.py:588 | "Challenge expired or not found" | "That passkey step paused. Start it again whenever you're ready."
- :512 | "Missing credential ID" | "We need the passkey once more; try again."
- :517 | "Credential not found" | "Let's try your passkey again, or sign in another way."
- :534, :567 | "Authentication failed" | "Let's try that again together."
- :677 | "Invalid token type" | "Let's sign in again."
- :683, :696, :713, :734 | "Invalid or expired token" | "This link has rested. A fresh one is a click away from the sign-in page."
- :688 | "User not found" | "Let's check the email you used."
- :752 | "Invalid or expired refresh token" | "Your session rested. Please sign in again."
- :431, pulse.py:631 | `detail=str(e)` | raw exception text reaches users — wrap in a gentle message
- :203 | "Your account is ready! Email was saved locally (development mode). Check backend/outbox/ …" | development-only text; keep it to development or reword
- :221 | "…but we couldn't send the welcome email. You can still log in…" | "Your account is ready. Your welcome email is taking a moment, and signing in works now. We're here if you'd like help."
- :595, :658 | "If this email is registered, you will receive a magic link" | "If this email has a space, a sign-in link is on its way."
- :782, :785 | "Logged out successfully" | "You're signed out. Take care."
- :796 | "Logged out from all devices (N sessions revoked)" | "You're signed out everywhere."

## backend/routers/pulse.py and pulse_logic.py
- :277, :320, :349, :440, :469, :525 "Invalid portal token"/"Invalid token"; :279, :322, :351, :442, :471 "Token expired" | guardian | "This link has rested. The person who shared it can send a fresh one."
- :220, :233, :374 "Contact not found"; :415, :424 "Item not found"; :555 "Tier not found" | owner | "That {thing} may have been moved."
- :457 | "Thinking of you! Just sending a quick nudge." | "Thinking of you."
- pulse_logic.py:222, :227, :232, :384 | "[System Alert Tier N] Escalation notification sent via email" / "…We couldn't deliver this alert to {name}." | "A tier N alert reached {name}'s inbox." / "Tier N: {name}'s alert is waiting to be sent again." — :232 is a prefix matched by code; change both together

## Other routers
- contacts.py:102,116 "Contact not found", :150 "Relationship not found"; medical.py:102,119 "Directive not found"; memories.py:43,58,105,119,166,180 "… not found" | "That {thing} may have been moved."
- estate_data.py:248 "Could not create field definition", :363 "Could not create item: {str(e)}", :436 "Could not update item", :475 "Could not delete item" | "Saving that paused; try again whenever you're ready." (:363 also leaks raw text; "delete" → "remove")
- estate_data.py:255,388,392,453,457 "… not found" | "That item may have been moved."
- estate_data.py:257,390,455 "Not authorized" | "This belongs to another account."
- estate_data.py:272,311,383,448 "Invalid type: {data_type}" | "Let's pick one of the kinds this space keeps."
- estate_data.py:359,433 `detail=str(e)` | wrap
- recipient.py:49 FOUND_NOTHING "We couldn't find that person…" | "That person may have been moved."
- support.py:83 "Local discovery service temporarily unavailable." | "Local support search is taking a moment. Try again shortly." Also :41, :47 mock content ("Every Saturday morning") reaches users when the key is missing — misleading in a grief-support list (→ G0)
- media.py:374 "Metadata updated" | "Saved."
- email.py:200 "This email was already sent successfully" | "This email has already reached them." (admin; low)
- main.py:488 "API endpoint not found" | "That address may have moved"; :511 "Access denied" | "That page is kept private." (low)
- ai_proxy.py:23-24 "AI help isn't available right now…" | "AI help is resting right now. Everything else is here for you, and you can come back whenever you're ready."
- ai_proxy.py:62 "That assistant isn't one we offer." | "This space offers a different assistant; we'll use that one."

Note: the backend holds no AI concierge or grief system prompts; those live in the frontend.
