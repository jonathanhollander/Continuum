# O1 release API inventory and local timings

Last Updated: 2026-10-26 18:11 EDT  
Stable backend source: `0d47a81bb32aa9683e584dda588977bfa5ebafd6` (X340/X366 merged); X367 supplement: `e8e357640c0759ae8169ea5477ebbed5da5a84c0`.  
Status: local inventory and measurements complete; private PostgreSQL stopped. Production five-slowest-GET evidence is owned separately by root and remains open. This report does not close that production requirement.

## Result and coverage

The final inventory has **179 actual active method/path patterns: 175 successfully measured locally and four provider/hardware success exclusions**. Each measured pattern has 20 samples at each of 20 and 200 records per collection. The stable run covers 174 patterns; the X367 supplement adds one conditional recovery PUT at its own cutoff. Three extra workloads per size (warm shared-file membership and both lifecycle cleanup outcomes) bring the total to **356 rows / 7,120 requests** (7,080 stable plus 40 supplemental). Every measured JSON read had p95 below 150 ms; every JSON write had p95 below 300 ms. Binary downloads are separate below. No external transport was attempted. No application source was edited.

At 200 records, the slowest JSON read was recipient view: p50/p95 **65.505/112.861 ms**, 27 SQL cursor executions and 2,523,246 response bytes. Snapshot export was 66.337/82.633 ms, 26 executions and 3,162,476 bytes. The slowest 200-record write was unused-file lifecycle cleanup 57.991/64.360 ms. SQL cursor counts did not grow between 20 and 200 on any measured workload.

The initial expansion said 175 successful patterns. Source tracing corrected one premature claim: `PUT /api/data/advanced_assets/{id}` was a handler alias, but the pre-X367 recovery helper could not reach it because export expands the parent into three different section names. The 174 stable patterns remain valid. The three actually generated expanded-section GET paths returned 400 in a separate synthetic proof; their PUTs were blocked behind that failure. X367 owns the mapping correction. Its real conditional PUT is now measured at its own merged cutoff; none of the 7,080 completed stable samples were rerun merely to relabel their source.

| Source family | Final measured patterns | Timing rows per size | Notes |
|---|---:|---:|---|
| Collection stores |102|102|27 list registrations; actual invoked verbs only |
| Singleton stores |11|11|Pulse status read-only; five other GET/POST pairs |
| Shared profile |2|2|Nine profile slices use the same GET/POST API |
| Conditional media-recovery aliases |9|9|Eight stable aliases plus X367 conditional advanced-list PUT |
| Authentication |11|11|Two WebAuthn finish success paths excluded |
| Recipient links/reader |7|7|Owner preview, public reader and link CRUD |
| Export snapshot |1|1|Complete seeded snapshot and source membership |
| Media |7|10|Includes three binary workloads and cleanup query variants |
| Custom fields |3|3|One entity discriminator plus other-type/account distraction |
| Direct Pulse |21|21|Portal, messages, vault, timer, check-in and tier update |
| Health/CSRF bootstrap |1|1|Actual frontend health call |
| **Total** |**175**|**178**|20 and 200 record fixtures |

The final X367 archive scan parsed **306 TS/JS/Svelte files**, found **103 transport/wrapper call sites and 43 registrations**, and had zero parser errors. The stable-cutoff inventory had 305 parsed files and 101 call sites; X367 adds two recovery helper requests, reusing an existing GET path and making the conditional PUT path actually reachable. TypeScript parsed scripts only; no application code was imported or executed by inventory extraction. Source hashes and all call arguments/line references are in `final-X367-frontend-ast.json`; `frontend-ast.json` preserves the stable-cutoff scan. Generic wrappers were expanded through registrations and actual method consumers. Query values are workloads of a method/path pattern, not invented endpoints. There are 20 generic collection families and seven dedicated families. Only the financial-accounts page invokes AssetManager and supplies `assets-main`; its `assets_${module.id}` fallback does not add reachable API types.

Explicit exclusions:

- Successful `POST /api/ai/chat` and `GET /api/support/discovery` need configured external providers. Provider success, quality and network latency are not asserted by this local run. Earlier unavailable-provider probes remain separate evidence.
- Successful `POST /api/auth/passkey/register/finish` and `/login/finish` need an authenticator/protocol fixture. Invalid credentials are not used as success timings. Both local challenge-start APIs are measured.
- Dormant source-only methods have no active frontend callers: GET/POST `/api/estate`, POST `/api/auth/signup`, POST `/api/auth/token`. Password/signup timings in earlier O1 batches are supplementary observations, not active-frontend coverage here.
- Bundled PDF-font fetches, user-entered external links, static resources, S3 transfers, browser authentication prompts, provider mail, scheduler work, rendered page timing and real production data are outside this API-controller timing contract. No frontend QR backend API caller was found; backend-only QR/email/admin endpoints are not added to the frontend inventory.

## Method and synthetic data

The approved manual harness is `/private/tmp/continuum-o1-release-current.py` (`T-O1-RELEASE-CURRENT`), copied/extended from the approved batch 2 recorder. It is neither committed nor scheduled and adds no dependencies or CI gate. Measurements run in-process through actual FastAPI requests and JWT authentication for owner 2, without dependency overrides or application lifespan. Every sample uses a reserved test IP and synthetic CSRF cookie/header; rate-limit code remains active. HTTP/SMTP transports are blocked; email-service sends return an unavailable local sentinel. Mail/provider success is not inferred. No owner `.env`, database, upload or mailbox was read.

A git archive pins backend and frontend sources beneath `/private/tmp/continuum-o1-release-x7j7nlgm/source`, with `.env` files explicitly excluded. Runtime cwd is an empty private directory; 83 backend Python source hashes are recorded and checked unchanged. PostgreSQL 18.4 is a new private socket-only UTF8 cluster, freshly migrated through the entire chain to `b2e4a6c8d0f1` (48 public tables). Port 56303 does not expose a TCP listener. The setup and migrations ran separately from timing; no runtime schema startup or scheduler ran.

Each size seeds n records per active collection for owner 2 and a second account; n+2 users, n credentials/check-ins/messages/vault notes/refresh tokens/safety timers, and n custom definitions of one type plus a different type. Asset storage has 3 n rows: n properties, n digital assets and n heirlooms. Singletons stay one row per account; Pulse tiers stay four. Each advanced-history list and funeral budget contains n entries. Profile contains n extra author keys. Letters contain 2,220 UTF8 bytes, including curly punctuation, café and 家族; all files are fixed 68-byte local PNGs. The large snapshot is 3.16MB. Fixture table counts are captured, rather than implying that singleton rows or tiers should number 200. Dormant historical heirloom/QR/email-log/recovery-copy tables remain empty because these active routes do not read them.

All reads run before mutations, proving exact owner/category memberships through independent ORM ID recounts. Snapshot/recipient checks independently compare source row IDs, recipient/hold/release filtering, executor-note policy, expanded list lengths and attachment ownership. Creates remove their temporary target after timing; deletes create a disposable target before timing; updates restore the original row afterward. Contact deletion has n graph links. Safety actions reset their active timer precondition; Pulse mutations clear only new test check-ins/messages. Setup, recounts, validation, resets and TestClient construction are outside each interval. The timed interval includes request dispatch, JWT lookup, handler SQL and full response serialization/body transfer to the in-process client.

p50 is the median; p95 is the 19 th sorted observation of 20. Every sample is retained, including the first. SQL counts are `before_cursor_execute` events, with raw SQL shapes and driver executemany parameter sets saved separately. **Six cursor calls for contact deletion do not mean six row operations**: its delete batch grows 20→200 parameter sets (25→205 event-plus-driver-operation count), plus multirow audit insertion. This already-known write fanout remains an optimization watch item; p95 was 6.503→26.362 ms and no new per-record query loop was found. File cleanup has fixed 3/5 cursor calls while its SQL scans current reference data; measured 200-record p95 retained 24.876 ms/unreferenced 64.360 ms is evidence at this fixture size, not an arbitrary-size guarantee.

## Full stable timing table

Times are milliseconds. `SQL20/200` is the per-request cursor-count range at each size. Every row has 20 valid status 200 samples per size. Binary rows are separated after the JSON table. The150 ms read/300 ms write comparison uses p95.

| Method/path or explicit workload | p50-20 | p95-20 | p50-200 | p95-200 | SQL20/200 |
|---|---:|---:|---:|---:|---:|
| `DELETE /api/contacts/relationships/{id}` |2.286|2.831|2.706|3.280|4/4|
| `DELETE /api/contacts/{id}` |6.057|6.503|23.131|26.362|6/6|
| `DELETE /api/data/acceptance_tasks/{id}` |2.672|3.238|3.194|3.736|4/4|
| `DELETE /api/data/activity_log/{id}` |2.762|3.034|3.790|4.991|4/4|
| `DELETE /api/data/automation_rules/{id}` |3.308|4.316|3.332|4.047|4/4|
| `DELETE /api/data/calendar_events/{id}` |2.526|3.037|2.831|3.280|4/4|
| `DELETE /api/data/custom-fields/{id}` |2.348|2.980|2.267|2.960|3/3|
| `DELETE /api/data/digital_assets/{id}` |4.123|7.090|3.727|4.698|5/5|
| `DELETE /api/data/documents/{id}` |2.478|2.778|2.967|3.536|4/4|
| `DELETE /api/data/financial_assets/{id}` |3.030|3.339|3.077|3.720|4/4|
| `DELETE /api/data/heirlooms/{id}` |3.359|3.914|4.166|5.520|5/5|
| `DELETE /api/data/home_access/{id}` |3.764|4.347|3.917|6.804|4/4|
| `DELETE /api/data/insurance_policies/{id}` |2.667|3.298|5.285|7.660|4/4|
| `DELETE /api/data/journal_entries/{id}` |2.549|2.863|3.273|4.334|4/4|
| `DELETE /api/data/letters/{id}` |3.210|3.740|5.266|32.734|4/4|
| `DELETE /api/data/pets/{id}` |2.762|3.329|3.710|4.449|4/4|
| `DELETE /api/data/properties/{id}` |3.145|3.480|3.417|3.790|5/5|
| `DELETE /api/data/subscriptions/{id}` |3.402|3.836|3.528|4.271|4/4|
| `DELETE /api/data/time_capsule/{id}` |2.907|3.192|3.681|4.470|4/4|
| `DELETE /api/data/timeline_events/{id}` |2.708|3.431|4.469|5.210|4/4|
| `DELETE /api/data/utilities/{id}` |2.454|2.878|3.688|4.104|4/4|
| `DELETE /api/data/vendors/{id}` |2.787|3.287|3.031|3.652|4/4|
| `DELETE /api/media/{id}` |2.634|3.059|2.606|3.288|4/4|
| `DELETE /api/media/{id} (only_if_unused; referenced retained)` |21.338|41.973|22.208|24.876|3/3|
| `DELETE /api/media/{id} (only_if_unused; unreferenced)` |31.649|74.385|57.991|64.360|5/5|
| `DELETE /api/medical/directives/{id}` |3.075|3.875|2.605|3.074|4/4|
| `DELETE /api/memories/archives/{id}` |2.363|2.703|2.768|3.223|4/4|
| `DELETE /api/memories/family/{id}` |2.545|2.806|2.804|3.542|4/4|
| `DELETE /api/memories/visual/{id}` |2.606|2.938|2.510|3.203|4/4|
| `DELETE /api/pulse/vault/{id}` |3.255|11.641|2.161|2.540|3/3|
| `DELETE /api/recipient/links/{contactId}` |3.120|3.886|2.431|3.063|4/4|
| `GET /api/auth/magic-link/verify` |2.768|3.183|3.041|3.635|5/5|
| `GET /api/auth/me` |1.970|2.129|2.431|3.094|1/1|
| `GET /api/auth/me/preferences` |1.920|2.130|1.911|2.149|1/1|
| `GET /api/auth/onboarding` |1.874|2.149|1.849|2.071|1/1|
| `GET /api/contacts` |2.264|3.999|3.682|3.971|2/2|
| `GET /api/contacts/relationships` |2.697|3.369|2.799|3.264|2/2|
| `GET /api/data/acceptance_tasks` |2.486|2.702|3.086|3.571|2/2|
| `GET /api/data/activity_log` |2.378|2.716|3.117|3.537|2/2|
| `GET /api/data/advanced_assets` |2.772|3.398|2.470|3.243|2/2|
| `GET /api/data/assets` |3.005|5.877|6.789|9.485|2/2|
| `GET /api/data/automation_rules` |2.575|2.792|3.561|3.926|2/2|
| `GET /api/data/calendar_events` |2.349|3.016|3.496|3.884|2/2|
| `GET /api/data/custom-fields/{entityType}` |2.824|3.191|5.241|5.722|2/2|
| `GET /api/data/digital_assets` |2.642|3.026|3.793|4.175|2/2|
| `GET /api/data/digital_guardian` |2.538|3.271|2.762|3.869|2/2|
| `GET /api/data/documents` |2.417|2.845|2.983|3.640|2/2|
| `GET /api/data/executor_steps` |2.429|2.607|2.974|3.366|2/2|
| `GET /api/data/financial_accounts` |2.347|2.825|4.283|5.277|2/2|
| `GET /api/data/financial_assets` |3.015|3.241|3.270|3.608|2/2|
| `GET /api/data/funeral_data` |2.489|2.850|3.384|4.733|2/2|
| `GET /api/data/heirlooms` |3.574|4.176|4.791|6.155|2/2|
| `GET /api/data/home_access` |2.576|2.967|3.850|4.761|2/2|
| `GET /api/data/insurance_policies` |2.401|2.771|3.320|3.654|2/2|
| `GET /api/data/journal_entries` |2.711|3.047|4.184|4.697|2/2|
| `GET /api/data/letters` |2.731|3.004|4.124|4.500|2/2|
| `GET /api/data/medical_directives` |2.722|3.355|2.990|3.264|2/2|
| `GET /api/data/pets` |2.851|3.337|3.704|4.663|2/2|
| `GET /api/data/properties` |3.340|3.914|4.106|5.022|2/2|
| `GET /api/data/subscriptions` |2.715|3.112|3.165|3.536|2/2|
| `GET /api/data/time_capsule` |2.651|2.950|3.444|3.630|2/2|
| `GET /api/data/timeline_events` |2.622|2.921|3.602|3.851|2/2|
| `GET /api/data/utilities` |3.460|5.353|3.010|3.348|2/2|
| `GET /api/data/vendors` |3.658|4.726|2.797|3.065|2/2|
| `GET /api/estate/profile` |2.246|2.645|2.531|3.152|2/2|
| `GET /api/export/snapshot` |14.533|19.754|66.337|82.633|26/26|
| `GET /api/health` |2.104|4.190|1.723|3.118|1/1|
| `GET /api/media/` |8.323|15.960|4.100|4.512|2/2|
| `GET /api/media/{id}` |2.645|3.969|2.002|2.235|2/2|
| `GET /api/medical/directives` |3.300|5.534|2.992|3.708|2/2|
| `GET /api/medical/profile` |2.509|2.896|2.423|3.243|2/2|
| `GET /api/memories/archives` |2.679|3.225|2.732|3.661|2/2|
| `GET /api/memories/family` |2.650|3.146|3.742|4.363|2/2|
| `GET /api/memories/visual` |2.863|3.435|3.341|3.781|2/2|
| `GET /api/pulse/contacts` |3.446|4.414|9.612|11.056|2/2|
| `GET /api/pulse/history` |4.851|10.043|2.702|2.888|2/2|
| `GET /api/pulse/messages` |2.890|4.170|4.939|5.337|2/2|
| `GET /api/pulse/portal/{token}` |5.238|8.356|6.032|7.743|10/10|
| `GET /api/pulse/portal/{token}/vault` |3.869|4.876|6.362|6.869|6/6|
| `GET /api/pulse/safety/status` |3.196|15.092|2.106|2.932|2/2|
| `GET /api/pulse/settings` |2.112|2.478|2.498|3.230|2/2|
| `GET /api/pulse/status` |4.214|4.678|12.232|14.205|8/8|
| `GET /api/pulse/tiers` |2.437|3.245|2.186|2.685|2/2|
| `GET /api/pulse/transparency` |9.831|23.302|13.120|60.211|18/18|
| `GET /api/pulse/vault` |3.040|3.734|5.015|5.571|2/2|
| `GET /api/pulse/verify/{token}` |3.059|5.779|1.986|2.281|2/2|
| `GET /api/recipient/links` |3.931|4.564|5.646|6.224|2/2|
| `GET /api/recipient/links/{contactId}` |3.347|4.761|2.006|2.424|2/2|
| `GET /api/recipient/preview/{contactId}` |13.168|16.573|66.586|106.779|27/27|
| `GET /api/recipient/view/{token}` |12.120|13.345|65.505|112.861|27/27|
| `PATCH /api/auth/me/preferences` |2.662|3.395|2.680|3.336|3/3|
| `PATCH /api/auth/onboarding` |2.884|7.379|2.768|3.133|3/3|
| `PATCH /api/auth/preferences` |2.501|2.910|2.572|3.021|3/3|
| `POST /api/auth/magic-link` |2.618|3.046|3.322|3.821|3/3|
| `POST /api/auth/passkey/login/start` |2.402|2.858|5.494|6.609|2/2|
| `POST /api/auth/passkey/register/start` |2.728|3.203|2.751|3.139|3/3|
| `POST /api/auth/refresh` |2.810|3.506|2.940|3.345|5/5|
| `POST /api/contacts` |3.117|3.500|3.297|3.695|5/5|
| `POST /api/contacts/relationships` |2.768|3.103|3.576|4.399|4/4|
| `POST /api/data/acceptance_tasks` |2.946|3.558|3.386|3.851|4/4|
| `POST /api/data/activity_log` |3.430|4.851|6.583|8.313|4/4|
| `POST /api/data/advanced_assets` |2.882|3.429|4.027|4.685|4/4|
| `POST /api/data/automation_rules` |3.773|4.191|3.961|4.669|4/4|
| `POST /api/data/calendar_events` |4.191|4.411|4.313|5.131|4/4|
| `POST /api/data/custom-fields` |2.867|3.297|2.731|3.153|3/3|
| `POST /api/data/digital_assets` |4.112|5.838|3.849|5.729|4/4|
| `POST /api/data/digital_guardian` |2.907|3.569|3.089|3.659|4/4|
| `POST /api/data/documents` |3.884|4.856|3.866|4.324|4/4|
| `POST /api/data/executor_steps` |2.831|3.641|3.404|4.070|4/4|
| `POST /api/data/financial_assets` |3.729|5.100|3.734|4.979|4/4|
| `POST /api/data/funeral_data` |3.366|3.777|3.628|4.076|4/4|
| `POST /api/data/heirlooms` |3.266|3.500|7.451|13.782|4/4|
| `POST /api/data/home_access` |3.908|4.379|3.878|6.504|4/4|
| `POST /api/data/insurance_policies` |2.991|4.343|4.459|6.483|4/4|
| `POST /api/data/journal_entries` |3.454|4.323|4.837|5.460|4/4|
| `POST /api/data/letters` |3.039|3.458|5.464|6.803|4/4|
| `POST /api/data/pets` |3.143|3.943|3.997|4.731|4/4|
| `POST /api/data/properties` |3.045|3.566|4.466|5.128|4/4|
| `POST /api/data/subscriptions` |3.768|4.150|3.451|4.138|4/4|
| `POST /api/data/time_capsule` |3.062|3.491|4.470|5.275|4/4|
| `POST /api/data/timeline_events` |3.123|3.797|4.144|4.711|4/4|
| `POST /api/data/utilities` |3.701|4.687|4.147|4.567|4/4|
| `POST /api/data/vendors` |3.470|4.104|3.582|4.220|4/4|
| `POST /api/estate/profile` |2.641|3.234|3.637|4.126|4/4|
| `POST /api/media/upload` |3.681|4.507|3.041|3.630|4/4|
| `POST /api/medical/directives` |4.241|6.495|3.649|5.386|4/4|
| `POST /api/medical/profile` |2.991|3.650|4.120|4.877|5/5|
| `POST /api/memories/archives` |3.225|8.560|3.523|4.288|4/4|
| `POST /api/memories/family` |3.118|4.177|3.870|5.041|4/4|
| `POST /api/memories/visual` |3.679|4.212|3.057|3.765|4/4|
| `POST /api/pulse/checkin` |3.586|4.272|5.041|5.483|6/6|
| `POST /api/pulse/confirm/{token}` |2.266|2.609|2.153|2.581|2/2|
| `POST /api/pulse/messages` |2.646|3.116|2.952|3.533|3/3|
| `POST /api/pulse/nudge/{token}` |2.092|2.599|2.100|3.035|2/2|
| `POST /api/pulse/respond/{token}` |2.595|3.018|2.077|2.580|2/2|
| `POST /api/pulse/safety/cancel` |2.792|3.150|2.368|2.747|3/3|
| `POST /api/pulse/safety/start` |3.422|3.964|3.311|4.386|5/5|
| `POST /api/pulse/settings` |2.279|2.495|2.660|3.540|2-3/2-3|
| `POST /api/pulse/vault` |2.980|3.706|2.679|3.138|3/3|
| `POST /api/pulse/verify/{token}` |3.146|3.410|4.803|6.218|7/7|
| `POST /api/recipient/links/{contactId}` |3.136|3.428|3.805|4.313|4/4|
| `PUT /api/contacts/{id}` |2.840|3.841|2.871|3.266|4/4|
| `PUT /api/data/acceptance_tasks/{id}` |3.532|4.345|7.056|9.879|5/5|
| `PUT /api/data/assets/{id}` |3.015|3.658|3.447|4.101|4/4|
| `PUT /api/data/automation_rules/{id}` |4.155|5.444|3.651|4.433|5/5|
| `PUT /api/data/calendar_events/{id}` |3.081|3.560|4.205|5.573|5/5|
| `PUT /api/data/digital_assets/{id}` |4.656|5.867|4.633|5.485|6/6|
| `PUT /api/data/documents/{id}` |3.079|3.533|3.282|3.814|5/5|
| `PUT /api/data/executor_steps/{id}` |3.523|4.238|3.269|4.061|5/5|
| `PUT /api/data/financial_accounts/{id}` |3.217|4.176|3.527|4.325|4/4|
| `PUT /api/data/financial_assets/{id}` |3.353|4.214|4.453|5.995|5/5|
| `PUT /api/data/funeral_data/{id}` |3.362|3.769|3.581|4.567|4/4|
| `PUT /api/data/heirlooms/{id}` |4.013|9.666|4.797|7.134|6/6|
| `PUT /api/data/home_access/{id}` |3.136|3.739|4.411|5.432|5/5|
| `PUT /api/data/insurance_policies/{id}` |3.215|3.590|4.443|5.352|5/5|
| `PUT /api/data/journal_entries/{id}` |3.028|3.508|4.731|9.078|5/5|
| `PUT /api/data/letters/{id}` |3.330|3.843|4.756|5.150|5/5|
| `PUT /api/data/medical_directives/{id}` |3.448|3.784|3.317|3.832|4/4|
| `PUT /api/data/pets/{id}` |3.188|3.704|4.466|5.393|5/5|
| `PUT /api/data/properties/{id}` |4.102|4.572|4.040|4.422|6/6|
| `PUT /api/data/subscriptions/{id}` |3.357|3.788|4.278|5.183|5/5|
| `PUT /api/data/time_capsule/{id}` |3.754|4.411|3.914|5.116|5/5|
| `PUT /api/data/timeline_events/{id}` |4.281|4.937|4.420|5.124|5/5|
| `PUT /api/data/utilities/{id}` |3.381|4.119|3.884|4.413|5/5|
| `PUT /api/data/vendors/{id}` |2.950|3.288|4.338|5.005|5/5|
| `PUT /api/media/{id}/metadata` |2.956|4.017|3.128|3.788|4/4|
| `PUT /api/medical/directives/{id}` |3.233|4.016|4.724|5.280|4/4|
| `PUT /api/medical/profile` |3.021|3.297|3.672|4.299|5/5|
| `PUT /api/memories/archives/{id}` |3.086|4.260|3.713|4.593|4/4|
| `PUT /api/memories/family/{id}` |2.940|3.309|2.842|3.486|4/4|
| `PUT /api/memories/visual/{id}` |3.089|3.605|2.763|3.307|4/4|
| `PUT /api/pulse/tiers/{id}` |2.736|3.339|3.020|3.702|4/4|
| `PUT /api/pulse/vault/{id}` |2.627|2.991|3.251|3.668|4/4|
| `PUT /api/recipient/links/{contactId}` |2.722|3.304|3.035|3.676|4/4|

## Local binary workloads

These measure 68 local bytes through the actual authorization/membership path. They do not measure large-file bandwidth, S3 or the browser's transfer/rendering performance. Cold shared membership clears the private per-token shown-file cache before every sample; warm membership preserves it.

| Binary workload | p50-20 | p95-20 | p50-200 | p95-200 | SQL20/200 |
|---|---:|---:|---:|---:|---:|
| `GET /api/media/shared/{token}/{id} (cold membership)` |20.326|34.259|54.156|102.892|29/29|
| `GET /api/media/shared/{token}/{id} (warm membership)` |4.272|6.715|2.455|2.737|3/3|
| `GET /api/media/{id}/download` |4.134|5.121|2.283|2.474|2/2|

## X367 recovery supplement — complete

Pre-fix proof at the same stable cutoff: the valid 200-record snapshot includes 200 rows each in `asset_transactions`, `maintenance_logs`, and `insurance_claims`, with a real stored receipt URL. `mediaMigration.collectionPath` generated `/api/data/<expanded-section>`; all three real GETs returned 400 because MODEL_MAP has no such type. The subsequent PUT is not reached. The snapshot contains no raw `advanced_assets` section. Root registered X367 and reviewed the repair/proof agent’s completed work. These unsupported GETs are not successful performance rows.

X367 was root reviewed and merged as `e8e357640c0759ae8169ea5477ebbed5da5a84c0`. The corrected helper maps expanded sections to the actual `advanced_assets` singleton, skips their generic collection loop and conditionally writes one raw list at the actual singleton ID. No expanded-section API remains in its execution path. Its GET reuses the already measured `/api/data/advanced_assets`; the conditional PUT contributes the final successful method/path pattern.

The supplemental archive differs in exactly one backend Python file, `backend/routers/estate_data.py`; the remaining 82 backend hashes match the stable archive. The two changed-path identities are:

- `backend/routers/estate_data.py`: `b569b4dd3f83cb1d62ad9867249059ae220bfb1a8a4135ebf20b0ee4117380dd`
- `frontend/src/lib/services/mediaMigration.ts`: `8d61af4212f3f31f6bb3a99646b79e425934a5f3e127ac45c95121f5d6751fa5`

| Supplemental workload | p50-20 | p95-20 | p50-200 | p95-200 | SQL20/200 |
|---|---:|---:|---:|---:|---:|
| `PUT /api/data/advanced_assets/{id}` conditional transactions list |3.981|4.837|5.171|5.910|5/5|

All 40 timed requests returned 200 with the refreshed full singleton (10,100 bytes at 20 entries; 102,083 at 200). Each request replaced one receipt URL inside the selected transaction list; independent checks verified every nested entry, both other raw lists, the other account and exactly one new audit row. The original row was restored outside the timer. The payload was `{data:{transactions:patchedJSONText},if_unchanged:{transactions:rawGETString}}`. This representative timing covers one conditional endpoint, not a claim that the three history fields are different routes. X367's independently reviewed focused proof covers all three field mappings, stale 409 preserving the concurrent list and audit count, and unchanged ordinary raw PUT behavior. See [X367 proof notes](/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/x367/proof-notes.txt) and [private PostgreSQL contract results](/private/tmp/claude-501/-Users-jonathanhollander-AI-Code-Continuum/798584f5-5f46-497f-a2f2-975a6b8ca86a/scratchpad/x367/postgres-cas-proof.json). That existing focused proof is referenced instead of rerun here.

The supplement captured all 83 backend hashes unchanged during its run and attempted zero external transport. The private PostgreSQL cluster was stopped in `finally`; stop returned 0 and independent `pg_ctl status` reported no server running. No background server remains from this release run.


## Evidence, failures and limits

Full evidence: `/private/tmp/continuum-o1-release-x7j7nlgm`. Key files are `measure-measurements.json` (354 stable rows / 7,080 raw samples), `supplement-measurements.json` (two rows / 40 samples), `final-release-results.csv`, `final-release-validation.json`, `supplement-source-manifest.json`, `postgres-stop.log`, `release-stable-results.csv`, `frontend-ast.json`, `endpoint-inventory.json`, `final-endpoint-inventory.json`, `final-X367-frontend-ast.json`, `fixture-20.json`, `fixture-200.json`, `migration.log`, `setup.log`, `recovery-inventory-proof.json`, and `measure-offline-validation.json`.

Complete preparation failures remain: the first proof command had an indentation error before requests; timing dispatch stopped before an editable HomeAccess field, then before ExternalArchive's platform field. These were harness selection gaps. Another optional fixture incorrectly expected 409 from ordinary media DELETE; source tracing established that the actual lifecycle query is `only_if_unused=true`, which returns 200/removed:false on a reference. That synthetic dataset was reseeded and the correct two lifecycle outcomes were measured. No bad sample became a successful row; completed rows were retained across resumes. The final process printed source-integrity success and 7,080 complete requests, then an obsolete duplicate dispatch stub raised. That post-run stub was removed; offline completeness/hash validation passed without rerunning any completed measurement. Logs `measure-01.log` through `measure-05.log`, `failure-*.json`, and `fixture-dispatch-preflight.log` preserve the full history.

Limits: controller timing uses local PostgreSQL on one machine with fsync disabled for this disposable cluster, an in-process client and no provider transport. It proves the stated synthetic workload and source identity, not a production service-level objective, concurrent load, network latency, real attachment size or email fanout/provider success. Owner check-in here follows the seeded locally unconfirmed alert history; accepted-provider all-clear fanout is not exercised as a provider workload. Production's five slowest GET table remains separate and open. The local supplement and shutdown are complete; production evidence remains outside this report.
