# Implementation Plan: Phase 3 - Grief Support System

## 🕊️ Executive Summary
The **Grief Support System** is the critical infrastructure required to transform Continuum from a utility into a true companion. It provides a sanctuary for users facing loss, terminal illness, or the emotional weight of legacy planning. This system leverages AI-driven empathy, localized resource discovery, and proactive support to ensure no user feels alone in their journey.

---

## 🗺️ 1. Architecture & Strategy

### 1.1 The "Companion" AI Engine
The system will integrate an AI agent specialized in bereavement support, distinct from the logistical AI Concierge.
- **Dynamic Interaction**: Detects emotional distress vs. logistical uncertainty.
- **Resource Prescription**: Proactively suggests specific grief resources based on conversation context (e.g., suggesting "Talking to Children about Loss" when a user adds a minor child to their contacts).
- **Pacing & Protection**: Acts as a "governor" to suggest breaks when the emotional payload exceeds threshold limits.

### 1.2 Country-Aware Localization
Support systems for death and grief are highly culture and region-dependent.
- **Service Mapping**: A structured directory mapped by country code (ISO 3166) to fetch relevant:
    - National Crisis Hotlines.
    - Legal Aid for Probate/Succession.
    - Cultural Tradition Guides.
- **Language Nuance**: Adapting empathetic language based on regional attitudes toward death and mourning (leveraging the `LocalizationEngine`).

### 1.3 Local Support Discovery (Real-time Search)
Integration with external search capabilities to find physical support networks.
- **Geospatial Discovery**: Uses the user's provided residence to find:
    - Nearby Grief Counselors & Therapists.
    - Local Support Groups (e.g., "Grieving Spouses" or "Hospice Care").
    - Death Doulas and End-of-Life Practitioners.
- **Verification Layer**: A system to allow users to "bookmark" or "verify" local resources for their circle of trust.

---

## 🗂️ 2. Core Components

### 2.1 The Grief Support Hub (`/resources/grief-support`)
A high-fidelity destination within the app featuring:
- **Crisis Center**: Instant access to emergency support numbers based on location.
- **The Library**: Curated articles and videos on:
    - Navigating Loss as an Executor.
    - Facing a Terminal Diagnosis.
    - Legacy Letter Writing Prompts.
    - Conversation Starters for "Difficult Discussions".
- **The Practitioner Map**: An interactive search interface for local help.

### 2.2 Proactive Support Modal (Overwhelm Intervention)
Integration with the `OverwhelmDetector` to provide a "safety valve".
- **Trigger Logic**: High-latency on sensitive pages, rapid back-navigation, or sentiment-detected distress.
- **Intervention Options**: 
    - "Take a 15-minute breath."
    - "Switch to a simplified view."
    - "Connect with a counselor."
    - "Continue when you're ready."

---

## 📊 3. Content Inventory & Mapping

| Category | Type | Contextual Trigger |
| :--- | :--- | :--- |
| **Immediate Loss** | Executor Support | Triggered by "Executor Mode" toggle |
| **Terminal Diagnosis** | Owner Support | Triggered by Medical Directive interaction |
| **Grieving Children** | Family Support | Triggered by "Minor Child" contact type |
| **Local Professionals** | Search Directory | Triggered in "Heirlooms" or "Funeral" modules |

---

## 🚀 4. Roadmap & Deliverables

### Phase 3.1: Foundation (The Hub & AI Empathy)
- [ ] Implement the central `/resources/grief-support` layout.
- [ ] Connect the AI Concierge to the "Grief Prescription" logic.
- [ ] Populate the "Crisis Center" with initial data for US/UK/CA.

### Phase 3.2: Enrichment (Discovery & Local Search)
- [ ] Build the Local Search proxy (Backend integration with Tavily/Google).
- [ ] Implement geospatial filtering for practitioners.
- [ ] Create the "Bookmark" system for saving local resources.

### Phase 3.3: Integration (Contextual Links & Overwhelm)
- [ ] Add "Grief Banners" to Executor Toolkit and Funeral modules.
- [ ] Connect `OverwhelmDetector` behavioral signals to the Support Modal.
- [ ] Audit all module headers for "Grief-Friendly" variant rendering.

---

## ✅ 5. Success Criteria
- **Engagement**: Users in 'Executor' role access the Support Hub within their first 3 sessions.
- **Efficiency**: Local search returns relevant results within 5 miles for 90% of user queries.
- **Empathy**: AI interactions never return "NO FLUFF" clinical responses; sentiment analysis confirms 100% warm-tone compliance.
