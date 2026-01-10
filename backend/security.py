import os
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
)
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    AuthenticatorAttachment,
    UserVerificationRequirement,
    ResidentKeyRequirement,
)

RP_ID = os.getenv("RP_ID", "localhost")
RP_NAME = "Continuum Estate"
ORIGIN = os.getenv("ORIGIN", "http://localhost:5173")

def get_registration_options(user_id: str, email: str):
    """Generates options for WebAuthn registration (Passkey creation)."""
    return generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user_id,
        user_name=email,
        attestation=AttestationConveyancePreference.NONE,
        authenticator_selection=AuthenticatorSelectionCriteria(
            authenticator_attachment=AuthenticatorAttachment.PLATFORM,
            user_verification=UserVerificationRequirement.REQUIRED,
            resident_key=ResidentKeyRequirement.REQUIRED,
        ),
    )

def verify_registration(options: dict, response: dict):
    """Verifies the registration response from the client."""
    return verify_registration_response(
        credential=response,
        expected_challenge=options["challenge"],
        expected_origin=ORIGIN,
        expected_rp_id=RP_ID,
        require_user_verification=True,
    )

def get_authentication_options():
    """Generates options for WebAuthn authentication (Passkey login)."""
    return generate_authentication_options(
        rp_id=RP_ID,
        user_verification=UserVerificationRequirement.REQUIRED,
    )

def verify_authentication(options: dict, response: dict, public_key: str, sign_count: int):
    """Verifies the authentication response (assertion) from the client."""
    return verify_authentication_response(
        credential=response,
        expected_challenge=options["challenge"],
        expected_origin=ORIGIN,
        expected_rp_id=RP_ID,
        credential_public_key=public_key,
        credential_current_sign_count=sign_count,
        require_user_verification=True,
    )
