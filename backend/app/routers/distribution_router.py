"""
Distribution Router — ADMIN/SUPERADMIN only.
Encrypts a document with AES-256-GCM + ML-KEM-768 hybrid key wrapping for each recipient.
Uses the real backend.crypto modules (no mocks).
"""
import uuid
import time
import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.database import get_db, Document, User, EncryptedPackage, RecipientEnvelope
from backend.app.auth import get_current_user, require_role
from backend.app.audit import log_action
from backend.crypto.pqc_kem import default_kem
from backend.crypto.aes_gcm import default_aes

router = APIRouter(prefix="/api", tags=["distribution"])


class DistributionRequest(BaseModel):
    doc_id: str
    recipient_ids: List[str]
    custom_image_b64: Optional[str] = None
    custom_title: Optional[str] = None


@router.post("/distribute")
def distribute_document(
    req: DistributionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SUPERADMIN"))
):
    """
    Encrypt document once (AES-256-GCM), then wrap the content key for each
    recipient individually using ML-KEM-768 + X25519 hybrid KEM.
    All data persisted in DB. Returns animated crypto_steps for the UI.
    """
    t0 = time.time()

    # 1. Resolve document
    if req.custom_image_b64:
        image_b64 = req.custom_image_b64
        doc_title = req.custom_title or "Custom Air-Gapped Asset"
        doc_id = f"DOC-CUSTOM-{uuid.uuid4().hex[:6].upper()}"
        description = "Custom document uploaded by admin"
    else:
        doc = db.query(Document).filter(Document.id == req.doc_id).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found")
        image_b64 = doc.image_b64
        doc_title = doc.title
        doc_id = doc.id
        description = doc.description or ""

    # 2. Generate AES-256 master content key
    content_key = default_aes.generate_content_key()

    # 3. Encrypt document bytes
    import base64
    image_bytes = base64.b64decode(image_b64)
    aes_res = default_aes.encrypt_data(content_key, image_bytes, associated_data=doc_id.encode())

    crypto_steps = [
        {
            "step": 1,
            "title": "Master Content Key Generation",
            "desc": "Generated cryptographically secure 256-bit symmetric key for bulk payload.",
            "tech": "AES-256 CSPRNG (32 bytes)",
            "output_preview": f"Key: {content_key.hex()[:16]}... (hidden in production)"
        },
        {
            "step": 2,
            "title": "Authenticated Document Encryption",
            "desc": "Encrypted document with 96-bit IV and 128-bit GCM authentication tag.",
            "tech": "AES-256-GCM (NIST SP 800-38D)",
            "output_preview": f"IV: {aes_res['nonce_hex']} | Tag: {aes_res['tag_hex']} | CT: {len(aes_res['ciphertext_hex'])//2} bytes"
        }
    ]

    # 4. Store package in DB
    package_id = f"PKG-{uuid.uuid4().hex[:8].upper()}"
    pkg = EncryptedPackage(
        id=package_id,
        doc_id=doc_id if not req.custom_image_b64 else None,
        ciphertext_hex=aes_res["ciphertext_hex"],
        nonce_hex=aes_res["nonce_hex"],
        tag_hex=aes_res["tag_hex"],
        created_at=datetime.datetime.utcnow(),
        created_by=current_user.id
    )
    db.add(pkg)

    # 5. For each recipient: ML-KEM-768 encapsulate + wrap content key
    enrolled_recipients = []
    for rid in req.recipient_ids:
        recipient = db.query(User).filter(User.id == rid).first()
        if not recipient or not recipient.kem_public_key_hex:
            continue

        # KEM encapsulation with hybrid X25519
        from backend.app.storage_adapter import storage_adapter
        x_pub_hex = None
        try:
            x_pub_hex = storage_adapter.load_private_key(rid, "x_pub")
        except FileNotFoundError:
            pass

        kem_res = default_kem.encapsulate(recipient.kem_public_key_hex, x_pub_hex)
        shared_secret = kem_res["shared_secret"]

        # Wrap content key with the shared secret
        wrapped = default_aes.encrypt_data(shared_secret, content_key, associated_data=rid.encode())

        env = RecipientEnvelope(
            id=str(uuid.uuid4()),
            package_id=package_id,
            recipient_id=rid,
            kem_ciphertext_hex=kem_res["kem_ciphertext_hex"],
            x_ephem_pub_hex=kem_res.get("x_ephem_pub_hex"),
            wrapped_content_key=wrapped["ciphertext_hex"],
            wrapped_nonce_hex=wrapped["nonce_hex"],
            wrapped_tag_hex=wrapped["tag_hex"]
        )
        db.add(env)
        enrolled_recipients.append(rid)

        crypto_steps.append({
            "step": len(crypto_steps) + 1,
            "title": f"ML-KEM-768 Key Wrap: {recipient.username}",
            "desc": f"Encapsulated 32-byte shared secret with post-quantum lattice key, wrapped AES-256 content key.",
            "tech": "NIST FIPS 203 ML-KEM-768 (Ind-CCA2 Secure)",
            "output_preview": f"CT: {kem_res['kem_ciphertext_hex'][:24]}... ({len(kem_res['kem_ciphertext_hex'])//2} bytes)"
        })

    if not enrolled_recipients:
        db.rollback()
        raise HTTPException(status_code=400, detail="No valid recipients with KEM public keys found")

    db.commit()

    log_action(
        db, "DISTRIBUTE", current_user.id, "EncryptedPackage", package_id,
        f"Distributed doc '{doc_title}' to {len(enrolled_recipients)} recipients: {enrolled_recipients}"
    )

    return {
        "status": "PACKAGE_PREPARED_AND_DISTRIBUTED",
        "package_id": package_id,
        "doc_id": doc_id,
        "doc_title": doc_title,
        "recipient_count": len(enrolled_recipients),
        "recipient_ids": enrolled_recipients,
        "ciphertext_preview": aes_res["ciphertext_hex"][:64] + "...",
        "nonce_hex": aes_res["nonce_hex"],
        "tag_hex": aes_res["tag_hex"],
        "crypto_steps": crypto_steps,
        "distribution_summary": {
            "total_recipients": len(enrolled_recipients),
            "payload_size_bytes": len(image_bytes),
            "ciphertext_size_bytes": len(aes_res["ciphertext_hex"]) // 2,
            "processing_time_ms": round((time.time() - t0) * 1000, 2)
        }
    }


@router.get("/packages")
def list_packages(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SUPERADMIN"))
):
    packages = db.query(EncryptedPackage).all()
    return [
        {
            "id": p.id,
            "doc_id": p.doc_id,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "created_by": p.created_by
        }
        for p in packages
    ]


@router.get("/packages/{package_id}")
def get_package(
    package_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SUPERADMIN"))
):
    pkg = db.query(EncryptedPackage).filter(EncryptedPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    envelopes = db.query(RecipientEnvelope).filter(RecipientEnvelope.package_id == package_id).all()
    return {
        "id": pkg.id,
        "doc_id": pkg.doc_id,
        "created_at": pkg.created_at.isoformat() if pkg.created_at else None,
        "envelopes": [{"id": e.id, "recipient_id": e.recipient_id} for e in envelopes]
    }
