"""
Demo Data & Persona Generator for Air-Gapped Forensic Watermarking System.
Generates realistic classified assets and recipient identities with post-quantum keys.
"""
import io
import os
import base64
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
from backend.crypto.pqc_kem import default_kem
from backend.crypto.pqc_dsa import default_dsa

def generate_sample_documents() -> list:
    """Generates realistic classified demo documents as base64 images."""
    docs = []

    # Doc 1: Top Secret Defense Blueprint
    w, h = 640, 640
    img1 = np.ones((h, w, 3), dtype=np.uint8) * 242
    # Classified banner header
    cv2.rectangle(img1, (0, 0), (w, 50), (20, 20, 160), -1)
    cv2.putText(img1, "TOP SECRET // SIH-26237 // NOFORN", (80, 32), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    cv2.putText(img1, "DEFENSE SYSTEM ARCHITECTURE - AIR-GAPPED", (40, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (30, 30, 30), 2)
    cv2.putText(img1, "PROJECT: QUANTUM-RESILIENT COMMAND LINK", (40, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (70, 70, 70), 1)
    cv2.putText(img1, "SECURITY CLASSIFICATION: LEVEL 5 (RESTRICTED)", (40, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 20, 20), 1)

    # Technical diagram / schematic box
    cv2.rectangle(img1, (40, 190), (w - 40, 480), (210, 210, 210), 1)
    cv2.circle(img1, (160, 320), 45, (100, 100, 200), 2)
    cv2.putText(img1, "SENDER", (135, 325), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (50, 50, 50), 1)
    
    cv2.line(img1, (205, 320), (320, 320), (60, 60, 60), 2)
    cv2.putText(img1, "ML-KEM-768", (220, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (120, 30, 30), 1)

    cv2.circle(img1, (365, 320), 45, (80, 180, 80), 2)
    cv2.putText(img1, "RECIPIENT", (335, 325), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (50, 50, 50), 1)

    cv2.line(img1, (410, 320), (510, 320), (60, 60, 60), 2)
    cv2.putText(img1, "ML-DSA-65", (425, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (120, 30, 30), 1)

    cv2.rectangle(img1, (510, 290), (590, 350), (200, 100, 100), 2)
    cv2.putText(img1, "LEDGER", (525, 325), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (50, 50, 50), 1)

    # Caveats & warning
    cv2.putText(img1, "WARNING: UNAUTHORIZED DISCLOSURE IS SUBJECT TO STRICT FORENSIC ATTRIBUTION.", (35, 520), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (160, 10, 10), 1)
    cv2.putText(img1, "PER-SESSION WATERMARKS ACTIVE AT DECRYPTION TIME.", (110, 545), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (50, 50, 50), 1)
    
    # Bottom banner
    cv2.rectangle(img1, (0, h - 35), (w, h), (20, 20, 160), -1)
    cv2.putText(img1, "RESTRICTED CUSTODIAN ASSET // DO NOT EXFILTRATE", (120, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    buf1 = io.BytesIO()
    Image.fromarray(img1).save(buf1, format="PNG")
    b64_1 = base64.b64encode(buf1.getvalue()).decode('utf-8')

    docs.append({
        "id": "DOC-DEFENSE-701",
        "title": "Quantum-Resilient Defense Link Specification",
        "classification": "TOP SECRET // NOFORN",
        "category": "Defense Intelligence",
        "date": "2026-09-23",
        "image_b64": b64_1,
        "width": w,
        "height": h
    })

    # Doc 2: Financial Intelligence Memo
    img2 = np.ones((h, w, 3), dtype=np.uint8) * 248
    cv2.rectangle(img2, (0, 0), (w, 45), (30, 80, 40), -1)
    cv2.putText(img2, "CONFIDENTIAL // ACQUISITION DIRECTIVE", (110, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)
    cv2.putText(img2, "GLOBAL STRATEGIC RESERVES & INFRASTRUCTURE", (40, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (30, 30, 30), 2)
    cv2.putText(img2, "BOARD OF DIRECTORS SPECIAL SESSION - Q3 2026", (40, 125), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (90, 90, 90), 1)

    cv2.rectangle(img2, (40, 160), (w - 40, 520), (220, 225, 220), 1)
    lines = [
        "1. EXECUTIVE SUMMARY: TRANSITION TO POST-QUANTUM LEDGER ASSETS",
        "2. ALL ENCRYPTED ASSETS ARE TO BE BOUND TO FIPS 203 ML-KEM-768 KEY WRAPS",
        "3. DISTRIBUTED PERMISSIONED DLT TO REVERT TAMPERED AUDIT LOG ENTRIES",
        "4. UNAUTHORIZED LEAKS ARE TRACED VIA DWT-DCT SPREAD SPECTRUM SIGNATURES",
        "5. CUSTODIAN QUORUM (3-OF-4) MANDATED FOR RECIPIENT IDENTITY DISCLOSURE",
        "6. NON-REPUDIATION SECURED VIA NIST FIPS 204 ML-DSA-65 SIGNATURES"
    ]
    for idx, text in enumerate(lines):
        cv2.putText(img2, text, (55, 210 + idx * 45), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (40, 50, 40), 1)

    cv2.rectangle(img2, (0, h - 35), (w, h), (30, 80, 40), -1)
    cv2.putText(img2, "INTERNAL AUDIT COPY // PRIVILEGED & CONFIDENTIAL", (120, h - 12), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

    buf2 = io.BytesIO()
    Image.fromarray(img2).save(buf2, format="PNG")
    b64_2 = base64.b64encode(buf2.getvalue()).decode('utf-8')

    docs.append({
        "id": "DOC-FINANCIAL-902",
        "title": "Board Acquisition Directive & PQC Migration",
        "classification": "CONFIDENTIAL // PRIVILEGED",
        "category": "Corporate Governance",
        "date": "2026-09-21",
        "image_b64": b64_2,
        "width": w,
        "height": h
    })

    return docs

def generate_sample_recipients() -> list:
    """Pre-generates realistic organizational recipients with ML-KEM-768 and ML-DSA-65 keys."""
    personas = [
        {
            "id": "user_042",
            "name": "Dr. Aris Thorne",
            "role": "Chief Cryptographer",
            "department": "Quantum Security Directorate",
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
            "clearance": "TOP SECRET / SCI",
            "risk_score": "LOW (0.12)"
        },
        {
            "id": "user_088",
            "name": "Elena Rostova",
            "role": "Director of Cyber Defense",
            "department": "Threat Operations Command",
            "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
            "clearance": "TOP SECRET / NOFORN",
            "risk_score": "ELEVATED (0.48)"
        },
        {
            "id": "user_105",
            "name": "Marcus Vance",
            "role": "Senior Cloud Infrastructure Engineer",
            "department": "Air-Gapped Systems Engineering",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
            "clearance": "SECRET",
            "risk_score": "HIGH RISK (0.76)"
        },
        {
            "id": "user_312",
            "name": "Dr. Sarah Chen",
            "role": "Lead Systems Analyst",
            "department": "Forensic Investigations Group",
            "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
            "clearance": "TOP SECRET",
            "risk_score": "MINIMAL (0.05)"
        }
    ]

    recipients = []
    print("Pre-generating NIST PQC keypairs for organization recipients...")
    for p in personas:
        kem_kp = default_kem.generate_keypair()
        dsa_kp = default_dsa.generate_keypair()
        recipients.append({
            **p,
            "kem_public_key_hex": kem_kp["ek_hex"],
            "kem_private_key_hex": kem_kp["dk_hex"],
            "x_pub_hex": kem_kp.get("x_pub_hex"),
            "x_priv_hex": kem_kp.get("x_priv_hex"),
            "dsa_verification_key_hex": dsa_kp["vk_hex"],
            "dsa_signing_key_hex": dsa_kp["sk_hex"],
            "ed_pub_hex": dsa_kp.get("ed_pub_hex"),
            "ed_priv_hex": dsa_kp.get("ed_priv_hex"),
            "kem_algorithm": "ML-KEM-768 (FIPS 203)",
            "dsa_algorithm": "ML-DSA-65 (FIPS 204)",
        })
    return recipients

if __name__ == "__main__":
    docs = generate_sample_documents()
    recipients = generate_sample_recipients()
    print(f"Generated {len(docs)} sample documents and {len(recipients)} recipients with PQC keypairs.")
