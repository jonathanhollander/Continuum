"""Validation for request bodies typed as SQLModel table models.

FastAPI skips validation for `table=True` models, so a missing required field or a wrong
type reaches the database and returns a 500. These helpers re-run model_validate and turn a
ValidationError into a gentle 422 (same wording as estate_data.create_item).
"""
from fastapi import HTTPException

GENTLE_422 = "A detail here needs a second look before it saves."


def validated_new(model, item, user_id: int, **server_fields):
    """A fresh row from the fields the client sent, with the server-owned user_id (and any
    other server_fields) set. id is left unset so the database generates it."""
    data = item.model_dump(exclude_unset=True, exclude={"id"})
    try:
        return model.model_validate({**data, **server_fields, "user_id": user_id})
    except ValueError:
        raise HTTPException(status_code=422, detail=GENTLE_422)


def validated_changes(model, row, changes: dict) -> dict:
    """Check `changes` merged onto the stored `row`; return the changes coerced to the
    model's types (e.g. "6" -> 6). Omitted fields keep the row's values."""
    try:
        merged = model.model_validate({**row.model_dump(), **changes})
    except ValueError:
        raise HTTPException(status_code=422, detail=GENTLE_422)
    return {key: getattr(merged, key) for key in changes}
