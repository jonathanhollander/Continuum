from backend.utils.logger import get_logger

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

def get_authentication_options():
    """Generates options for WebAuthn authentication (Passkey login)."""
    return generate_authentication_options(
        rp_id=RP_ID,
        user_verification=UserVerificationRequirement.REQUIRED,
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
