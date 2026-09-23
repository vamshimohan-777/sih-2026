"""
AES-256-GCM Authenticated Symmetric Encryption Layer.
Handles bulk document encryption and recipient key envelope packaging.
"""
import os
import json
import base64
from typing import Dict, Any, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class AesGcmEngine:
    @staticmethod
    def generate_content_key() -> bytes:
        """Generate a cryptographically secure 256-bit (32-byte) AES key."""
        return AESGCM.generate_key(bit_length=256)

    @staticmethod
    def encrypt_data(content_key: bytes, plaintext: bytes, associated_data: bytes = b"") -> Dict[str, str]:
        """
        Encrypt document bytes using AES-256-GCM.
        Returns nonce (IV) and ciphertext (including 16-byte GCM authentication tag).
        """
        aesgcm = AESGCM(content_key)
        nonce = os.urandom(12)  # Standard 96-bit nonce for GCM
        # AESGCM.encrypt appends 16-byte tag to the ciphertext
        ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext, associated_data)
        
        ciphertext = ciphertext_with_tag[:-16]
        tag = ciphertext_with_tag[-16:]

        return {
            "algorithm": "AES-256-GCM",
            "nonce_hex": nonce.hex(),
            "tag_hex": tag.hex(),
            "ciphertext_hex": ciphertext.hex(),
            "ciphertext_b64": base64.b64encode(ciphertext_with_tag).decode('utf-8'),
            "plaintext_length": len(plaintext),
            "ciphertext_length": len(ciphertext_with_tag)
        }

    @staticmethod
    def decrypt_data(content_key: bytes, nonce_hex: str, ciphertext_hex: str, tag_hex: str,
                     associated_data: bytes = b"") -> bytes:
        """
        Decrypt document bytes and authenticate with GCM tag.
        """
        aesgcm = AESGCM(content_key)
        nonce = bytes.fromhex(nonce_hex)
        ciphertext = bytes.fromhex(ciphertext_hex)
        tag = bytes.fromhex(tag_hex)
        
        ciphertext_with_tag = ciphertext + tag
        plaintext = aesgcm.decrypt(nonce, ciphertext_with_tag, associated_data)
        return plaintext

default_aes = AesGcmEngine()

if __name__ == "__main__":
    print("Testing AES-256-GCM Engine...")
    key = default_aes.generate_content_key()
    sample = b"CLASSIFIED DEFENSE BLUEPRINT - TOP SECRET - AIR GAPPED"
    enc = default_aes.encrypt_data(key, sample, b"DOC-101")
    print(f"Encrypted {enc['plaintext_length']} bytes -> Nonce={enc['nonce_hex'][:8]}... Tag={enc['tag_hex'][:8]}...")
    dec = default_aes.decrypt_data(key, enc["nonce_hex"], enc["ciphertext_hex"], enc["tag_hex"], b"DOC-101")
    assert dec == sample
    print(f"Decrypted: '{dec.decode()}' SUCCESS!")
