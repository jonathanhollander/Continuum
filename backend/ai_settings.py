"""Small settings resolver and Bifrost catalogue adapter.

Catalogue parsing and the successful-read cache are adapted from Jonathan's
ClaimsChat: admin/model_catalog.py (_live_model_ids and metadata helpers), and
admin/model_catalog_runtime.py (60-second cache and coalesced reads), commit
1b7cb5fb6381e15c0b46f939291ae287b405d63b. ClaimsChat's gateway governance,
credential provisioning and department policy are intentionally not imported.
"""
import asyncio
import hashlib
import json
import re
from copy import deepcopy
from decimal import Decimal, InvalidOperation
from time import monotonic
from urllib.parse import urlsplit

import httpx
from sqlmodel import Session, select

from backend.ai_capabilities import DEFAULT_MODEL, PURPOSES
from backend.config import settings
from backend.models.ai_settings import AISetting
from backend.ai_request import (DEFAULTS, CONFIG_FIELDS, INPUT_SLOTS, TRANSPORT_LIMITS, StructuredRequest,
                                assemble_request, merge_configuration, validate_configuration)
from backend.utils.clock import utc_now

UNAVAILABLE_MESSAGE = (
    "AI help is resting right now. Everything else is here for you, "
    "and you can come back whenever you're ready."
)
_client: httpx.AsyncClient | None = None
_catalogue_cache: tuple[tuple[str, str], float, dict] | None = None
_catalogue_lock = asyncio.Lock()
_MAX_CATALOGUE_BYTES = 8 * 1024 * 1024
_MAX_CATALOGUE_MODELS = 5000
_MAX_SETTINGS = 1 + sum(1 + len(definition[1]) for definition in PURPOSES.values())
_MODALITIES = frozenset({"audio", "embeddings", "image", "text", "video"})
_METHODS = frozenset({"chat_completion", "chat_completion_stream", "embedding",
                      "image_generation", "speech", "transcription", "responses"})
_REASONING = frozenset({"reasoning", "reasoning_effort", "include_reasoning"})
_TOOLS = frozenset({"tools", "tool_choice", "parallel_tool_calls"})


def gateway_configuration() -> tuple[str, str] | None:
    origin = (settings.BIFROST_BASE_URL or "").rstrip("/")
    key = settings.BIFROST_VIRTUAL_KEY or ""
    try:
        parsed = urlsplit(origin)
        _ = parsed.port  # Validate a configured port as well as the origin shape.
    except ValueError:
        return None
    if (parsed.scheme not in ("http", "https") or not parsed.hostname or parsed.username
            or parsed.password or parsed.query or parsed.fragment or parsed.path
            or any(c.isspace() or ord(c) < 32 for c in origin)
            or not key or any(ord(c) < 33 or ord(c) > 126 for c in key)):
        return None
    return origin, key


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=httpx.Timeout(45.0, connect=10.0),
                                    follow_redirects=False, trust_env=False)
    return _client


def gateway_headers(key: str) -> dict[str, str]:
    return {"x-bf-vk": key, "Accept": "application/json", "Content-Type": "application/json"}


def validate_model_id(value: str | None) -> str | None:
    if value is None:
        return None
    if (not value or value != value.strip() or len(value) > 256
            or any(c.isspace() or ord(c) < 33 or ord(c) == 127 for c in value)
            or "/" not in value or not value.split("/", 1)[1]
            or re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", value.split("/", 1)[0]) is None):
        raise ValueError("Choose a model with its gateway provider prefix.")
    return value


def read_settings(session: Session) -> dict[tuple[str, str], AISetting]:
    rows = session.exec(select(AISetting).where(
        AISetting.purpose.in_(("shared", *PURPOSES))).limit(_MAX_SETTINGS)).all()
    return {(row.purpose, row.variant): row for row in rows}


def resolve_setting(rows: dict, purpose: str, variant: str = "") -> tuple[str, list[str]]:
    scopes = [("shared", "")]
    if purpose != "shared":
        scopes.append((purpose, ""))
        if variant:
            scopes.append((purpose, variant))
    model = DEFAULT_MODEL
    contexts = []
    for scope in scopes:
        row = rows.get(scope)
        if row is not None:
            model = row.model_id or model
            if row.additional_context:
                contexts.append(row.additional_context)
    return model, contexts


def resolve_configuration(rows: dict, purpose: str, variant: str = "", *, saved: bool = True,
                          skip: tuple[str, str] | None = None) -> dict:
    config = {}
    sources = {}

    def apply(patch: dict, source: str):
        nonlocal config
        config = merge_configuration(config, patch)
        for key, value in patch.items():
            if key in ("role_instructions", "ui_assets"):
                for child in value:
                    sources[f"{key}.{child}"] = source
                leaf_sources = {sources.get(f"{key}.{child}") for child in config[key]}
                sources[key] = next(iter(leaf_sources)) if len(leaf_sources) == 1 else "mixed"
            else:
                sources[key] = source

    apply(DEFAULTS["shared"], "shipped.shared")
    if purpose != "shared":
        apply(DEFAULTS["purposes"].get(purpose, {}), f"shipped.{purpose}")
        if variant:
            apply(DEFAULTS["variants"].get(purpose, {}).get(variant, {}), f"shipped.{purpose}:{variant}")
    scopes = [("shared", "")]
    if purpose != "shared":
        scopes.append((purpose, ""))
        if variant:
            scopes.append((purpose, variant))
    if saved:
        for scope in scopes:
            row = rows.get(scope)
            if row is not None and scope != skip:
                apply(row.request_config or {}, f"saved.{scope[0]}" + (f":{scope[1]}" if scope[1] else ""))
    validate_configuration(config)
    model_id, contexts = resolve_setting(rows, purpose, variant)
    model_source = "shipped.shared"
    for scope in scopes:
        row = rows.get(scope)
        if row is not None:
            label = f"saved.{scope[0]}" + (f":{scope[1]}" if scope[1] else "")
            if row.model_id:
                model_source = label
            if row.additional_context:
                sources[f"additional_context.{scope[0]}:{scope[1]}"] = label
    sources["model_id"] = model_source
    return {"effective_config": config, "sources": sources, "model_id": model_id,
            "additional_contexts": contexts}


def settings_view(session: Session, purpose: str = "shared", variant: str = "", *,
                  changed_scope: tuple[str, str] | None = None) -> dict:
    rows = read_settings(session)
    if changed_scope is not None:
        changed_purpose, changed_variant = changed_scope
        affected = PURPOSES if changed_purpose == "shared" else {changed_purpose: PURPOSES[changed_purpose]}
        for runtime_purpose, (label, variants, _) in affected.items():
            for runtime_variant in ((changed_variant,) if changed_variant else variants or ("",)):
                try:
                    resolve_configuration(rows, runtime_purpose, runtime_variant)
                except ValueError as error:
                    context = f" / {runtime_variant}" if runtime_variant else ""
                    raise ValueError(f"Review {label}{context}: {error}") from None

    def view(purpose: str, variant: str = "") -> dict:
        row = rows.get((purpose, variant))
        return {"purpose": purpose, "variant": variant,
                "model_id": row.model_id if row else None,
                "additional_context": row.additional_context if row else "",
                "effective_model_id": resolve_setting(rows, purpose, variant)[0],
                "configured": row is not None}

    resolved = resolve_configuration(rows, purpose, variant)
    row = rows.get((purpose, variant))
    return {
        "gateway_configured": gateway_configuration() is not None,
        "shipped_model_id": DEFAULT_MODEL,
        "shared": view("shared"),
        "purposes": [{"id": key, "label": label, "variants": list(variants),
                      "output_format": output} for key, (label, variants, output) in PURPOSES.items()],
        "overrides": [view(purpose, variant) for purpose, variant in sorted(rows)
                      if purpose in PURPOSES],
        "selected": {**view(purpose, variant), "request_config": deepcopy(row.request_config or {}) if row else {},
                     "effective_config": resolved["effective_config"], "sources": resolved["sources"],
                     "default_config": resolve_configuration(rows, purpose, variant, saved=False)["effective_config"],
                     "inherited_config": resolve_configuration(rows, purpose, variant, skip=(purpose, variant))["effective_config"]},
        "config_fields": CONFIG_FIELDS, "input_slots": INPUT_SLOTS,
        "asset_fields": DEFAULTS["asset_fields"],
        "transport_limits": TRANSPORT_LIMITS,
        "assembly_order": ["shared_system_template", "system_template", "additional_contexts", "placeholder_instruction",
                           "response_instruction", "selected history", "context_template", "task_template"],
        "implementation_constraints": {
            "privacy": "Dynamic inputs and history are redacted in the initiating browser; original-value mappings stay there.",
            "parsing": "Concierge and grief parse JSON messages; writing helpers return reviewed text suggestions.",
            "preview": "Continuum final request; gateway/provider transformations are separate.",
            "transport_envelope_chars": 2100000,
        },
    }


def runtime_config(session: Session, purpose: str, variant: str) -> dict:
    resolved = resolve_configuration(read_settings(session), purpose, variant)
    return {"effective_config": resolved["effective_config"], "ui_assets": resolved["effective_config"]["ui_assets"],
            "input_slots": INPUT_SLOTS}


def request_transport(model_id: str) -> dict:
    if settings.BIFROST_VIRTUAL_KEY:
        configuration = gateway_configuration()
        if configuration is None:
            return {"name": "unconfigured_gateway", "model": model_id, "url": None, "headers": {}}
        origin, key = configuration
        return {"name": "bifrost", "model": model_id, "url": f"{origin}/v1/chat/completions", "headers": gateway_headers(key)}
    key = settings.OPENROUTER_API_KEY or settings.VITE_OPENROUTER_API_KEY
    if key and model_id.startswith("openrouter/"):
        return {"name": "legacy_openrouter", "model": model_id.removeprefix("openrouter/"),
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "headers": {"Authorization": f"Bearer {key}", "HTTP-Referer": "https://continuum.estate",
                            "X-Title": "Continuum Estate", "Content-Type": "application/json"}}
    return {"name": "unconfigured", "model": model_id, "url": None, "headers": {}}


def prepare_request(session: Session, body: StructuredRequest) -> tuple[dict, dict]:
    resolved = resolve_configuration(read_settings(session), body.purpose, body.variant)
    transport = request_transport(resolved["model_id"])
    prepared = assemble_request(body, resolved, transport["model"], transport["name"])
    prepared["can_send"] = prepared["can_send"] and transport["url"] is not None
    return prepared, transport


def _known_tokens(value: object, allowed: frozenset[str]) -> set[str]:
    return {item for item in value if isinstance(item, str) and item in allowed} if isinstance(value, list) else set()


def _optional_model_name(value: object) -> str | None:
    if (not isinstance(value, str) or not value.strip() or len(value.strip()) > 256
            or any(ord(c) < 32 or ord(c) == 127 for c in value)):
        return None
    return value.strip()


def _price_per_token(value: object) -> str | None:
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        return None
    try:
        price = Decimal(str(value))
    except InvalidOperation:
        return None
    return str(price) if price.is_finite() and price >= 0 else None


def _positive_int(value: object) -> int | None:
    return value if type(value) is int and value > 0 else None


def normalize_models(response: object) -> list[dict]:
    """ClaimsChat's tolerant metadata projection, retaining exact qualified IDs."""
    if not isinstance(response, dict) or not isinstance(response.get("data"), list):
        raise ValueError("catalogue shape")
    if len(response["data"]) > _MAX_CATALOGUE_MODELS:
        raise ValueError("catalogue size")
    models = {}
    for raw in response["data"]:
        if not isinstance(raw, dict):
            raise ValueError("catalogue row")
        model_id = raw.get("id")
        if not isinstance(model_id, str):
            raise ValueError("catalogue identifier")
        # Qualify native IDs once, using their explicit provider. Never strip
        # a model's own slash-separated slug or add a second provider prefix.
        provider = raw.get("owned_by")
        if (isinstance(provider, str)
                and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", provider)):
            if not model_id.startswith(f"{provider}/"):
                model_id = f"{provider}/{model_id}"
        else:
            provider = model_id.split("/", 1)[0]
        validate_model_id(model_id)
        if model_id in models:
            continue
        architecture = raw.get("architecture")
        architecture = architecture if isinstance(architecture, dict) else {}
        inputs = _known_tokens(architecture.get("input_modalities"), _MODALITIES)
        outputs = _known_tokens(architecture.get("output_modalities"), _MODALITIES)
        methods = _known_tokens(raw.get("supported_methods"), _METHODS)
        parameters = _known_tokens(raw.get("supported_parameters"), _REASONING | _TOOLS)
        capabilities = []
        if "chat_completion" in methods or ("text" in inputs and "text" in outputs):
            capabilities.append("Chat")
        if parameters & _REASONING:
            capabilities.append("Reasoning")
        if inputs & {"image", "video"}:
            capabilities.append("Vision")
        if "image_generation" in methods or "image" in outputs:
            capabilities.append("Image generation")
        if (methods & {"speech", "transcription"} or "audio" in inputs or "audio" in outputs
                or isinstance(raw.get("supported_voices"), list) and raw["supported_voices"]):
            capabilities.append("Voice / audio")
        if "embedding" in methods or "embeddings" in outputs:
            capabilities.append("Embeddings")
        if parameters & _TOOLS:
            capabilities.append("Tools")
        pricing = raw.get("pricing")
        pricing = pricing if isinstance(pricing, dict) else {}
        top_provider = raw.get("top_provider")
        top_provider = top_provider if isinstance(top_provider, dict) else {}
        name = _optional_model_name(raw.get("name"))
        models[model_id] = {
            "id": model_id, "provider": provider, "name": name if name != model_id else None,
            "created": raw["created"] if type(raw.get("created")) is int else None,
            "context_length": _positive_int(raw.get("context_length")) or _positive_int(raw.get("max_input_tokens")),
            "max_output_tokens": _positive_int(top_provider.get("max_completion_tokens")) or _positive_int(raw.get("max_output_tokens")),
            "input_price_per_token": _price_per_token(pricing.get("prompt")),
            "output_price_per_token": _price_per_token(pricing.get("completion")),
            "capabilities": capabilities,
        }
    return sorted(models.values(), key=lambda row: (row["created"] is None, -(row["created"] or 0)))


async def model_catalogue(refresh: bool = False) -> dict:
    """Coalesce reads, cache successes for 60s, and retain a failed refresh's list."""
    global _catalogue_cache
    configuration = gateway_configuration()
    if configuration is None:
        return {"status": "not_configured", "models": [], "fetched_at": None,
                "message": "Your administrator can connect the AI gateway."}
    origin, key = configuration
    identity = (origin, hashlib.sha256(key.encode()).hexdigest())

    def cached(fresh: bool = False) -> dict | None:
        if (_catalogue_cache and _catalogue_cache[0] == identity
                and (not fresh or monotonic() - _catalogue_cache[1] <= 60)):
            return _catalogue_cache[2]
        return None

    if not refresh and (snapshot := cached(fresh=True)) is not None:
        return snapshot
    async with _catalogue_lock:
        if not refresh and (snapshot := cached(fresh=True)) is not None:
            return snapshot
        try:
            async with get_client().stream("GET", f"{origin}/v1/models", headers=gateway_headers(key)) as response:
                response.raise_for_status()
                chunks = bytearray()
                async for chunk in response.aiter_bytes():
                    chunks.extend(chunk)
                    if len(chunks) > _MAX_CATALOGUE_BYTES:
                        raise ValueError("catalogue size")
            models = normalize_models(json.loads(chunks))
        except (httpx.HTTPError, ValueError, UnicodeDecodeError):
            previous = cached()
            failed = {"status": "unavailable", "models": previous["models"] if previous else [],
                      "fetched_at": previous["fetched_at"] if previous else None,
                      "message": "Your saved choices are here. You can refresh the model list again."}
            if previous is not None:
                _catalogue_cache = (identity, _catalogue_cache[1], failed)
            return failed
        snapshot = {"status": "ready", "models": models, "fetched_at": utc_now().isoformat() + "Z"}
        _catalogue_cache = (identity, monotonic(), snapshot)
        return snapshot
