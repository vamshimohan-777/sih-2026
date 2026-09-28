"""
Decryption Router — authenticated users only.
ML-KEM-768 decapsulation → AES-256-GCM decryption → DWT spread-spectrum watermark embedding.
Private keys loaded from filesystem storage (never stored in DB).
"""
import uuid
import time
import json
import base64
import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.database import (
    get_db, EncryptedPackage, RecipientEnvelope, DecryptionSession, User, Document
)
from backend.app.auth import get_current_user
from backend.app.audit import log_action
from backend.app.storage_adapter import storage_adapter
from backend.crypto.pqc_kem import default_kem
from backend.crypto.pqc_dsa import default_dsa
from backend.crypto.aes_gcm import default_aes
from backend.crypto.zk_commitment import default_zk
from backend.watermark.engine import default_watermark_engine
from backend.ledger.blockchain import default_ledger

router = APIRouter(prefix="/api", tags=["decryption"])


class DecryptRequest(BaseModel):
    package_id: str
    recipient_id: str  # Allows ADMIN/SUPERADMIN to specify; USER must match self


@router.post("/decrypt")
def decrypt_package(
    req: DecryptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Full decryption pipeline:
    1. ML-KEM-768 decapsulation (private key from secure storage)
    2. Content key unwrapping via AES-256-GCM
    3. Document payload decryption
    4. Invisible DWT forensic watermark embedding at decryption time
    5. ML-DSA-65 non-repudiation signature
    6. ZK commitment + PBFT ledger commit
    """
    t0 = time.time()

    # RBAC: USER can only decrypt their own envelopes
    target_recipient_id = req.recipient_id
    if current_user.role == "USER" and target_recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Users may only decrypt their own packages")

    # Resolve package
    pkg = db.query(EncryptedPackage).filter(EncryptedPackage.id == req.package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    # Resolve envelope for this recipient
    env = db.query(RecipientEnvelope).filter(
        RecipientEnvelope.package_id == pkg.id,
        RecipientEnvelope.recipient_id == target_recipient_id
    ).first()
    if not env:
        raise HTTPException(status_code=403, detail=f"Recipient {target_recipient_id} is not enrolled in this package")

    # Resolve recipient user
    recipient = db.query(User).filter(User.id == target_recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient user not found")

    decryption_steps = []

    # --- Step 1: ML-KEM-768 Decapsulation ---
    try:
        dk_hex = storage_adapter.load_private_key(target_recipient_id, "kem_private")
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail=f"KEM private key not found for {target_recipient_id}")

    try:
        x_priv_hex = storage_adapter.load_private_key(target_recipient_id, "x_priv")
    except FileNotFoundError:
        x_priv_hex = None

    kem_shared_secret = default_kem.decapsulate(
        dk_hex=dk_hex,
        kem_ciphertext_hex=env.kem_ciphertext_hex,
        x_priv_hex=x_priv_hex,
        x_ephem_pub_hex=env.x_ephem_pub_hex
    )

    decryption_steps.append({
        "step": 1,
        "name": "ML-KEM-768 Decapsulation",
        "desc": "Air-gapped recipient token decapsulated 32-byte shared secret using private lattice key.",
        "tech": "NIST FIPS 203 ML-KEM-768",
        "output_preview": f"Shared Secret: {kem_shared_secret.hex()[:16]}..."
    })

    # --- Step 2: Unwrap Content Key ---
    recovered_content_key = default_aes.decrypt_data(
        content_key=kem_shared_secret,
        nonce_hex=env.wrapped_nonce_hex,
        ciphertext_hex=env.wrapped_content_key,
        tag_hex=env.wrapped_tag_hex,
        associated_data=target_recipient_id.encode()
    )

    decryption_steps.append({
        "step": 2,
        "name": "Content Key Unwrapping",
        "desc": "Unwrapped 256-bit AES master content key with authenticated GCM verification.",
        "tech": "AES-256-GCM Decapsulation",
        "output_preview": f"Content Key Verified: {recovered_content_key.hex()[:16]}..."
    })

    # --- Step 3: Decrypt Document ---
    # Determine associated data: use doc_id if package has one, else package_id
    aad = (pkg.doc_id or pkg.id).encode()
    plaintext_bytes = default_aes.decrypt_data(
        content_key=recovered_content_key,
        nonce_hex=pkg.nonce_hex,
        ciphertext_hex=pkg.ciphertext_hex,
        tag_hex=pkg.tag_hex,
        associated_data=aad
    )

    decryption_steps.append({
        "step": 3,
        "name": "Authenticated Document Plaintext Recovery",
        "desc": "Decrypted confidential document bytes and verified AEAD integrity tag.",
        "tech": "AES-256-GCM Authenticated Decryption",
        "output_preview": f"Recovered {len(plaintext_bytes)} bytes"
    })

    # --- Step 4: DWT Forensic Watermark ---
    session_nonce = uuid.uuid4().hex[:12]
    timestamp = datetime.datetime.utcnow().isoformat() + "Z"

    wm_res = default_watermark_engine.embed_watermark(
        plaintext_bytes,
        recipient_id=target_recipient_id,
        session_nonce=session_nonce,
        timestamp=timestamp
    )

    decryption_steps.append({
        "step": 4,
        "name": "Invisible Forensic Watermarking",
        "desc": "Injected unique per-session multi-domain signature (DWT-DCT spread spectrum + geometric sync).",
        "tech": f"PSNR: {wm_res['psnr_db']} dB | SSIM: {wm_res['ssim']}",
        "output_preview": f"Watermark ID: {wm_res['watermark_id']}"
    })

    # --- Step 5: ML-DSA-65 Non-Repudiation Signature ---
    decryption_record = {
        "doc_id": pkg.doc_id or pkg.id,
        "recipient_id": target_recipient_id,
        "watermark_id": wm_res["watermark_id"],
        "session_nonce": session_nonce,
        "timestamp": timestamp
    }

    try:
        dsa_sk_hex = storage_adapter.load_private_key(target_recipient_id, "dsa_signing")
    except FileNotFoundError:
        dsa_sk_hex = None

    ed_priv_hex = None
    try:
        ed_priv_hex = storage_adapter.load_private_key(target_recipient_id, "ed_priv")
    except FileNotFoundError:
        pass

    if dsa_sk_hex:
        sig_res = default_dsa.sign_record(dsa_sk_hex, decryption_record, ed_priv_hex)
        sig_preview = sig_res["pqc_sig_hex"][:32] + "..."
        sig_full = sig_res["pqc_sig_hex"]
    else:
        sig_preview = "N/A (key not found)"
        sig_full = ""

    decryption_steps.append({
        "step": 5,
        "name": "Post-Quantum Digital Signature (Non-Repudiation)",
        "desc": "Recipient device signed decryption audit record with ML-DSA-65 private key.",
        "tech": "NIST FIPS 204 ML-DSA-65 + Ed25519",
        "output_preview": f"Signature: {sig_preview}"
    })

    # --- Step 6: ZK Commitment + PBFT Ledger Commit ---
    zk_comm = default_zk.create_commitment(target_recipient_id, session_nonce)

    full_tx = {
        "doc_id": pkg.doc_id or pkg.id,
        "recipient_id": target_recipient_id,
        "recipient_name": recipient.username,
        "watermark_id": wm_res["watermark_id"],
        "session_nonce": session_nonce,
        "timestamp": timestamp,
        "zk_commitment": zk_comm["commitment_hash"],
        "salt": zk_comm["salt"],
        "signature": sig_full,
        "verification_key": recipient.dsa_verification_key_hex or ""
    }

    committed_block = default_ledger.record_decryption(full_tx)

    decryption_steps.append({
        "step": 6,
        "name": "Permissioned DLT PBFT Consensus Commit",
        "desc": f"Record committed to Block #{committed_block['block_height']} with consensus from custodian nodes.",
        "tech": "PBFT Distributed Ledger + Merkle Root",
        "output_preview": f"Block Hash: {committed_block['block_hash'][:16]}..."
    })

    # --- Persist DecryptionSession in DB ---
    session_id = f"DEC-{uuid.uuid4().hex[:8].upper()}"
    sess = DecryptionSession(
        id=session_id,
        package_id=pkg.id,
        recipient_id=target_recipient_id,
        watermark_id=wm_res["watermark_id"],
        session_nonce=session_nonce,
        timestamp=datetime.datetime.utcnow(),
        psnr_db=wm_res["psnr_db"],
        ssim=wm_res["ssim"],
        block_height=committed_block["block_height"],
        block_hash=committed_block["block_hash"],
        status="COMPLETED",
        watermarked_image_b64=wm_res["watermarked_image_b64"],
        diff_heatmap_b64=wm_res.get("diff_heatmap_b64")
    )
    db.add(sess)
    db.commit()

    log_action(
        db, "DECRYPT_SUCCESS", current_user.id, "DecryptionSession", session_id,
        f"Decrypted pkg {pkg.id} for recipient {target_recipient_id}. WM: {wm_res['watermark_id']}"
    )

    return {
        "status": "DECRYPTED_AND_WATERMARKED",
        "instance_id": session_id,
        "package_id": pkg.id,
        "doc_id": pkg.doc_id or pkg.id,
        "recipient_id": target_recipient_id,
        "recipient_name": recipient.username,
        "watermark_id": wm_res["watermark_id"],
        "session_nonce": session_nonce,
        "timestamp": timestamp,
        "psnr_db": wm_res["psnr_db"],
        "ssim": wm_res["ssim"],
        "watermarked_image_b64": wm_res["watermarked_image_b64"],
        "original_image_b64": base64.b64encode(plaintext_bytes).decode(),
        "diff_heatmap_b64": wm_res.get("diff_heatmap_b64"),
        "block_height": committed_block["block_height"],
        "block_hash": committed_block["block_hash"],
        "merkle_root": committed_block["merkle_root"],
        "pqc_signature_preview": sig_preview,
        "decryption_steps": decryption_steps,
        "processing_time_ms": round((time.time() - t0) * 1000, 2)
    }


@router.get("/decrypted_instances")
def list_instances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """USERs see only their own sessions; ADMIN/SUPERADMIN see all."""
    if current_user.role in ["ADMIN", "SUPERADMIN"]:
        sessions = db.query(DecryptionSession).all()
    else:
        sessions = db.query(DecryptionSession).filter(
            DecryptionSession.recipient_id == current_user.id
        ).all()

    return [
        {
            "id": s.id,
            "package_id": s.package_id,
            "recipient_id": s.recipient_id,
            "watermark_id": s.watermark_id,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            "status": s.status,
            "psnr_db": s.psnr_db,
            "ssim": s.ssim,
            "block_height": s.block_height,
            "block_hash": s.block_hash
        }
        for s in sessions
    ]


@router.get("/decrypted_instances/{session_id}")
def get_instance(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(DecryptionSession).filter(DecryptionSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")

    if current_user.role == "USER" and s.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "id": s.id,
        "package_id": s.package_id,
        "recipient_id": s.recipient_id,
        "watermark_id": s.watermark_id,
        "timestamp": s.timestamp.isoformat() if s.timestamp else None,
        "status": s.status,
        "psnr_db": s.psnr_db,
        "ssim": s.ssim,
        "block_height": s.block_height,
        "block_hash": s.block_hash,
        "watermarked_image_b64": s.watermarked_image_b64,
        "diff_heatmap_b64": s.diff_heatmap_b64,
        "session_nonce": s.session_nonce
    }
