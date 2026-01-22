# Task List: Phase 3 - Grief Support System Implementation

This document breaks down the **Grief Support System** into actionable tasks for development.

## 🛠️ 1. Support Infrastructure (The Hub)
- [x] **GSS-101: Create /resources/grief-support route**
    - [x] Set up SvelteKit page at `src/routes/resources/grief-support/+page.svelte`.
    - [x] Implement responsive layout with "Warm Technology" aesthetics (glassmorphism, soft gradients).
    - [x] Add "Crisis Center" sticky section with global emergency numbers.
- [x] **GSS-102: Fetch Localized Hotline Data**
    - [x] Create `src/lib/data/hotlines.json` with mapping for US, UK, CA, AU.
    - [x] Implement `hotlineService.ts` to fetch correct numbers based on `localizationStore`.
- [x] **GSS-103: The Library Content Components**
    - [x] Create components for article cards and video embeds.
    - [x] Add categories: "For Executors", "Terminal Illness", "Supporting Children".
- [x] **GSS-104: Professional Counseling Links**
    - [x] Add BetterHelp, Talkspace, Psychology Today links to griefResources.json
    - [x] Add GriefShare, The Dinner Party, Open to Hope support group links
    - [x] Update GriefResourceCard to handle external link types
- [x] **GSS-105: Conversation Starters & Family Guides**
    - [x] Create familyGuides.ts with 4 conversation guides and 6 family guides
    - [x] Create GuideViewer.svelte modal for displaying full guide content
    - [x] Add "Conversations" and "Talking to Family" categories to filter bar
    - [x] Implement guide click handling in grief-support page

## 🤖 2. AI Intelligence Layer
- [x] **GSS-201: Grief Support Agent Configuration**
    - [x] Define the specialized prompt for bereavement support in `src/lib/services/aiGriefService.ts`.
    - [x] Integrate with `aiConciergeService` to allow handover or parallel consultation.
- [ ] **GSS-202: Emotional Pacing Integration**
    - [ ] Connect `OverwhelmDetector` behavioral signals (from `userBehaviorStore`) to the AI Concierge.
    - [ ] Implement "Suggest Break" logic within the AI response flow.
- [ ] **GSS-203: Contextual Resource Injection**
    - [ ] Create a logic layer that allows the AI to "inject" links to the Support Hub based on detected user triggers.

## 🔍 3. Local Search Discovery
- [x] **GSS-301: Backend Search Proxy**
    - [x] Create FastAPI endpoint `POST /api/support/search` in `backend/routers/support.py`.
    - [x] Integrate with Tavily Search API to find "Grief Counselors near [Location]".
- [ ] **GSS-302: Service Category Mapping**
    - [ ] Implement mapping between user module activities and search categories (e.g., Funeral Planner -> Local Funeral Directors).
- [x] **GSS-303: Practitioner Directory UI**
    - [x] Build search results list with interactive maps and "Bookmark to Circle of Trust" functionality.

## 🎨 4. Contextual UI & Polish
- [x] **GSS-401: Grief Banner Components**
    - [x] Create a reusable `GriefSupportBanner.svelte` component.
    - [x] Add it to the top of: `Executor Toolkit`, `Funeral Planner`, `Medical Directives`, and `Legacy Letters`.
- [x] **GSS-402: Role-Aware Page Variants**
    - [x] Ensure every module header from the `MASTER_TODO` audit (Issue #12) renders its "Grief-Friendly" variant when `userRole` is 'Executor'.
- [ ] **GSS-403: Persistence & Bookmarking**
    - [ ] Update `executorStore` to track saved/bookmarked practitioners and resources.

## ✅ Verification & Testing
- [x] **GSS-501: Local Search Accuracy Check**
    - [x] Verify search returns valid results for major cities (New York, London, Toronto).
- [x] **GSS-502: Overwhelm Trigger Test**
    - [x] Simulate rapid back-navigation to verify intervention modal appears.
- [x] **GSS-503: Role-Switch Verification**
    - [x] Confirm app-wide tone shift when switching from 'Owner' to 'Executor'.
