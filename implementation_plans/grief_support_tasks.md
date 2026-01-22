# Task List: Phase 3 - Grief Support System Implementation

This document breaks down the **Grief Support System** into actionable tasks for development.

## 🛠️ 1. Support Infrastructure (The Hub)
- [ ] **GSS-101: Create /resources/grief-support route**
    - [ ] Set up SvelteKit page at `src/routes/resources/grief-support/+page.svelte`.
    - [ ] Implement responsive layout with "Warm Technology" aesthetics (glassmorphism, soft gradients).
    - [ ] Add "Crisis Center" sticky section with global emergency numbers.
- [ ] **GSS-102: Fetch Localized Hotline Data**
    - [ ] Create `src/lib/data/hotlines.json` with mapping for US, UK, CA, AU.
    - [ ] Implement `hotlineService.ts` to fetch correct numbers based on `localizationStore`.
- [ ] **GSS-103: The Library Content Components**
    - [ ] Create components for article cards and video embeds.
    - [ ] Add categories: "For Executors", "Terminal Illness", "Supporting Children".

## 🤖 2. AI Intelligence Layer
- [ ] **GSS-201: Grief Support Agent Configuration**
    - [ ] Define the specialized prompt for bereavement support in `src/lib/services/aiGriefService.ts`.
    - [ ] Integrate with `aiConciergeService` to allow handover or parallel consultation.
- [ ] **GSS-202: Emotional Pacing Integration**
    - [ ] Connect `OverwhelmDetector` behavioral signals (from `userBehaviorStore`) to the AI Concierge.
    - [ ] Implement "Suggest Break" logic within the AI response flow.
- [ ] **GSS-203: Contextual Resource Injection**
    - [ ] Create a logic layer that allows the AI to "inject" links to the Support Hub based on detected user triggers.

## 🔍 3. Local Search Discovery
- [ ] **GSS-301: Backend Search Proxy**
    - [ ] Create FastAPI endpoint `POST /api/support/search` in `backend/routers/support.py`.
    - [ ] Integrate with Tavily Search API to find "Grief Counselors near [Location]".
- [ ] **GSS-302: Service Category Mapping**
    - [ ] Implement mapping between user module activities and search categories (e.g., Funeral Planner -> Local Funeral Directors).
- [ ] **GSS-303: Practitioner Directory UI**
    - [ ] Build search results list with interactive maps and "Bookmark to Circle of Trust" functionality.

## 🎨 4. Contextual UI & Polish
- [ ] **GSS-401: Grief Banner Components**
    - [ ] Create a reusable `GriefSupportBanner.svelte` component.
    - [ ] Add it to the top of: `Executor Toolkit`, `Funeral Planner`, `Medical Directives`, and `Legacy Letters`.
- [ ] **GSS-402: Role-Aware Page Variants**
    - [ ] Ensure every module header from the `MASTER_TODO` audit (Issue #12) renders its "Grief-Friendly" variant when `userRole` is 'Executor'.
- [ ] **GSS-403: Persistence & Bookmarking**
    - [ ] Update `executorStore` to track saved/bookmarked practitioners and resources.

## ✅ Verification & Testing
- [ ] **GSS-501: Local Search Accuracy Check**
    - [ ] Verify search returns valid results for major cities (New York, London, Toronto).
- [ ] **GSS-502: Overwhelm Trigger Test**
    - [ ] Simulate rapid back-navigation to verify intervention modal appears.
- [ ] **GSS-503: Role-Switch Verification**
    - [ ] Confirm app-wide tone shift when switching from 'Owner' to 'Executor'.
