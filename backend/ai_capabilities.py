"""The bounded AI uses shared by settings and the chat proxy."""

MODULE_VARIANTS = (
    "obituary", "letters", "executor", "heirlooms", "legal_explainer", "contacts",
    "medical", "pets", "property", "insurance", "digital-guardian", "visual-memories",
    "financial", "activity-log", "subscriptions", "advanced-registry", "qr-codes",
    "home-manual", "calendar",
)
WRITER_VARIANTS = (
    "heirloom", "timeline", "contact", "pet", "funeral", "letter", "ethical_will",
    "life_lesson", "storytelling",
)
PURPOSES = {
    "concierge.chat": ("Main concierge", (), "json"),
    "concierge.module_prompt": ("Module assistant", MODULE_VARIANTS, "json"),
    "grief.chat": ("Grief support", (), "json"),
    "writer.draft_text": ("Draft a passage", WRITER_VARIANTS, "text"),
    "writer.rewrite_text": ("Rewrite a passage", WRITER_VARIANTS, "text"),
    "letter.draft": ("Draft a letter", (), "text"),
    "letter.rewrite": ("Rewrite a letter", (), "text"),
}
DEFAULT_MODEL = "openrouter/google/gemini-2.0-flash-001"


def validate_selection(purpose: str, variant: str = "", *, allow_shared: bool = False) -> None:
    if allow_shared and purpose == "shared" and variant == "":
        return
    if (purpose not in PURPOSES or (variant and variant not in PURPOSES[purpose][1])
            or (not variant and PURPOSES[purpose][1] and not allow_shared)):
        raise ValueError("Choose an AI use and one of its contexts.")


def required_output(purpose: str) -> str:
    """Keep the existing consumers' functional response contracts explicit."""
    privacy = "Keep every bracketed REDACTED token exactly as supplied."
    if purpose.startswith("concierge."):
        return (
            f"{privacy} Return only a JSON object with a string message. Optional fields are "
            "extractedData, resources (title, description, link, type), and intent. "
            "Intent, when supplied, is one of add_contact, add_property, add_financial, "
            "add_insurance, add_healthcare, add_digital, suggest_break, provide_resource."
        )
    if purpose == "grief.chat":
        return (
            f"{privacy} Return only a JSON object with a string message. Optional fields are "
            "suggestedResources (strings) and suggestAction (discovery, hotline, or break)."
        )
    return (
        f"{privacy} Preserve the author's meaning, facts, names and signatures. "
        "Use only supplied facts and memories. Return the suggested passage or letter as "
        "plain text alone, with no title, notes, quotation marks, markdown or JSON."
    )
