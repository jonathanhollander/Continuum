# G0b-finances-estate

**Last Updated:** 2026-10-26 08:35 EST

Reviewer report, saved verbatim (read-only review on main).

G0b report: finances and estate. Read-only on main; I changed nothing, committed nothing, and started no server. I confirmed one finding by compiling the component with svelte/compiler; every other finding comes from reading the code. I skipped anything already covered by a plan card (C1, C7.x, C9, C10, D1, D2, D4, U29, U33, U50, U54, U58, U68, X201, X213, and the T0/G0 seed wording).

Roles: the planning owner, and the Executor and Family perspectives (`contextStore.role`, shown as `$userRole`). The recipient never reaches these module pages; they see only `/for/[token]`, which D2 covers.

## X: bugs and dead ends
1. **X-a: Settings profile saves nothing and throws on every keystroke. This is the most serious finding.** Owner and executor are affected.
   - `ConciergeSettings.svelte:223,236,255,269,283` use `bind:value={$estateProfile.x}`. The compiled output is `store_mutate(estateProfile, …)`, which calls `store.set()`. `estateProfile` (`estateStore.svelte.ts:49-57`) has no `set`, so every keystroke throws a TypeError and edits the shared object in place.
   - `saveProfile` (`:95-117`) only renames the local profile chip, shows a sparkle and waits on an "Artificial delay". It never calls `estateProfile.update`.
   - Result: owner name, executor name, residence, last-4 SSN and date of death never reach the server.
   - Fix: bind to local `$state` and save through `estateProfile.update({...})`.
2. **X-b: Some estate profile fields have no input anywhere.** Owner is affected. `spouseName`, `primaryBeneficiary` and `legalAddress` are read by:
   - the subscriptions letter's "[Address Not Set]" (`subscriptions:85-90`)
   - the AssetManager starter pack (`:445-448,491`)
   - the pets guardian prefill (`pets:64,192`)
   - the insurance wizard beneficiaries (`insurance:167`)

   Nothing sets these fields. Fix: add the three inputs to the X-a profile form.
3. **X-c: In Family perspective, the financial asset controls are only partly hidden.** Family is affected.
   - Card Edit/Delete (`AssetManager.svelte:942-957`) and table Edit/Delete (`:1162-1175`) still show. Edit opens nothing, because the form is Family-gated at `:617`. Delete really removes the asset.
   - Export CSV (`:586-593`, `exportToCSV :515-535`) downloads every value and account number while the screen masks them.
   - Guided Setup (`financial-accounts/+page.svelte:145-152`) still creates accounts.
   - Fix: gate all four on `$userRole !== "Family"`, as Add Asset already is.
4. **X-d: Wizards save placeholder words as real data.** Owner is affected, and the placeholders reach the D1 packet and the recipient view.
   - Property: location "TBD", notes "Added via Concierge Wizard" (`property:153,158`).
   - Financial: location "TBD" (`financial-accounts:126`).
   - Insurance: the insurer field gets the coverage kind ("Term Life", "Comprehensive", "Standard Fire & Theft", `insurance:130-133`), and completion counts it as filled.
   - Digital Guardian: "1Password" whatever manager the person uses, with usernames "Master Account" / "Primary Account" (`digital-guardian:243,246`).
   - Starter pack: "Bank Name", "Last 4", "Provider Name", "Garage", "Policy # needed" (`AssetManager:449-478`).
   - Fix: leave unknown fields blank.
5. **X-e: Clicking a Digital Guardian example row saves it at once as a real account.** Owner is affected (`digital-guardian:1145`). Fix: open the edit modal prefilled, as other modules do.
6. **X-f: Digital account wishes can't be set after the account is created.** Owner and executor are affected.
   - Digital Guardian's modal has only platform, username, type and description (`:327-341`). The memorialize/delete/transfer choice, instructions and priority can only be set when adding an account from Advanced Registry's "Kill Switch" tab, and that tab has no edit.
   - Wizard-made accounts therefore show `""`, "Protocol: none", "medium Priority" and "@username" (`advanced-registry:635,646,689,703`).
   - Digital Guardian removes an account with no confirmation (`:361`, buttons `:1191,1235`).
   - Fix: add preference, instructions and priority to the Digital Guardian modal; hide blank lines; use `askConfirm` on remove.
7. **X-g: Advanced Registry records are partly unusable.**
   - Maintenance entries have no remove, and the form has no provider or next-due inputs, so the card prints "Provider: undefined" (`:408`).
   - The transaction form asks for a free-text "Asset ID" and the row prints it (`:297,757-761`).
   - The claim form has only a number and a note (`:893,906`): no amount (so the card shows $0), no status change, no policy link.
   - The Kill Switch tab shows a blank grid when there are no accounts (`:615`).
   - Removes have no confirmation.
   - Fix: add maintenance remove plus provider/due inputs; an asset select; claim amount and status edit; an empty state.
8. **X-h: Executors can't record a closed financial account.** `estateTotals` skips `is_closed` rows (`financialAssetsStore:25`), but no control sets `is_closed`, and `closureNotes` (`AssetManager:877`) is never shown. Fix: a "Closed" toggle and a closed badge on the card.
9. **X-i: Subscriptions can't be marked as cancelled.** Executor is affected. There is no field for it (`subscriptions:35-46`), and the monthly total keeps counting every row. Fix: a cancelled state (`auto_renew` exists on the model) that drops out of the totals.
10. **X-j: Pets never offer the microchip number.** The column exists (`estate_models.py:313`, `petStore:15`), but there is no input or display. Fix: add it to the form and the card.
11. **X-k: `/estate/[id]` is an orphan page of invented data.** It shows mock "The Anderson Legacy" and "Immediate Action Required" (`estate/[id]/+page.svelte:9-43`), and nothing links to it. Fix: delete the route.
12. **X-l (owner's call): one estate in two places.** The financial page lets the owner add Property, Vehicle and Digital types (`AssetManager:81-89`), and the starter pack adds "Primary Residence" and a vehicle. These are a separate table from Property and Digital Guardian. "Net Estate Value" counts only the financial table and leaves out Property valuations. Recommendation: limit financial types to accounts and debts, or have the total include properties.

## U: polish
- **U-a: Saved details are never shown, only reachable through Edit.** Executor and Family are affected.
  - Insurance cards and table leave out agent name and contact, expiration date, notes and the policy document (fields only at `:1053-1208`).
  - Financial cards leave out beneficiaries, account number and login URL.
  - Pets leave out notes and custom fields; the guardian, vet and food blocks render empty labels when blank (`pets:304-340`).
  - Home-manual vendor notes display (`:537`) but have no input; vendor email and website have no input.
- **U-b: Insurance filter shows the wrong empty state.** Choosing a type with no matches shows the first-run empty state and examples (`insurance:800,852`), and a search with no match shows a blank grid.
- **U-c: The pet guardian is silently prefilled** with the spouse or executor name (`pets:64,192`). Fix: leave it blank.
- **U-d: The property card shows invented or empty values.** It says "Sole Ownership" when nothing is recorded (`property:757`) and "$0" for a value that was never entered (`:722,925`).
- **U-e: The AssetManager modal's close button is a rotated trash icon** (`:663`). Fix: use X.
- **U-f: Family perspective rules differ by page.** Only AssetManager masks or limits Family; insurance, property, subscriptions, pets and digital pages are fully editable in Family view. Pick one rule.

## T0: wording
- AssetManager `:1070`: "Concierge Mode: Showing examples based on your region." is untrue, since the examples follow the chosen language.
- `:605-607`: "Executor View Active … Ensure all valuations are up to date for probate filing" is an imperative.
- Insurance add button "Share Protection" (`:420`).
- The cancellation letter has no date of death and no account identifier (no field exists); "effective immediately" (`subscriptions:85-98`).

## V0: colour
- The amber example banner on the financial empty state (`AssetManager:1068`) marks a routine state.

## Routes
| Route | Who it's for | Findings | Notes |
|---|---|---|---|
| `financial-accounts` | owner / executor / Family | X-c, X-d, X-h, X-l, U-a, U-e, U-f | |
| `insurance` | owner / executor | X-d, U-a, U-b | |
| `property` | owner / executor | X-d, U-d | |
| `subscriptions` | owner / executor | X-i, T0 | |
| `digital-guardian` | owner / executor | X-d, X-e, X-f | |
| `advanced-registry` | owner / executor | X-f, X-g | |
| `legal-documents` (DocumentVault) | owner / executor | none | Already covered by C1, D4, U31, U53 |
| `pets` | owner / guardian named in it | X-j, U-a, U-c | |
| `home-manual` (vendors, access, utilities) | owner / executor | U-a | Vendor fields only; C7.3, C9, U33, U54 and the O2 Wave C utility item already cover the rest |
| `/settings` estate profile | owner | X-a, X-b | |
| `/estate/[id]` | nobody | X-k | |
