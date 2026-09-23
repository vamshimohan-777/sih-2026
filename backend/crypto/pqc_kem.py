"""
Post-Quantum Key Encapsulation Mechanism (ML-KEM-768 / FIPS 203) + Hybrid X25519
Provides quantum-safe key exchange and hybrid classical-PQC key wrapping.
"""
import os
import hashlib
from typing import Dict, Tuple, Optional
from kyber_py.ml_kem import ML_KEM_768
from cryptography.hazmat.primitives.asymmetric import x25519
from cryptography.hazmat.primitives import serialization

class PqcKemEngine:
    def __init__(self, use_hybrid: bool = True):
        self.use_hybrid = use_hybrid

    def generate_keypair(self) -> Dict[str, str]:
        """
        Generate ML-KEM-768 keypair and optional X25519 classical keypair.
        Returns hex-encoded keys.
        """
        # ML-KEM-768 (NIST FIPS 203)
        ek_bytes, dk_bytes = ML_KEM_768.keygen()

        result = {
            "algorithm": "ML-KEM-768",
            "fips_standard": "FIPS 203",
            "ek_hex": ek_bytes.hex(),
            "dk_hex": dk_bytes.hex(),
            "ek_size_bytes": len(ek_bytes),
            "dk_size_bytes": len(dk_bytes),
        }

        if self.use_hybrid:
            # Classical X25519 for defense-in-depth
            x_priv = x25519.X25519PrivateKey.generate()
            x_pub = x_priv.public_key()
            x_pub_bytes = x_pub.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw
            )
            x_priv_bytes = x_priv.private_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PrivateFormat.Raw,
                encryption_algorithm=serialization.NoEncryption()
            )
            result["hybrid"] = True
            result["classical_algorithm"] = "X25519"
            result["x_pub_hex"] = x_pub_bytes.hex()
            result["x_priv_hex"] = x_priv_bytes.hex()

        return result

    def encapsulate(self, ek_hex: str, x_pub_hex: Optional[str] = None) -> Dict[str, any]:
        """
        Encapsulate a symmetric key using recipient's public key(s).
        Returns the shared secret (32 bytes) and ciphertext(s).
        """
        ek_bytes = bytes.fromhex(ek_hex)
        kem_secret, kem_ciphertext = ML_KEM_768.encaps(ek_bytes)

        combined_secret = kem_secret
        result = {
            "kem_ciphertext_hex": kem_ciphertext.hex(),
            "ciphertext_size_bytes": len(kem_ciphertext),
        }

        if self.use_hybrid and x_pub_hex:
            # Classical ephemeral X25519
            ephem_priv = x25519.X25519PrivateKey.generate()
            ephem_pub = ephem_priv.public_key()
            ephem_pub_bytes = ephem_pub.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw
            )
            peer_pub = x25519.X25519PublicKey.from_public_bytes(bytes.fromhex(x_pub_hex))
            classical_secret = ephem_priv.exchange(peer_pub)

            # Hybrid KDF: SHA3-256(KEM_Secret || Classical_Secret)
            combined_secret = hashlib.sha3_256(kem_secret + classical_secret).digest()
            result["x_ephem_pub_hex"] = ephem_pub_bytes.hex()

        result["shared_secret"] = combined_secret
        result["shared_secret_hex"] = combined_secret.hex()
        return result

    def decapsulate(self, dk_hex: str, kem_ciphertext_hex: str,
                     x_priv_hex: Optional[str] = None, x_ephem_pub_hex: Optional[str] = None) -> bytes:
        """
        Decapsulate the symmetric key using recipient's private key(s).
        Returns the recovered 32-byte shared secret.
        """
        dk_bytes = bytes.fromhex(dk_hex)
        kem_ciphertext = bytes.fromhex(kem_ciphertext_hex)
        kem_secret = ML_KEM_768.decaps(dk_bytes, kem_ciphertext)

        if self.use_hybrid and x_priv_hex and x_ephem_pub_hex:
            x_priv = x25519.X25519PrivateKey.from_private_bytes(bytes.fromhex(x_priv_hex))
            ephem_pub = x25519.X25519PublicKey.from_public_bytes(bytes.fromhex(x_ephem_pub_hex))
            classical_secret = x_priv.exchange(ephem_pub)
            combined_secret = hashlib.sha3_256(kem_secret + classical_secret).digest()
            return combined_secret

        return kem_secret

# Singleton helper instance
default_kem = PqcKemEngine(use_hybrid=True)

if __name__ == "__main__":
    print("Testing ML-KEM-768 + X25519 Hybrid Engine...")
    kp = default_kem.generate_keypair()
    print(f"Generated Keypair for ML-KEM-768: EK={len(kp['ek_hex'])//2}B, DK={len(kp['dk_hex'])//2}B")
    
    enc = default_kem.encapsulate(kp["ek_hex"], kp.get("x_pub_hex"))
    print(f"Encapsulated Ciphertext: {len(enc['kem_ciphertext_hex'])//2}B")
    print(f"Sender Shared Secret: {enc['shared_secret_hex'][:16]}...")

    rec_secret = default_kem.decapsulate(
        kp["dk_hex"],
        enc["kem_ciphertext_hex"],
        kp.get("x_priv_hex"),
        enc.get("x_ephem_pub_hex")
    )
    assert rec_secret == enc["shared_secret"], "Secrets mismatch!"
    print(f"Decapsulated Secret Matches: {rec_secret.hex()[:16]}... SUCCESS!")
