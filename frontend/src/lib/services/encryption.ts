/**
 * Continuum Zero-Knowledge Encryption Service
 * Uses Web Crypto API (AES-GCM) and Passkey PRF extension.
 */

export async function deriveKeyFromPRF(credentialId: Uint8Array): Promise<CryptoKey> {
    if (!window.PublicKeyCredential || !PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        throw new Error("WebAuthn/Passkeys not supported on this device.");
    }

    const challenge = crypto.getRandomValues(new Uint8Array(32));

    // PRF inputs: We use a fixed salt for the encryption key
    const prfSalt = new TextEncoder().encode("Continuum_ZeroKnowledge_Salt_v1");

    try {
        const credential = await navigator.credentials.get({
            publicKey: {
                challenge,
                allowCredentials: [{
                    type: 'public-key',
                    id: credentialId,
                    transports: ['internal']
                }],
                extensions: {
                    prf: {
                        eval: { first: prfSalt }
                    }
                } as any
            }
        }) as PublicKeyCredential;

        const extensions = credential.getClientExtensionResults();
        if (!extensions.prf || !extensions.prf.results || !extensions.prf.results.first) {
            throw new Error("Passkey PRF extension not available or failed.");
        }

        const prfOutput = new Uint8Array(extensions.prf.results.first);

        // Import the PRF output as a CryptoKey
        return await crypto.subtle.importKey(
            "raw",
            prfOutput.slice(0, 32), // Use first 32 bytes for AES-256
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );
    } catch (err) {
        console.error("Failed to derive key from PRF:", err);
        throw err;
    }
}

export async function encryptVault(data: any, key: CryptoKey): Promise<{ ciphertext: string, iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(JSON.stringify(data));

    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        encodedData
    );

    return {
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer))),
        iv: btoa(String.fromCharCode(...iv))
    };
}

export async function decryptVault(ciphertext: string, iv: string, key: CryptoKey): Promise<any> {
    const ciphertextBufferRaw = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBuffer },
        key,
        ciphertextBufferRaw
    );

    return JSON.parse(new TextDecoder().decode(decryptedBuffer));
}
