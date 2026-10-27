"""Mark naive-UTC datetimes as UTC in every JSON response.

Timestamps are stored as naive UTC (see `utc_now()`), so FastAPI and pydantic write them
without an offset ("2026-10-27T18:46:51.123456") and browsers read them as local time.
This ASGI middleware appends "Z" to any JSON string value shaped exactly like a naive ISO
datetime with fractional seconds, which is what a stored `utc_now()` value serializes to. It runs on the final body, so it covers response models (including
FastAPI's direct pydantic fast path), plain dicts, table models and stored JSON blobs alike.
Values that already carry "Z" or an offset are left as they are, and so are whole-second values
such as calendar dates kept as midnight datetimes ("2027-03-10T00:00:00"), which read as local dates.
"""
import json
import re

_NAIVE_ISO = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,6}")


def _mark_utc(value):
    if isinstance(value, str):
        return value + "Z" if _NAIVE_ISO.fullmatch(value) else value
    if isinstance(value, list):
        return [_mark_utc(v) for v in value]
    if isinstance(value, dict):
        return {k: _mark_utc(v) for k, v in value.items()}
    return value


class UtcJsonMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        start = None
        chunks = []

        async def send_marked(message):
            nonlocal start
            if message["type"] == "http.response.start":
                headers = {k.lower(): v for k, v in message.get("headers", [])}
                if headers.get(b"content-type", b"").startswith(b"application/json") and b"content-encoding" not in headers:
                    start = message
                    return
            elif message["type"] == "http.response.body" and start is not None:
                chunks.append(message.get("body", b""))
                if message.get("more_body"):
                    return
                body = b"".join(chunks)
                try:
                    body = json.dumps(_mark_utc(json.loads(body)), ensure_ascii=False, separators=(",", ":")).encode("utf-8")
                except ValueError:
                    pass
                headers = [(k, v) for k, v in start.get("headers", []) if k.lower() != b"content-length"]
                headers.append((b"content-length", str(len(body)).encode()))
                await send({**start, "headers": headers})
                await send({"type": "http.response.body", "body": body})
                return
            await send(message)

        await self.app(scope, receive, send_marked)
