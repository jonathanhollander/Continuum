"""Run directly from the repo root; all records/storage are disposable, startup is skipped."""
import os
import tempfile
import unittest
from pathlib import Path

_sandbox = tempfile.TemporaryDirectory(prefix="continuum-signup-closure-")
os.environ.update({
    "DATABASE_URL": f"sqlite:///{_sandbox.name}/test.db",
    "UPLOAD_DIR": f"{_sandbox.name}/uploads",
    "OUTBOX_DIR": f"{_sandbox.name}/outbox",
    "ENVIRONMENT": "development", "PULSE_SCHEDULER_ENABLED": "false",
    "SIGNUP_ENABLED": "false", "POSTMARK_API_KEY": "", "SMTP_ENABLED": "false",
})
os.environ.pop("PRIVATE_ACCESS_USER_ID", None)

from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, select
from backend.main import app
from backend.config import settings
from backend.database import User, engine
from backend.auth import get_password_hash
from backend.private_access import require_signup_enabled


class SignupClosureTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        settings.PRIVATE_ACCESS_USER_ID = None
        SQLModel.metadata.create_all(engine)
        with Session(engine) as session:
            for number in (1, 2):
                session.add(User(email=f"existing{number}@example.com", external_id=f"existing-{number}",
                                 hashed_password=get_password_hash("Synthetic-password-123!")))
            session.commit()
        # No context manager: do not run the app lifespan or seed/scheduler.
        cls.client = TestClient(app)

    def test_public_access_with_registration_closed(self):
        response = self.client.get("/api/auth/access-status")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"private_mode": False, "signup_enabled": False, "access_allowed": True})
        self.assertEqual(response.headers["cache-control"], "no-store")
        for path in ("/", "/marketing2", "/login", "/signup"):
            self.assertEqual(self.client.get(path).status_code, 200, path)

    def test_all_registration_paths_refused_before_validation_or_mutation(self):
        for path in ("/api/auth/signup", "/api/auth/passkey/register/start", "/api/auth/passkey/register/finish"):
            for suffix in ("", "/"):
                response = self.client.post(path + suffix, json={})
                self.assertEqual(response.status_code, 403, path + suffix)
                self.assertIn("New signups", response.json()["detail"])
        with Session(engine) as session:
            self.assertEqual(len(session.exec(select(User)).all()), 2)
        self.assertEqual(list(Path(settings.OUTBOX_DIR).glob("**/*")), [])

    def test_existing_accounts_can_login_reload_and_refresh(self):
        for number in (1, 2):
            email = f"existing{number}@example.com"
            response = self.client.post("/api/auth/token", data={"username": email, "password": "Synthetic-password-123!"})
            self.assertEqual(response.status_code, 200, response.text)
            tokens = response.json()
            headers = {"Authorization": "Bearer " + tokens["access_token"]}
            self.assertEqual(self.client.get("/api/auth/me", headers=headers).json()["email"], email)
            renewed = self.client.post("/api/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
            self.assertEqual(renewed.status_code, 200, renewed.text)
            self.assertEqual(self.client.get("/api/auth/me", headers={"Authorization": "Bearer " + renewed.json()["access_token"]}).json()["email"], email)

    def test_explicit_reopening_and_separate_private_mode(self):
        try:
            settings.SIGNUP_ENABLED = True
            require_signup_enabled()
            self.assertTrue(self.client.get("/api/auth/access-status").json()["signup_enabled"])
            settings.PRIVATE_ACCESS_USER_ID = 1
            status = self.client.get("/api/auth/access-status").json()
            self.assertEqual(status, {"private_mode": True, "signup_enabled": False, "access_allowed": False})
        finally:
            settings.SIGNUP_ENABLED = False
            settings.PRIVATE_ACCESS_USER_ID = None


if __name__ == "__main__":
    try:
        unittest.main()
    finally:
        _sandbox.cleanup()
