from backend.utils.logger import get_logger
from backend.config import settings
import base64
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    AttestationConveyancePreference,
    AuthenticatorSelectionCriteria,
    AuthenticatorAttachment,
    UserVerificationRequirement,
    ResidentKeyRequirement,
    PublicKeyCredentialDescriptor,
    AuthenticatorTransport,
)
from typing import List, Optional

logger = get_logger(__name__)

RP_ID = settings.RP_ID
RP_NAME = settings.RP_NAME
ORIGIN = settings.ORIGIN

def get_registration_options(user_id: str, email: str):
    """Generates options for WebAuthn registration (Passkey creation)."""
    logger.debug(f"user_id: {user_id} (type: {type(user_id)})")
    return generate_registration_options(
        rp_id=RP_ID,
        rp_name=RP_NAME,
        user_id=user_id.encode("utf-8") if isinstance(user_id, str) else user_id,
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

def get_authentication_options(credentials: Optional[List[dict]] = None):
    """
    Generates options for WebAuthn authentication (Passkey login).

    Args:
        credentials: Optional list of credential dicts with 'id' (base64url) and optional 'transports'.
                    If provided, restricts authentication to these credentials only.
                    Setting transports to ['internal'] prevents QR code cross-device flow.
    """
    allow_credentials = None

    if credentials:
        allow_credentials = []
        for cred in credentials:
            # Decode credential ID from base64url
            cred_id = cred.get('id')
            if isinstance(cred_id, str):
                padding = '=' * (4 - (len(cred_id) % 4)) if len(cred_id) % 4 != 0 else ''
                cred_id = base64.urlsafe_b64decode(cred_id + padding)

            # Use stored transports if available, otherwise default to internal only
            stored_transports = cred.get('transports', [])
            if stored_transports:
                # Map string transports to AuthenticatorTransport enum
                transport_map = {
                    'internal': AuthenticatorTransport.INTERNAL,
                    'hybrid': AuthenticatorTransport.HYBRID,
                    'usb': AuthenticatorTransport.USB,
                    'ble': AuthenticatorTransport.BLE,
                    'nfc': AuthenticatorTransport.NFC,
                }
                transports = [transport_map.get(t, AuthenticatorTransport.INTERNAL) for t in stored_transports if t in transport_map]
                # Always include internal to prefer platform authenticator
                if AuthenticatorTransport.INTERNAL not in transports:
                    transports.insert(0, AuthenticatorTransport.INTERNAL)
            else:
                # Default: internal only to prevent QR code
                transports = [AuthenticatorTransport.INTERNAL]

            logger.debug(f"Credential {cred_id[:20]}... using transports: {transports}")

            allow_credentials.append(
                PublicKeyCredentialDescriptor(
                    id=cred_id,
                    transports=transports,
                )
            )

    return generate_authentication_options(
        rp_id=RP_ID,
        user_verification=UserVerificationRequirement.REQUIRED,
        allow_credentials=allow_credentials,
    )

def verify_authentication(options: dict, response: dict, public_key: str, sign_count: int):
    """Verifies the authentication response (assertion) from the client."""
    # Ensure public_key is bytes. If it's a string, it's likely base64url encoded.
    pk_bytes = public_key
    if isinstance(public_key, str):
        # Some old data might be stored as "b'...'". Let's handle it gracefully.
        if public_key.startswith("b'") and public_key.endswith("'"):
            # This is a nasty artifact of str(bytes) in Python 3.
            # We can't easily recover the original bytes without eval or complex parsing
            # if non-printable chars were present, but we try a simple fix or fail.
            logger.warning(f"Detected corrupted byte-string format: {public_key}")
            # Try to recover if possible, but standard fix is to re-register.
            # For now, let's assume it's base64url as per our new standard.
            pass
        
        try:
            # base64url decoding with padding correction
            padding = '=' * (4 - (len(public_key) % 4)) if len(public_key) % 4 != 0 else ''
            pk_bytes = base64.urlsafe_b64decode(public_key + padding)
        except Exception as e:
            logger.error(f"Error decoding public key: {e}")
            pk_bytes = public_key.encode('utf-8') # Fallback attempt

    return verify_authentication_response(
        credential=response,
        expected_challenge=options["challenge"],
        expected_origin=ORIGIN,
        expected_rp_id=RP_ID,
        credential_public_key=pk_bytes,
        credential_current_sign_count=sign_count,
        require_user_verification=True,
    )
