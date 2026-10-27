"""Finite configuration and one renderer for Continuum's seven AI uses.

Model-facing words live in ai_defaults.json or saved settings. This module
only binds declared data slots, applies visible inclusion policies and checks
visible limits; it never adds an instruction after rendering.
"""
from copy import deepcopy
import json
from pathlib import Path
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from backend.ai_capabilities import validate_selection

DEFAULTS = json.loads(Path(__file__).with_name("ai_defaults.json").read_text(encoding="utf-8"))
ROLES = ["owner", "executor", "family", "planner", "advisor"]
EMOTIONS = ["calm", "overwhelmed", "uncertain", "grieving", "healthy", "preparing", "terminal"]
INPUT_SLOTS = [
    {"key": key, "label": label, "type": kind, "description": description}
    for key, label, kind, description in (
        ("user_text", "Current user message", "text", "The current question or follow-up."),
        ("notes", "Writing notes", "text_list", "Notes represented as a JSON list, in supplied order."),
        ("field_label", "Current field label", "text", "The label of the field currently being edited, as shown in the interface."),
        ("field_question", "Current visible question", "text", "The exact visible question for the current field; context for the person's answer, not an asserted fact."),
        ("question_answers", "Earlier labeled questions and answers", "text_list", "Earlier supplied answers, each serialized with its visible question or field label, in order; not inferred source facts."),
        ("current_draft", "Current working draft", "text", "Edited text for a one-shot writing action, or the latest proposed conversation draft pending review; not proof saved or applied."),
        ("current_draft_source", "Current draft source", "text", "Whether this working draft is edited text or a proposal pending review. Omitted means no source was supplied."),
        ("job_brief", "Job brief", "text", "The retained purpose and instructions for this writing job."),
        ("document_title", "Document title", "text", "The current document's title."),
        ("document_type", "Document type", "text", "The current document's type."),
        ("recipient_name", "Recipient name", "text", "The recipient supplied by this job."),
        ("recipient_relationship", "Recipient relationship", "text", "The recipient's relationship to the author."),
        ("source_facts", "Source facts", "text_list", "Retained supplied facts represented as a JSON list."),
        ("context_name", "Page or module", "text", "The current task's page or module name."),
        ("user_role", "User perspective", "text", "Selects the configured role instruction."),
        ("emotional_state", "Emotional state", "text", "Selects the configured emotional branch."),
        ("warmth", "Warmth", "number", "Selects the configured tone band, from 0 to 100."),
        ("job_id", "Job identifier", "text", "An optional identifier; included only when referenced by a template."),
    )
]
SLOT_KEYS = [slot["key"] for slot in INPUT_SLOTS]
DERIVED_SLOTS = ["role_instruction", "overwhelm_instruction", "subject", "tone"]
ALLOWED_SLOTS = SLOT_KEYS + DERIVED_SLOTS
_TOKEN = re.compile(r"\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}")
_TEXT_FIELDS = ["shared_system_template", "system_template", "task_template", "context_template",
                "response_instruction", "placeholder_instruction", "overwhelm_instruction", "subject",
                "tone_direct", "tone_warm", "tone_tender"]


def _field(key: str, label: str, kind: str, **options) -> dict:
    return {"key": key, "label": label, "type": kind, **options}


CONFIG_FIELDS = [
    _field("application_name", "Application name", "text", slots=[], max_length=128),
    *[_field(key, label, "text", slots=ALLOWED_SLOTS, max_length=30000)
      for key, label in (
        ("shared_system_template", "Shared system instruction"),
        ("system_template", "Purpose system instruction"),
        ("task_template", "Current user task template"),
        ("context_template", "Job and document context template"),
        ("response_instruction", "Response format and behavior instruction"),
        ("placeholder_instruction", "Private placeholder instruction"),
        ("overwhelm_instruction", "Emotional-state instruction"),
        ("subject", "Writing subject"),
        ("tone_direct", "Lower warmth tone"), ("tone_warm", "Middle warmth tone"),
        ("tone_tender", "Higher warmth tone"))],
    _field("role_instructions", "Instructions by user perspective", "object", keys=ROLES,
           value_type="text", slots=SLOT_KEYS, max_length=30000),
    _field("overwhelm_states", "States that use the emotional instruction", "choices", options=EMOTIONS),
    _field("warmth_low_max", "Lower warmth band maximum", "integer", min=0, max=99),
    _field("warmth_mid_max", "Middle warmth band maximum", "integer", min=1, max=100),
    _field("history_enabled", "Include conversation history", "boolean"),
    _field("history_roles", "Included history roles", "choices", options=["user", "assistant"]),
    _field("history_sources", "Included history sources", "choices", options=["user", "model", "app"]),
    _field("max_history_messages", "History message limit (empty keeps full history)", "integer", nullable=True, min=1, max=1000),
    _field("included_inputs", "Eligible dynamic input slots", "choices", options=SLOT_KEYS),
    _field("max_input_chars", "Input character limit (refuse overflow)", "integer", min=100, max=2000000),
    _field("max_tokens", "Maximum output tokens", "integer", min=1, max=128000),
    _field("temperature", "Temperature (empty uses provider default)", "number", nullable=True, min=0, max=2),
    _field("ui_assets", "App-authored prompts, starters and templates", "object", value_type="registered_asset"),
]
for _descriptor in CONFIG_FIELDS:
    if _descriptor["key"] in ("subject", "tone_direct", "tone_warm", "tone_tender", "overwhelm_instruction"):
        _descriptor["slots"] = SLOT_KEYS


def merge_configuration(base: dict, patch: dict) -> dict:
    result = deepcopy(base)
    for key, value in patch.items():
        if key in ("role_instructions", "ui_assets"):
            if not isinstance(value, dict):
                raise ValueError("Use the displayed object settings.")
            result[key] = {**result.get(key, {}), **deepcopy(value)}
        else:
            result[key] = deepcopy(value)
    return result


def validate_configuration(config: dict, *, patch: bool = False) -> dict:
    if not isinstance(config, dict) or set(config) - set(DEFAULTS["shared"]):
        raise ValueError("Choose the registered request settings.")
    if len(json.dumps(config, ensure_ascii=False)) > 2000000:
        raise ValueError("Keep this configuration within two million characters.")
    complete = merge_configuration(DEFAULTS["shared"], config) if patch else config
    if set(complete) != set(DEFAULTS["shared"]):
        raise ValueError("Complete the request settings.")
    for field in CONFIG_FIELDS:
        key = field["key"]
        value = complete[key]
        if value is None and field.get("nullable"):
            continue
        kind = field["type"]
        if key == "application_name":
            if (not isinstance(value, str) or not 1 <= len(value) <= 128 or value != value.strip()
                    or any(ord(c) < 32 or ord(c) > 126 for c in value) or "{{" in value or "}}" in value):
                raise ValueError("Use an application name of 1–128 visible ASCII characters, with no surrounding spaces or templates.")
        elif kind == "text":
            _validate_text(value, field["slots"])
        elif kind == "boolean":
            if type(value) is not bool:
                raise ValueError(f"Choose a value for {field['label']}.")
        elif kind in ("integer", "number"):
            if (type(value) not in ((int,) if kind == "integer" else (int, float))
                    or not field["min"] <= value <= field["max"]):
                raise ValueError(f"Choose {field['label']} within its displayed range.")
        elif kind == "choices":
            if (not isinstance(value, list) or any(type(item) is not str or item not in field["options"] for item in value)
                    or len(value) != len(set(value))):
                raise ValueError(f"Choose the displayed options for {field['label']}.")
        elif key == "role_instructions":
            if not isinstance(value, dict) or set(value) - set(ROLES):
                raise ValueError("Choose a registered user perspective.")
            for text in value.values():
                _validate_text(text, SLOT_KEYS)
        elif key == "ui_assets":
            if not isinstance(value, dict) or set(value) - set(DEFAULTS["shared"]["ui_assets"]):
                raise ValueError("Choose a registered app prompt or starter.")
            for asset_key, asset in value.items():
                if not _asset_shape(asset, DEFAULTS["shared"]["ui_assets"][asset_key]):
                    raise ValueError("Keep this prompt or starter in its displayed data shape.")
    if ((not patch or {"warmth_low_max", "warmth_mid_max"} <= set(config))
            and complete["warmth_low_max"] >= complete["warmth_mid_max"]):
        raise ValueError("Set the lower warmth maximum below the middle maximum.")
    if patch:
        # Validate only the assets supplied by this write, not every shipped
        # asset on runtime configuration reads.
        descriptors = {asset["key"]: asset for asset in DEFAULTS["asset_fields"]}
        for asset_key, asset in config.get("ui_assets", {}).items():
            descriptor = descriptors[asset_key]
            try:
                _validate_asset_placeholders(asset, descriptor["placeholders"])
            except ValueError:
                raise ValueError(f"Use the displayed placeholders for {descriptor['label']}.") from None
    return config


def _validate_asset_placeholders(value: object, allowed: list[str]) -> None:
    if isinstance(value, str):
        _validate_text(value, allowed)
    elif isinstance(value, dict):
        for child in value.values():
            _validate_asset_placeholders(child, allowed)
    elif isinstance(value, list):
        for child in value:
            _validate_asset_placeholders(child, allowed)


def _validate_text(value: object, allowed: list[str]) -> None:
    if (not isinstance(value, str) or len(value) > 30000
            or any((ord(c) < 32 and c not in "\n\r\t") or ord(c) == 127 for c in value)):
        raise ValueError("Use plain text within 30,000 characters.")
    tokens = _TOKEN.findall(value)
    if any(token not in allowed for token in tokens) or "{{" in _TOKEN.sub("", value):
        raise ValueError("Use the displayed dynamic input placeholders.")


def _asset_shape(value: object, seed: object) -> bool:
    if isinstance(seed, str):
        return isinstance(value, str) and len(value) <= 30000
    if isinstance(seed, list):
        if not isinstance(value, list) or len(value) > 1000:
            return False
        if all(isinstance(item, str) for item in seed):
            return all(isinstance(item, str) and len(item) <= 30000 for item in value)
        return len(value) == len(seed) and all(_asset_shape(item, original) for item, original in zip(value, seed))
    if isinstance(seed, dict):
        return isinstance(value, dict) and set(value) == set(seed) and all(_asset_shape(value[k], seed[k]) for k in seed)
    return type(value) is type(seed)


class DynamicInputs(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_text: str = Field(default="", max_length=2000000)
    notes: list[str] = Field(default_factory=list, max_length=1000)
    field_label: str = Field(default="", max_length=20000)
    field_question: str = Field(default="", max_length=30000)
    question_answers: list[str] = Field(default_factory=list, max_length=1000)
    current_draft: str = Field(default="", max_length=2000000)
    current_draft_source: Literal["edited", "proposed"] | None = None
    job_brief: str = Field(default="", max_length=2000000)
    document_title: str = Field(default="", max_length=20000)
    document_type: str = Field(default="", max_length=1000)
    recipient_name: str = Field(default="", max_length=20000)
    recipient_relationship: str = Field(default="", max_length=20000)
    source_facts: list[str] = Field(default_factory=list, max_length=1000)
    context_name: str = Field(default="", max_length=1000)
    user_role: str = Field(default="", max_length=100)
    emotional_state: str = Field(default="", max_length=100)
    warmth: float | None = Field(default=None, ge=0, le=100)
    job_id: str = Field(default="", max_length=1000)


class HistoryMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000000)
    source: Literal["user", "model", "app"]


class StructuredRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    purpose: str = Field(max_length=64)
    variant: str = Field(default="", max_length=64)
    inputs: DynamicInputs = Field(default_factory=DynamicInputs)
    history: list[HistoryMessage] = Field(default_factory=list, max_length=1000)

    @model_validator(mode="after")
    def valid_request(self):
        validate_selection(self.purpose, self.variant)
        # A disclosed transport envelope bound; no data is silently sliced.
        if len(self.model_dump_json()) > 2100000:
            raise ValueError("Keep this request within the displayed transport envelope of 2.1 million characters.")
        return self


TRANSPORT_LIMITS = {
    "envelope_chars": 2100000, "history_messages": 1000, "history_message_chars": 2000000,
    "input_bounds": DynamicInputs.model_json_schema()["properties"],
}
for _slot in INPUT_SLOTS:
    _bounds = TRANSPORT_LIMITS["input_bounds"][_slot["key"]]
    for _source, _target in (("maxLength", "max_length"), ("maxItems", "max_items"),
                             ("minimum", "min"), ("maximum", "max")):
        if _source in _bounds:
            _slot[_target] = _bounds[_source]
    if _slot["key"] == "current_draft_source":
        _slot.update(options=["edited", "proposed"], nullable=True)
    if _slot["key"] == "warmth":
        _slot.update(min=0, max=100, nullable=True)


def assemble_request(body: StructuredRequest, resolved: dict, wire_model: str, transport: str) -> dict:
    config = resolved["effective_config"]
    raw = body.inputs.model_dump()
    values = {key: "" for key in ALLOWED_SLOTS}
    supplied = {key for key, value in raw.items() if value is not None and value != "" and value != []}
    eligible = supplied.intersection(config["included_inputs"])
    for key in eligible:
        value = raw[key]
        values[key] = json.dumps(value, ensure_ascii=False) if isinstance(value, list) else str(value)
    used = set()

    dependencies = {}

    def render(template: str, *, tracking: bool = True) -> str:
        def replace(match):
            key = match.group(1)
            if tracking:
                used.update(dependencies.get(key, {key}))
            return values[key]
        return _TOKEN.sub(replace, template)

    values["subject"] = render(config["subject"], tracking=False)
    dependencies["subject"] = set(_TOKEN.findall(config["subject"]))
    if "warmth" in eligible:
        warmth = raw["warmth"]
        band = "tone_direct" if warmth <= config["warmth_low_max"] else "tone_warm" if warmth <= config["warmth_mid_max"] else "tone_tender"
        values["tone"] = render(config[band], tracking=False)
        dependencies["tone"] = {"warmth", *_TOKEN.findall(config[band])}
    if "user_role" in eligible:
        role_template = config["role_instructions"].get(raw["user_role"], "")
        values["role_instruction"] = render(role_template, tracking=False)
        dependencies["role_instruction"] = {"user_role", *_TOKEN.findall(role_template)}
    if "emotional_state" in eligible:
        if raw["emotional_state"] in config["overwhelm_states"]:
            values["overwhelm_instruction"] = render(config["overwhelm_instruction"], tracking=False)
        dependencies["overwhelm_instruction"] = {"emotional_state", *_TOKEN.findall(config["overwhelm_instruction"])}
    system_parts = [render(config["shared_system_template"]), render(config["system_template"]),
                    *resolved["additional_contexts"], render(config["placeholder_instruction"]),
                    render(config["response_instruction"])]
    messages = []
    system = "\n\n".join(part for part in system_parts if part)
    if system:
        messages.append({"role": "system", "content": system})
    included_history = []
    omitted = []
    for index, item in enumerate(body.history):
        if (config["history_enabled"] and item.role in config["history_roles"]
                and item.source in config["history_sources"]):
            messages.append({"role": item.role, "content": item.content})
            included_history.append({"key": f"history[{index}]", "value": item.model_dump()})
        else:
            omitted.append({"key": f"history[{index}]", "reason": "Excluded by the saved history inclusion policy."})
    context = render(config["context_template"])
    if context:
        messages.append({"role": "user", "content": context})
    task = render(config["task_template"])
    if task:
        messages.append({"role": "user", "content": task})
    included = [{"key": key, "value": raw[key]} for key in SLOT_KEYS if key in eligible and key in used]
    for key in SLOT_KEYS:
        if key not in supplied:
            reason = "Input was not supplied."
        elif key not in eligible:
            reason = "Excluded by the saved input inclusion policy."
        elif key not in used:
            reason = "Not referenced by the saved templates."
        else:
            continue
        omitted.append({"key": key, "reason": reason})
    count = sum(len(message["content"]) for message in messages)
    reasons = []
    if count > config["max_input_chars"]:
        reasons.append("The assembled input exceeds the configured character limit.")
    if config["max_history_messages"] is not None and len(included_history) > config["max_history_messages"]:
        reasons.append("The selected history exceeds the configured history message limit.")
    if not messages:
        reasons.append("The configured request is empty.")
    payload = {"model": wire_model, "messages": messages, "max_tokens": config["max_tokens"]}
    if config["temperature"] is not None:
        payload["temperature"] = config["temperature"]
    return {"purpose": body.purpose, "variant": body.variant,
            "request": payload, "selected_model_id": resolved["model_id"], "transport": transport,
            "application_name": config["application_name"], "user_agent": config["application_name"],
            "sources": resolved["sources"], "included_inputs": included + included_history,
            "omitted_inputs": omitted,
            "limits": {"max_input_chars": config["max_input_chars"], "input_chars": count,
                       "max_history_messages": config["max_history_messages"], "history_messages": len(included_history),
                       "max_tokens": config["max_tokens"], "overflow": "refuse", "exceeded": bool(reasons), "reasons": reasons,
                       "character_counting": "Unicode code points", "transport_envelope_chars": 2100000,
                       "transport_limits": TRANSPORT_LIMITS},
            "can_send": not reasons}
