#!/usr/bin/env python3
"""T-A3 UI-payload smoke script (approved test T-A3, card A3). Run BY HAND only.

Sends the payload the UI really sends for each completion-scenario record type,
re-fetches it, and diffs every field sent against what the server returned.
Prints one PASS/FAIL line per record type. It only reports: exit code is always 0.
It is never wired into commit, build, deploy, CI or any hook.

Usage (synthetic data only; it talks only to the URL you give it):
    python3 scripts/smoke_test.py                       # default http://localhost:8000
    python3 scripts/smoke_test.py --base http://localhost:8812
    python3 scripts/smoke_test.py --base URL --verbose  # also print payloads/responses

How the payloads are reproduced (read these before changing anything here):
  - frontend/src/lib/services/sync.svelte.ts: toSnake/toCamel/convertKeys (lines 8-20),
    SyncManager.create (146-202: mapper -> convertKeys(toSnake) -> drop string id > 10 chars),
    SyncManager.update (204-286: {...local, ...updates} -> mapper -> toSnake -> drop
    id/user_id/created_at/updated_at), SingletonSyncManager.sync/update (396-472).
  - Each store's mapper is ported 1:1 below (JS `??`, `||`, object spread of strings,
    and JSON.stringify dropping `undefined` are emulated).
  - Which SyncManager instance owns a registry key: the login page redirects to /dashboard
    (routes/login/+page.svelte:26), whose imports (syncStatusStore.svelte.ts) register the
    store-level instances first. So the store mapper/endpoint wins for shared keys
    (e.g. 'financial_assets' -> endpoint financial_assets with financialAssetMapper).
  - The record objects passed to the store are copied from the screens that create them
    (AssetManager.svelte, property, subscriptions, digital-guardian, heirlooms,
    DocumentVault.svelte, time-capsule, letters, legacy-journal, home-manual, insurance,
    contacts, funeral pages).

Reuses the probe idea of docs/reviews/2026-10-25-features-usability/evidence/
reproduce_api_probes.py, but over real HTTP with a real login (that script used an
in-process TestClient with an auth override and model-shaped payloads).
"""
import argparse
import http.cookiejar
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# JS semantics helpers
# ---------------------------------------------------------------------------
UNDEF = type("Undefined", (), {"__repr__": lambda s: "undefined"})()


def nullish(v):
    return v is None or v is UNDEF


def nn(*vals):
    """JS a ?? b ?? c"""
    for v in vals[:-1]:
        if not nullish(v):
            return v
    return vals[-1]


def truthy(v):
    if nullish(v) or v is False:
        return False
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return v == v and v != 0  # NaN and 0 are falsy
    if isinstance(v, str):
        return v != ""
    return True  # objects and arrays are always truthy in JS


def js_or(a, b):
    return a if truthy(a) else b


def g(obj, key):
    """JS property read: missing -> undefined."""
    if isinstance(obj, dict):
        return obj.get(key, UNDEF)
    return UNDEF


def spread(x):
    """JS {...x}"""
    if isinstance(x, dict):
        return dict(x)
    if isinstance(x, (str, list)):
        return {str(i): c for i, c in enumerate(x)}
    return {}


def js_id(data):
    """`typeof data.id === 'string' && data.id.length > 10 ? undefined : Number(data.id) || data.id`"""
    i = g(data, "id")
    if isinstance(i, str) and len(i) > 10:
        return UNDEF
    if isinstance(i, bool):
        n = int(i)
    elif isinstance(i, (int, float)):
        n = i
    elif isinstance(i, str):
        try:
            n = float(i) if i.strip() else 0
        except ValueError:
            n = float("nan")
    else:
        n = float("nan")
    return n if truthy(n) else i


def to_snake(s):
    return re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s).lower()


def to_camel(s):
    return re.sub(r"[-_][a-z]", lambda m: m.group(0)[1].upper(), s)


def convert_keys(obj, conv):
    if isinstance(obj, list):
        return [convert_keys(i, conv) for i in obj]
    if not isinstance(obj, dict):
        return obj
    out = {}
    for k, v in obj.items():
        out[conv(k)] = v if k in ("custom_attributes", "customAttributes") else convert_keys(v, conv)
    return out


# sync.svelte.ts CAMEL_WIRE_KEYS / JSON_TEXT_WIRE_KEYS / toWire (B1)
CAMEL_WIRE_KEYS = {"ownershipDetails", "purchaseDate", "maintenanceSchedule", "accountNumber",
                   "ownershipPercentage", "loginUrl", "beneficiaryEmail", "valueHistory", "closureNotes",
                   "paymentMethod", "cancellationInstructions", "nextBilling"}


def to_wire(obj):
    out = convert_keys(obj, lambda k: k if k in CAMEL_WIRE_KEYS else to_snake(k))
    for k in ("valueHistory", "maintenanceSchedule", "evidence"):
        if isinstance(out.get(k), (list, dict)):
            out[k] = js_json(out[k])
    return out


def strip_undef(obj):
    """JSON.stringify drops undefined object properties."""
    if isinstance(obj, dict):
        return {k: strip_undef(v) for k, v in obj.items() if v is not UNDEF}
    if isinstance(obj, list):
        return [None if v is UNDEF else strip_undef(v) for v in obj]
    return obj


def js_json(x):
    return json.dumps(strip_undef(x), separators=(",", ":"))


# ---------------------------------------------------------------------------
# Store mappers (ported 1:1)
# ---------------------------------------------------------------------------
def financial_asset_mapper(item):  # financialAssetsStore.svelte.ts parseHistory + mapper (B1)
    if not truthy(item):
        return item
    vh = g(item, "valueHistory")
    if isinstance(vh, str) and vh:
        try:
            vh = json.loads(vh)
        except ValueError:
            pass
    return {**item,
            "is_closed": nn(g(item, "is_closed"), g(item, "isClosed"), False),
            "closure_date": nn(g(item, "closure_date"), g(item, "closureDate")),
            "valueHistory": vh if isinstance(vh, list) else []}


def subscription_mapper(data):  # subscriptionStore.svelte.ts:17-23
    return {**data, "id": js_id(data),
            "auto_renew": nn(g(data, "auto_renew"), g(data, "autoRenew"), True),
            "renewal_date": nn(g(data, "renewal_date"), g(data, "renewalDate")),
            "paymentMethod": nn(g(data, "paymentMethod"), g(data, "payment_method"))}


def digital_asset_mapper(item):  # digitalAssetsStore.svelte.ts:54-65
    if not truthy(item):
        return item
    return {**item,
            "name": js_or(js_or(js_or(g(item, "name"), g(item, "platform")), g(item, "description")),
                          "Digital account"),  # B1: Asset.name is required
            "isClosed": nn(g(item, "is_closed"), g(item, "isClosed")),
            "closureDate": nn(g(item, "closure_date"), g(item, "closureDate")),
            "is_closed": nn(g(item, "isClosed"), g(item, "is_closed")),
            "closure_date": nn(g(item, "closureDate"), g(item, "closure_date"))}


def parse_evidence(v):  # propertyStore.svelte.ts parseEvidence (B1)
    if isinstance(v, list) or nullish(v):
        return UNDEF if nullish(v) else v
    if isinstance(v, str) and v:
        try:
            p = json.loads(v)
            if isinstance(p, list):
                return p
        except ValueError:
            pass
    return []


def property_mapper(item):  # propertyStore.svelte.ts propertyMapper (B1)
    if not truthy(item):
        return item
    pd = g(item, "purchaseDate")
    return {**item, "purchaseDate": pd[:10] if isinstance(pd, str) and pd else pd,
            "evidence": parse_evidence(g(item, "evidence"))}


def heirloom_mapper(item):  # heirloomStore.svelte.ts:47-56
    if not truthy(item):
        return item
    val, value = g(item, "valuation"), g(item, "value")
    try:
        parsed = float(value) if value is not UNDEF else UNDEF
    except (TypeError, ValueError):
        parsed = float("nan")
    return {**item,
            "value": str(val) if val is not UNDEF else value,
            "valuation": parsed if value is not UNDEF else val}


def time_capsule_mapper(item):  # timeCapsuleStore.svelte.ts:35-58
    if not truthy(item):
        return item
    return {**item,
            "videoUrl": nn(g(item, "video_url"), g(item, "videoUrl")),
            "audioUrl": nn(g(item, "audio_url"), g(item, "audioUrl")),
            "mediaId": nn(g(item, "media_id"), g(item, "mediaId")),
            "contentPreview": nn(g(item, "content_preview"), g(item, "contentPreview")),
            "triggerType": nn(g(item, "trigger_type"), g(item, "triggerType")),
            "triggerValue": nn(g(item, "trigger_value"), g(item, "triggerValue")),
            "isReleased": nn(g(item, "is_released"), g(item, "isReleased"), False),
            "createdAt": nn(g(item, "created_at"), g(item, "createdAt")),
            "video_url": nn(g(item, "videoUrl"), g(item, "video_url")),
            "audio_url": nn(g(item, "audioUrl"), g(item, "audio_url")),
            "media_id": nn(g(item, "mediaId"), g(item, "media_id")),
            "content_preview": nn(g(item, "contentPreview"), g(item, "content_preview")),
            "trigger_type": nn(g(item, "triggerType"), g(item, "trigger_type")),
            "trigger_value": nn(g(item, "triggerValue"), g(item, "trigger_value")),
            "is_released": nn(g(item, "isReleased"), g(item, "is_released")),
            "created_at": nn(g(item, "createdAt"), g(item, "created_at"))}


def journal_mapper(data):  # journalStore.svelte.ts:13-17
    return {**data, "id": js_id(data), "created_at": nn(g(data, "created_at"), g(data, "createdAt"))}


def home_access_mapper(data):  # homeAccessStore.svelte.ts:11-15
    return {**data, "id": js_id(data),
            "code_encrypted": nn(g(data, "code_encrypted"), g(data, "codeEncrypted"), g(data, "code"), "")}


def insurance_mapper(item):  # insuranceStore.svelte.ts:22-49
    if not truthy(item):
        return item
    pairs = [("policyName", "policy_name", ""), ("insuranceType", "insurance_type", "Other"),
             ("policyNumber", "policy_number", ""), ("premiumAmount", "premium_amount", 0),
             ("premiumFrequency", "premium_frequency", "Monthly"), ("agentName", "agent_name", ""),
             ("agentContact", "agent_contact", ""), ("claimsProcedure", "claims_procedure", ""),
             ("policyDocuments", "policy_documents", ""), ("expirationDate", "expiration_date", UNDEF)]
    out = dict(item)
    for camel, snake, default in pairs:
        out[camel] = nn(g(item, snake), g(item, camel), default)
    for camel, snake, _ in pairs:
        out[snake] = nn(g(item, camel), g(item, snake))
    return out


def contact_mapper(item):  # familyStore.svelte.ts:41-82
    if not truthy(item):
        return item
    legacy = {"spouse": "Family", "child": "Family", "grandchild": "Family", "parent": "Family",
              "sibling": "Family", "professional": "Other", "pet": "Pet"}
    role, relation = g(item, "role"), g(item, "relation")
    if isinstance(role, str) and role in legacy:
        if not truthy(relation):
            relation = role[:1].upper() + role[1:]
        role = legacy[role]
    return {**item, "role": js_or(role, "Other"), "relation": js_or(relation, ""),
            "isExecutor": nn(g(item, "is_executor"), g(item, "isExecutor"), False),
            "isBeneficiary": nn(g(item, "is_beneficiary"), g(item, "isBeneficiary"), False),
            "isEmergencyContact": nn(g(item, "is_emergency_contact"), g(item, "isEmergencyContact"), False),
            "tierId": nn(g(item, "tier_id"), g(item, "tierId"), None),
            "is_executor": nn(g(item, "isExecutor"), g(item, "is_executor")),
            "is_beneficiary": nn(g(item, "isBeneficiary"), g(item, "is_beneficiary")),
            "is_emergency_contact": nn(g(item, "isEmergencyContact"), g(item, "is_emergency_contact")),
            "tier_id": nn(g(item, "tierId"), g(item, "tier_id"))}


def funeral_mapper(data):  # funeralStore.svelte.ts:61-79 (direction depends on typeof wishes)
    if not truthy(data):
        return data
    if isinstance(g(data, "wishes"), str):
        return {**spread(data), "wishes": json.loads(js_or(g(data, "wishes"), "{}")),
                "budget": json.loads(js_or(g(data, "budget"), "[]"))}
    return {**spread(data), "wishes": js_json(js_or(g(data, "wishes"), {})),
            "budget": js_json(js_or(g(data, "budget"), []))}


# ---------------------------------------------------------------------------
# HTTP client (stdlib only)
# ---------------------------------------------------------------------------
class Client:
    def __init__(self, base, verbose=False):
        self.base = base.rstrip("/")
        self.verbose = verbose
        self.token = None
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def _csrf(self):
        for c in self.jar:
            if c.name == "csrf_token":
                return c.value
        return None

    def req(self, method, path, body=None, form=None):
        headers = {"Accept": "application/json"}
        data = None
        if form is not None:
            data = urllib.parse.urlencode(form).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        elif body is not None:
            data = js_json(body).encode()
            headers["Content-Type"] = "application/json"
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        csrf = self._csrf()
        if csrf:
            headers["X-CSRF-Token"] = csrf
        r = urllib.request.Request(self.base + path, data=data, method=method, headers=headers)
        try:
            with self.opener.open(r, timeout=20) as resp:
                status, raw = resp.status, resp.read()
        except urllib.error.HTTPError as e:
            status, raw = e.code, e.read()
        except (urllib.error.URLError, OSError) as e:
            return 0, f"connection error: {e}"
        try:
            parsed = json.loads(raw) if raw else None
        except ValueError:
            parsed = raw[:200].decode(errors="replace")
        if self.verbose:
            print(f"    {method} {path} -> {status}")
            if body is not None:
                print(f"      sent: {js_json(body)[:600]}")
            print(f"      got:  {json.dumps(parsed)[:600]}")
        return status, parsed

    def login(self):
        self.req("GET", "/api/csrf-token")  # sets the double-submit cookie
        tried = []
        # Seeded dev user (backend/main.py:146-161), then the documented dev bypass
        # (backend/routers/auth.py:231-244).
        for user, pw in (("dev@continuum.im", "dev123"), ("jh@continuum.estate", "x")):
            st, resp = self.req("POST", "/api/auth/token", form={"username": user, "password": pw})
            if st == 200 and isinstance(resp, dict) and resp.get("access_token"):
                self.token = resp["access_token"]
                return user
            tried.append(f"{user}: {st} {resp}")
        return "FAILED (" + "; ".join(tried) + ")"


class Sync:
    """Port of SyncManager create/update/fetch (sync.svelte.ts:146-286)."""

    def __init__(self, client, endpoint, mapper=None, api_base="/api/data"):
        self.c, self.url, self.mapper = client, f"{api_base}/{endpoint}", mapper

    def _map(self, x):
        return self.mapper(x) if self.mapper else x

    def create(self, data):
        payload = to_wire(self._map(data))
        if isinstance(payload.get("id"), str) and len(payload["id"]) > 10:
            del payload["id"]
        payload = strip_undef(payload)
        st, resp = self.c.req("POST", self.url, body=payload)
        local = self._map(convert_keys(resp, to_camel)) if 200 <= st < 300 and isinstance(resp, dict) else None
        return payload, st, resp, local

    def update(self, local_item, updates):
        updated = {**local_item, **updates}
        payload = to_wire(self._map(updated))
        for k in ("id", "user_id", "created_at", "updated_at"):
            payload.pop(k, None)
        payload = strip_undef(payload)
        st, resp = self.c.req("PUT", f"{self.url}/{local_item['id']}", body=payload)
        return payload, st, resp

    def fetch_list(self):
        st, resp = self.c.req("GET", self.url)
        return st, resp

    def fetch_one(self, item_id):
        st, resp = self.fetch_list()
        if st != 200 or not isinstance(resp, list):
            return None, st, resp
        for r in resp:
            if isinstance(r, dict) and str(r.get("id")) == str(item_id):
                return r, st, resp
        return None, st, resp


# ---------------------------------------------------------------------------
# Diff + reporting
# ---------------------------------------------------------------------------
def same(sent, got):
    if isinstance(sent, bool) or isinstance(got, bool):
        return isinstance(sent, bool) and isinstance(got, bool) and sent == got
    if isinstance(sent, (int, float)) and isinstance(got, (int, float)):
        return float(sent) == float(got)
    if isinstance(sent, str) and isinstance(got, str):
        return sent == got or (re.fullmatch(r"\d{4}-\d{2}-\d{2}", sent) is not None and got.startswith(sent))
    if isinstance(sent, (list, dict)) and isinstance(got, str):
        try:
            return json.loads(got) == sent
        except ValueError:
            return False
    return sent == got


def diff(sent, got):
    problems = []
    for k, v in sent.items():
        if k not in got:
            problems.append(f"dropped {k}={json.dumps(v)[:40]}")
        elif not same(v, got[k]):
            problems.append(f"changed {k}: sent {json.dumps(v)[:40]} got {json.dumps(got[k])[:40]}")
    return problems


RESULTS = []


def report(name, refs, problems, note=""):
    verdict = "FAIL" if problems else "PASS"
    RESULTS.append((verdict, name))
    line = f"{verdict}  {name:<34} [{refs}]"
    if problems:
        line += "\n        " + "\n        ".join(problems)
    if note:
        line += f"\n        note: {note}"
    print(line, flush=True)


def check_create(name, refs, sync, ui_record, note=""):
    """Create via the store's real path, re-fetch the collection, diff every sent field."""
    payload, st, resp, local = sync.create(ui_record)
    if not (200 <= st < 300) or not isinstance(resp, dict) or resp.get("id") is None:
        problems = [f"POST {sync.url} -> {st}: {json.dumps(resp)[:300]}"]
        if 200 <= st < 300:  # success status but no record returned: did it persist?
            lst, rows = sync.fetch_list()
            n = len(rows) if isinstance(rows, list) else rows
            problems.append(f"success response has no id; GET {sync.url} -> {lst}, {n} row(s) listed")
        report(name, refs, problems, note)
        return None, None
    row, gst, _ = sync.fetch_one(resp["id"])
    if row is None:
        report(name, refs, [f"POST ok (id {resp['id']}) but GET {sync.url} -> {gst} does not list it"], note)
        return resp, local
    report(name, refs, diff(payload, row), note)
    return resp, local


def check_update(name, refs, sync, local_item, updates, note=""):
    payload, st, resp = sync.update(local_item, updates)
    if not (200 <= st < 300):
        report(name, refs, [f"PUT {sync.url}/{local_item['id']} -> {st}: {json.dumps(resp)[:300]}"], note)
        return
    row, gst, _ = sync.fetch_one(local_item["id"])
    if row is None:
        report(name, refs, [f"PUT ok but GET {sync.url} -> {gst} does not list id {local_item['id']}"], note)
        return
    report(name, refs, diff(payload, row), note)


# ---------------------------------------------------------------------------
# Scenario (synthetic data only)
# ---------------------------------------------------------------------------
def run(c):
    today = datetime.now().strftime("%-m/%-d/%Y")  # toLocaleDateString() en-US
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    # 1. Financial account + edit (AssetManager.svelte:195-211 create, 259-279 + 169-181 edit).
    fin = Sync(c, "financial_assets", financial_asset_mapper)
    created, local = check_create("financial account (create)", "CU-001", fin, {
        "name": "Synthetic Checking", "type": "Financial", "value": 12500,
        "location": "Synthetic Bank", "accountNumber": "****4321", "ownershipPercentage": 50,
        "beneficiaries": "Synthetic Son", "notes": "Joint with spouse",
        "loginUrl": "https://bank.example.test", "beneficiaryEmail": "son@example.test",
        "image": "", "is_closed": False, "closure_date": "",
        "closureNotes": "", "documents": "", "valueHistory": "[10000,12500]", "customAttributes": "{}"},
        note="closureNotes ('Transfer Instructions') and documents (uploader) are not in the UI create object at all")
    if local:
        a = local
        form = {"id": a["id"], "name": js_or(g(a, "name"), ""), "type": js_or(g(a, "type"), "Financial"),
                "value": js_or(g(a, "value"), 0), "location": js_or(g(a, "location"), ""),
                "accountNumber": "****9876", "ownershipPercentage": 25,
                "beneficiaries": js_or(g(a, "beneficiaries"), ""), "notes": js_or(g(a, "notes"), ""),
                "valueHistory": js_or(g(a, "valueHistory"), []), "loginUrl": js_or(g(a, "loginUrl"), ""),
                "beneficiaryEmail": js_or(g(a, "beneficiaryEmail"), ""), "image": js_or(g(a, "image"), ""),
                "is_closed": js_or(g(a, "is_closed"), False), "closure_date": js_or(g(a, "closure_date"), ""),
                "closureNotes": "Call Synthetic Advisor to transfer",
                "customAttributes": js_or(g(a, "customAttributes"), "{}"), "documents": ""}
        vh = form["valueHistory"]
        updates = {**form, "value": form["value"], "ownershipPercentage": 25, "customAttributes": "{}",
                   "valueHistory": js_json(vh) if isinstance(vh, list) else js_or(vh, "[]")}
        check_update("financial account (edit)", "CU-001", fin, local, updates)

    # 1b. Debt: the UI has no debt type (AssetManager.svelte:603-619); best available is type Other.
    check_create("financial debt (as type Other)", "CU-001", fin, {
        "name": "Synthetic Credit Card", "type": "Other", "value": 2400, "location": "Synthetic Card Co",
        "accountNumber": "****1111", "ownershipPercentage": 100, "beneficiaries": "",
        "notes": "Balance owed; pay from estate", "loginUrl": "https://card.example.test",
        "beneficiaryEmail": "", "image": "", "is_closed": False, "closure_date": "",
        "valueHistory": "[2400]", "customAttributes": "{}"},
        note="no debt/liability type exists in the UI; value is counted as an asset")

    # 2. Property (property/+page.svelte:67-78, 194-245; propertyStore.addItem adds a UUID id).
    prop = Sync(c, "properties", property_mapper)
    prop_created, _ = check_create("property", "CU-001", prop, {
        "name": "Synthetic House", "type": "Real Estate", "location": "1 Example Lane",
        "valuation": 350000, "status": "Owned", "ownershipDetails": "Joint with spouse",
        "documents": "Deed in fireproof safe", "notes": "Roof replaced 2020",
        "evidence": [{"id": str(uuid.uuid4()), "type": "image", "url": "blob:http://localhost/x",
                      "name": "front.jpg", "dateAdded": 1700000000000}],
        "thumbnail": "", "purchaseDate": "2015-06-01", "custom_attributes": "{}",
        "id": str(uuid.uuid4())})

    # 3. Subscription (subscriptions/+page.svelte:158-169, subscriptionStore mapper).
    check_create("subscription", "CU-001", Sync(c, "subscriptions", subscription_mapper), {
        "name": "Synthetic Streaming", "cost": 15.99, "cycle": "Monthly",
        "paymentMethod": "Visa ending 0000", "nextBilling": "2026-11-15", "difficulty": "Easy",
        "cancellationInstructions": "Cancel online under Account", "loginUrl": "https://stream.example.test",
        "notes": "Son may keep it", "custom_attributes": "{}"})

    # 4. Digital asset (digital-guardian/+page.svelte:194-204).
    dig = Sync(c, "digital_assets", digital_asset_mapper)
    dig_created, _ = check_create("digital asset", "CU-001/CU-004", dig, {
        "platform": "Synthetic Mail", "username": "parent@example.test", "description": "Email Account",
        "type": "Email", "preference": "none", "instructions": "", "priority": "medium", "isClosed": False})

    # 5. Heirloom (heirlooms/+page.svelte:236-248).
    heir = Sync(c, "heirlooms", heirloom_mapper)
    heir_created, _ = check_create("heirloom", "CU-004", heir, {
        "name": "Synthetic Pocket Watch", "recipient": "Synthetic Son",
        "story": "Your great-grandfather carried this watch every day. " * 3,
        "image": "https://example.test/watch.jpg", "custom_attributes": "{}"})

    # 6. CU-004: each category must list only its own record.
    ids = {"properties": (prop_created or {}).get("id"), "heirlooms": (heir_created or {}).get("id"),
           "digital_assets": (dig_created or {}).get("id")}
    fallback = ""
    if ids["digital_assets"] is None:
        # The UI payload cannot create a digital asset (no `name`); add only `name` so the
        # membership check has a row. Labelled as a fallback, not the UI payload.
        st, resp = c.req("POST", "/api/data/digital_assets",
                         body={"name": "Synthetic Mail", "platform": "Synthetic Mail", "type": "Email"})
        ids["digital_assets"] = resp.get("id") if isinstance(resp, dict) else None
        fallback = ("UI payload cannot create a digital asset; fallback {name, platform, type} "
                    + ("created one" if ids["digital_assets"] is not None else f"also failed ({st})"))
    problems = [f"{owner} record could not be created, so its membership is unverified"
                for owner, rid in ids.items() if rid is None]
    for coll in ids:
        st, rows = c.req("GET", f"/api/data/{coll}")
        listed = {str(r.get("id")) for r in rows} if isinstance(rows, list) else set()
        for owner, rid in ids.items():
            if rid is None:
                continue
            if owner == coll and str(rid) not in listed:
                problems.append(f"{owner} id {rid} missing from its own /api/data/{coll}")
            if owner != coll and str(rid) in listed:
                problems.append(f"{owner} id {rid} also listed in /api/data/{coll}")
    report("category membership", "CU-004", problems, fallback)

    # 7. Document vault (DocumentVault.svelte:72-78 endpoint, 113-123 create).
    check_create("document vault (vault_documents)", "CU-002", Sync(c, "vault_documents"), {
        "name": "Synthetic Will", "type": "Will", "date": today, "location": "Fireproof safe, study",
        "status": "verified", "witnesses": "Two synthetic witnesses", "nextReviewDate": "2027-10-26",
        "fileData": "data:application/pdf;base64,JVBERi0xLjQKJSBzeW50aGV0aWMK"})

    # 8. Time capsule (time-capsule/+page.svelte:63-78, timeCapsuleStore.addMessage:66-73).
    check_create("time capsule", "CU-009", Sync(c, "time_capsule", time_capsule_mapper), {
        "title": "For your 30th birthday", "recipient": "Synthetic Son",
        "contentPreview": "A synthetic message for a future day.", "triggerType": "date",
        "triggerValue": "2035-01-01", "mediaId": None, "custom_attributes": "{}",
        "id": str(uuid.uuid4()), "isReleased": False, "createdAt": now_iso})

    # 9. Letter (letters/+page.svelte:70-73 registry, 108-116 saveToVault).
    check_create("letter", "CU-008", Sync(c, "future_letters"), {
        "title": f"Letter to Loved One ({today})",
        "content": "Dear son,\n\nThis synthetic letter stands in for the real one. " * 20,
        "date": today, "type": "emotional", "triggerDate": "2030-01-01", "triggerMilestone": "",
        "isLocked": True},
        note="screen has no recipient field; recipient_name is never sent")

    # 10. Journal entry + edit (legacy-journal/+page.svelte:50-55, 126-140; journalStore mapper).
    jr = Sync(c, "journal_entries", journal_mapper)
    _, jlocal = check_create("journal entry (create)", "control", jr, {
        "type": "reflection", "title": "What I learned at 40", "content": "Synthetic reflection.", "tags": ""})
    if jlocal:
        entry = dict(jlocal)
        check_update("journal entry (edit)", "control", jr, jlocal,
                     {**entry, "title": "What I learned at 41", "content": "Edited synthetic reflection.",
                      "type": "reflection"})

    # 11. Home access (home-manual/+page.svelte:164-167; homeAccessStore mapper owns the key).
    check_create("home access", "control", Sync(c, "home_access", home_access_mapper), {
        "location": "Front door keypad", "code_encrypted": "2468"})

    # 12. Insurance (insurance/+page.svelte:70-84, 204-252; addPolicy adds a UUID id).
    check_create("insurance policy", "-", Sync(c, "insurance_policies", insurance_mapper), {
        "policyName": "Synthetic Term Life", "insuranceType": "Life", "insurer": "Example Mutual",
        "policyNumber": "POL-0001", "premiumAmount": 42.5, "premiumFrequency": "Monthly",
        "beneficiaries": "Synthetic Son", "agentName": "Synthetic Agent", "agentContact": "555-0100",
        "claimsProcedure": "Call claims line with death certificate", "status": "Active",
        "policyDocuments": "Policy binder in safe", "notes": "Paid by autopay",
        "custom_attributes": "{}", "id": str(uuid.uuid4())})

    # 13. Advisor contact (contacts/+page.svelte:138-160; familyStore.addMember adds a UUID id).
    check_create("advisor contact", "-", Sync(c, "contacts", contact_mapper, api_base="/api"), {
        "name": "Synthetic Advisor", "role": "Financial", "relation": "Financial advisor",
        "phone": "555-0101", "email": "advisor@example.test", "notes": "Knows every account",
        "isExecutor": False, "isBeneficiary": False, "isEmergencyContact": False, "tierId": None,
        "tier": "1_Immediate", "notificationStatus": "Pending", "avatar": UNDEF,
        "custom_attributes": "{}", "id": str(uuid.uuid4())})

    # 14. Final wishes: SingletonSyncManager (sync.svelte.ts:376-472) + funeral page editWish (66-76).
    final_wishes(c)


def final_wishes(c):
    url = "/api/data/funeral_data"
    problems = []
    data = funeral_mapper({})  # constructor: mapper(getStored(key, {}))
    st, raw = c.req("GET", url)  # sync()
    remote = funeral_mapper(convert_keys(raw, to_camel)) if st == 200 else None
    if st != 200:
        problems.append(f"GET {url} -> {st}")
    elif truthy(remote) and len(remote) > 0:
        data = remote  # updateLocal(remoteData)
    edits = [("venue", "Synthetic Chapel"), ("disposition", "Cremation")]
    for field, val in edits:
        current = data if truthy(data) else {}
        updated = {**current, "wishes": {**spread(g(current, "wishes")), field: val}}  # editWish
        data = {**spread(data), **updated}  # SingletonSyncManager.update
        payload = strip_undef(convert_keys(funeral_mapper(data), to_snake))
        st, resp = c.req("POST", url, body=payload)
        if not (200 <= st < 300):
            problems.append(f"save '{field}' POST -> {st}: {json.dumps(resp)[:200]}")
            break
        data = funeral_mapper(convert_keys(resp, to_camel))
    st, rows = c.req("GET", url)
    if not isinstance(rows, list):
        problems.append(f"reload GET -> {st}: {rows}")
    else:
        if len(rows) != 1:
            problems.append(f"reload returned {len(rows)} rows (expected one singleton record)")
        if rows:
            row = rows[-1]
            try:
                wishes = json.loads(row.get("wishes") or "{}")
            except ValueError:
                wishes = {}
            for field, val in edits:
                if wishes.get(field) != val:
                    problems.append(f"wishes.{field}: sent {val!r} got {wishes.get(field)!r}")
            stray = [k for k in wishes if k.isdigit()]
            if stray:
                problems.append(f"wishes has stray keys {stray} (object spread of a JSON string)")
            try:
                budget = json.loads(row.get("budget") or "[]")
            except ValueError:
                budget = None
            if not isinstance(budget, list):
                problems.append(f"budget is not a JSON list: {row.get('budget')!r}")
    report("final wishes (funeral_data)", "CU-011", problems)


def main():
    ap = argparse.ArgumentParser(description="T-A3 UI-payload smoke script (reports only; exit 0).")
    ap.add_argument("--base", default="http://localhost:8000", help="backend base URL")
    ap.add_argument("--verbose", action="store_true", help="print each request and response")
    args = ap.parse_args()
    c = Client(args.base, args.verbose)
    print(f"T-A3 smoke against {c.base}")
    who = c.login()
    print(f"login: {who}")
    if c.token:
        try:
            run(c)
        except Exception as e:  # report, never gate
            print(f"ERROR  script stopped early: {type(e).__name__}: {e}")
    passed = sum(1 for v, _ in RESULTS if v == "PASS")
    print(f"summary: {passed} PASS, {len(RESULTS) - passed} FAIL (report only; exit code is always 0)")
    return 0


if __name__ == "__main__":
    main()
    sys.exit(0)
