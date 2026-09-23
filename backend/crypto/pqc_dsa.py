"""
Post-Quantum Digital Signature Mechanism (ML-DSA-65 / FIPS 204) + Hybrid Ed25519
Provides non-repudiation for recipient decryption records.
"""
import os
import json
from typing import Dict, Optional, Any
from dilithium_py.ml_dsa import ML_DSA_65
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

class PqcDsaEngine:
    def __init__(self, use_hybrid: bool = True):
        self.use_hybrid = use_hybrid

    def generate_keypair(self) -> Dict[str, Any]:
        """
        Generate ML-DSA-65 keypair and optional Ed25519 keypair.
        Returns hex-encoded verification key (vk) and signing key (sk).
        """
        # ML-DSA-65 (NIST FIPS 204)
        vk_bytes, sk_bytes = ML_DSA_65.keygen()

        result = {
            "algorithm": "ML-DSA-65",
            "fips_standard": "FIPS 204",
            "vk_hex": vk_bytes.hex(),
            "sk_hex": sk_bytes.hex(),
            "vk_size_bytes": len(vk_bytes),
            "sk_size_bytes": len(sk_bytes),
        }

        if self.use_hybrid:
            ed_priv = ed25519.Ed25519PrivateKey.generate()
            ed_pub = ed_priv.public_key()
            ed_pub_bytes = ed_pub.public_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PublicFormat.Raw
            )
            ed_priv_bytes = ed_priv.private_bytes(
                encoding=serialization.Encoding.Raw,
                format=serialization.PrivateFormat.Raw,
                encryption_algorithm=serialization.NoEncryption()
            )
            result["hybrid"] = True
            result["classical_algorithm"] = "Ed25519"
            result["ed_pub_hex"] = ed_pub_bytes.hex()
            result["ed_priv_hex"] = ed_priv_bytes.hex()

        return result

    def sign_record(self, sk_hex: str, data: Any, ed_priv_hex: Optional[str] = None) -> Dict[str, Any]:
        """
        Sign a record (dict or bytes) with ML-DSA-65 private key and optional Ed25519 key.
        """
        if isinstance(data, dict):
            # Canonical JSON serialization for deterministic signing
            msg_bytes = json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
        elif isinstance(data, str):
            msg_bytes = data.encode('utf-8')
        else:
            msg_bytes = bytes(data)

        sk_bytes = bytes.fromhex(sk_hex)
        pqc_sig = ML_DSA_65.sign(sk_bytes, msg_bytes)

        sig_info = {
            "algorithm": "ML-DSA-65",
            "pqc_sig_hex": pqc_sig.hex(),
            "pqc_sig_size_bytes": len(pqc_sig),
        }

        if self.use_hybrid and ed_priv_hex:
            ed_priv = ed25519.Ed25519PrivateKey.from_private_bytes(bytes.fromhex(ed_priv_hex))
            ed_sig = ed_priv.sign(msg_bytes)
            sig_info["ed_sig_hex"] = ed_sig.hex()
            sig_info["hybrid"] = True

        return sig_info

    def verify_record(self, vk_hex: str, data: Any, pqc_sig_hex: str,
                      ed_pub_hex: Optional[str] = None, ed_sig_hex: Optional[str] = None) -> bool:
        """
        Verify signature against record using public keys.
        """
        if isinstance(data, dict):
            msg_bytes = json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')
        elif isinstance(data, str):
            msg_bytes = data.encode('utf-8')
        else:
            msg_bytes = bytes(data)

        try:
            vk_bytes = bytes.fromhex(vk_hex)
            pqc_sig = bytes.fromhex(pqc_sig_hex)
            pqc_valid = ML_DSA_65.verify(vk_bytes, msg_bytes, pqc_sig)
            if not pqc_valid:
                return False

            if self.use_hybrid and ed_pub_hex and ed_sig_hex:
                ed_pub = ed25519.Ed25519PublicKey.from_public_bytes(bytes.fromhex(ed_pub_hex))
                ed_sig = bytes.fromhex(ed_sig_hex)
                ed_pub.verify(ed_sig, msg_bytes)

            return True
        except Exception as e:
            return False

default_dsa = PqcDsaEngine(use_hybrid=True)

if __name__ == "__main__":
    print("Testing ML-DSA-65 + Ed25519 Hybrid Engine...")
    kp = default_dsa.generate_keypair()
    print(f"Generated Keypair for ML-DSA-65: VK={len(kp['vk_hex'])//2}B, SK={len(kp['sk_hex'])//2}B")
    
    test_record = {
        "doc_id": "DOC-2026-X89",
        "recipient_id": "user_042",
        "watermark_id": "WM_987654321",
        "timestamp": "2026-09-23T15:25:00Z"
    }

    sig = default_dsa.sign_record(kp["sk_hex"], test_record, kp.get("ed_priv_hex"))
    print(f"Signature generated: {len(sig['pqc_sig_hex'])//2}B")
    
    is_valid = default_dsa.verify_record(
        kp["vk_hex"],
        test_record,
        sig["pqc_sig_hex"],
        kp.get("ed_pub_hex"),
        sig.get("ed_sig_hex")
    )
    print(f"Verification Result: {is_valid} (SUCCESS)")
    assert is_valid
