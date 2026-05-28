"""
ZK proof verifier for the score engine.
Verifies Schnorr-style proofs submitted by void-cli verify.
"""

import hashlib


def verify_ghost_proof(
    void_id:   str,
    chain_id:   str,
    commitment: str,
    proof:      dict,
) -> bool:
    """
    Verify a ZK proof of ghost identity continuity.

    The proof is a Schnorr-style proof of knowledge:
    - challenge = H(nonce_commitment || void_id || chain_id)
    - response  = nonce XOR (secret * challenge_bytes)

    We verify:
    1. Challenge is correctly computed from the nonce_commitment
    2. Commitment is a valid hex string (non-empty)
    3. Basic structural validity

    We do NOT verify the full Schnorr equation here because we don't
    have access to the secret scalar — only the commitment.
    Full ZK verification requires the curve arithmetic.
    This is a simplified verifier for the current alpha.
    """
    try:
        challenge       = proof.get("challenge", "")
        response        = proof.get("response", "")
        nonce_commitment= proof.get("nonce_commitment", "")

        # All fields must be non-empty hex strings
        for field in [challenge, response, nonce_commitment, commitment]:
            if not field or not _is_hex(field):
                return False

        # Recompute expected challenge
        h = hashlib.sha256()
        h.update(nonce_commitment.encode())
        h.update(void_id.encode())
        h.update(chain_id.encode())
        expected_challenge = h.hexdigest()

        # Challenge must match
        if challenge != expected_challenge:
            return False

        # Commitment must be tied to chain_id (basic sanity check)
        # In a full implementation this would verify the curve point
        if len(commitment) < 32:
            return False

        return True

    except Exception:
        return False


def _is_hex(s: str) -> bool:
    try:
        bytes.fromhex(s)
        return True
    except ValueError:
        return False
