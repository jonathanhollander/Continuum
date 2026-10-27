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
