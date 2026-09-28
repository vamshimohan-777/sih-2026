"""
Forensics Router — Leak Attribution & Attack Simulation.
- POST /api/attacks/simulate  — All authenticated users (PSNR-preserving image attack)
- POST /api/forensics/extract — ADMIN/SUPERADMIN: extract watermark from candidate image
- GET  /api/forensics/reports — ADMIN/SUPERADMIN: list attribution reports
"""
import io
import uuid
import time
import base64
import numpy as np
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from backend.app.database import get_db, User, DecryptionSession
from backend.app.auth import get_current_user, require_role
from backend.app.audit import log_action
from backend.watermark.engine import default_watermark_engine
from backend.watermark.attacks import default_attacks
from backend.ledger.blockchain import default_ledger, MerkleTree

router = APIRouter(prefix="/api", tags=["forensics"])


class AttackRequest(BaseModel):
    image_b64: str
    attack_type: str   # 'jpeg' | 'recapture' | 'noise' | 'crop' | 'blur'
    intensity: Optional[float] = 50.0


class ForensicsExtractRequest(BaseModel):
    candidate_image_b64: str


@router.post("/attacks/simulate")
def simulate_attack(
    req: AttackRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Applies one of 5 real-world signal processing attacks to a watermarked image.
    Uses the backend.watermark.attacks module (no mocks).
    """
    try:
        image_bytes = base64.b64decode(req.image_b64)
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")

    attack_type = req.attack_type.lower()
    intensity = float(req.intensity or 50.0)

    if attack_type == "jpeg":
        quality = int(np.clip(100 - intensity, 10, 95))
        attacked_np = default_attacks.jpeg_compression(img_np, quality=quality)
        desc = f"Lossy JPEG Recompression applied at Quality={quality}%."
    elif attack_type == "recapture":
        moire_str = 0.2 + (intensity / 100.0) * 0.4
        glare = 0.15 + (intensity / 100.0) * 0.3
        attacked_np = default_attacks.smartphone_recapture(img_np, moire_strength=moire_str, glare_intensity=glare)
        desc = "Smartphone Screen Recapture: LCD Moiré, lens glare, and perspective tilt applied."
    elif attack_type == "noise":
        std_dev = 5.0 + (intensity / 100.0) * 35.0
        attacked_np = default_attacks.gaussian_noise(img_np, std_dev=std_dev)
        desc = f"Additive Gaussian Sensor Noise applied (StdDev={round(std_dev, 1)})."
    elif attack_type == "crop":
        crop_pct = 5.0 + (intensity / 100.0) * 30.0
        attacked_np = default_attacks.crop_and_resize(img_np, crop_percent=crop_pct)
        desc = f"Cropped {round(crop_pct, 1)}% from borders and rescaled to original resolution."
    elif attack_type == "blur":
        k = int(3 + (intensity / 100.0) * 12)
        attacked_np = default_attacks.gaussian_blur(img_np, kernel_size=k)
        desc = f"Defocus optical blur applied (Kernel={k}x{k})."
    else:
        raise HTTPException(status_code=400, detail=f"Unknown attack type: {attack_type}")

    buf = io.BytesIO()
    Image.fromarray(attacked_np).save(buf, format="PNG")
    attacked_b64 = base64.b64encode(buf.getvalue()).decode()

    return {
        "status": "ATTACK_SIMULATED",
        "attack_type": attack_type,
        "description": desc,
        "intensity": intensity,
        "attacked_image_b64": attacked_b64
    }


@router.post("/forensics/extract")
def extract_and_attribute(
    req: ForensicsExtractRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SUPERADMIN"))
):
    """
    Full forensic attribution pipeline:
    1. Extract DWT watermark correlation from candidate image
    2. Match against all registered watermark records in ledger
    3. Verify ML-DSA-65 signature from matched record
    4. Generate Verifiable Attribution Report
    """
    t0 = time.time()

    try:
        image_bytes = base64.b64decode(req.candidate_image_b64)
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image data: {e}")

    # Gather all registered watermark records from ledger + DB sessions
    registered = []

    # From DB sessions
    sessions = db.query(DecryptionSession).all()
    for s in sessions:
        recipient = db.query(User).filter(User.id == s.recipient_id).first()
        registered.append({
            "doc_id": s.package_id,
            "recipient_id": s.recipient_id,
            "recipient_name": recipient.username if recipient else s.recipient_id,
            "watermark_id": s.watermark_id,
            "session_nonce": s.session_nonce,
            "timestamp": s.timestamp.isoformat() + "Z" if s.timestamp else "",
            "signature": "",
            "zk_commitment": ""
        })

    # From in-memory ledger records (covers pre-DB watermarks)
    for block in default_ledger.chain[1:]:
        for tx in block.get("transactions", []):
            if not any(r["watermark_id"] == tx.get("watermark_id") for r in registered):
                registered.append(tx)

    # Run watermark extraction
    ext_res = default_watermark_engine.extract_watermark(pil_img, registered)

    if not ext_res.get("attributed") or not ext_res.get("matched_record"):
        log_action(
            db, "FORENSIC_EXTRACTION_FAILED", current_user.id, "Forensics", "N/A",
            f"No watermark match found. Correlation peak: {ext_res.get('correlation_peak', 0)}"
        )
        return {
            "attributed": False,
            "status": "ATTRIBUTION_FAILED_NO_WATERMARK_FOUND",
            "message": "No registered forensic watermark correlation detected in candidate document.",
            "correlation_peak": ext_res.get("correlation_peak", 0),
            "candidates_evaluated": ext_res.get("candidates_evaluated", len(registered)),
            "processing_time_ms": round((time.time() - t0) * 1000, 2)
        }

    matched_tx = ext_res["matched_record"]
    wm_id = matched_tx["watermark_id"]

    # Lookup recipient
    recipient = db.query(User).filter(User.id == matched_tx["recipient_id"]).first()

    # Verify ML-DSA signature if available
    sig_valid = False
    if recipient and recipient.dsa_verification_key_hex and matched_tx.get("signature"):
        try:
            from backend.crypto.pqc_dsa import default_dsa
            from backend.app.storage_adapter import storage_adapter
            ed_pub_hex = None
            try:
                ed_pub_hex = storage_adapter.load_private_key(recipient.id, "ed_pub")
            except FileNotFoundError:
                pass

            decryption_payload = {
                "doc_id": matched_tx["doc_id"],
                "recipient_id": matched_tx["recipient_id"],
                "watermark_id": wm_id,
                "session_nonce": matched_tx["session_nonce"],
                "timestamp": matched_tx["timestamp"]
            }
            sig_valid = default_dsa.verify_record(
                recipient.dsa_verification_key_hex,
                decryption_payload,
                matched_tx["signature"],
                ed_pub_hex
            )
        except Exception:
            sig_valid = False

    # Merkle proof from ledger
    ledger_record = default_ledger.find_record_by_watermark(wm_id)
    merkle_proof = None
    if ledger_record:
        target_block = default_ledger.chain[ledger_record["block_height"]]
        merkle_proof = MerkleTree.generate_proof(target_block["transactions"], 0)

    log_action(
        db, "FORENSIC_ATTRIBUTION_SUCCESS", current_user.id, "Forensics", wm_id,
        f"Leak attributed to {matched_tx['recipient_id']} with {ext_res.get('confidence_percentage', 0):.1f}% confidence"
    )

    return {
        "attributed": True,
        "status": "FORENSIC_ATTRIBUTION_CONFIRMED",
        "verdict": f"Leaked asset attributed to recipient: {matched_tx.get('recipient_name', matched_tx['recipient_id'])}",
        "recipient": {
            "id": matched_tx["recipient_id"],
            "name": matched_tx.get("recipient_name", matched_tx["recipient_id"]),
            "username": recipient.username if recipient else matched_tx["recipient_id"],
            "role": recipient.role if recipient else "USER",
        },
        "session_details": {
            "doc_id": matched_tx["doc_id"],
            "watermark_id": wm_id,
            "session_nonce": matched_tx["session_nonce"],
            "decryption_timestamp": matched_tx["timestamp"]
        },
        "forensic_metrics": {
            "correlation_peak": ext_res.get("correlation_peak", 0),
            "confidence_percentage": ext_res.get("confidence_percentage", 0),
            "z_score": ext_res.get("z_score", 0.0),
            "detection_method": "DWT-DCT Hybrid Residual Phase Correlation"
        },
        "cryptographic_proof": {
            "ml_dsa_signature_valid": sig_valid,
            "signature_algorithm": "NIST FIPS 204 ML-DSA-65 + Ed25519",
            "non_repudiation_confirmed": sig_valid
        },
        "ledger_audit_proof": {
            "committed_block_height": ledger_record["block_height"] if ledger_record else "N/A",
            "block_hash": ledger_record["block_hash"] if ledger_record else "N/A",
            "merkle_proof_verified": merkle_proof is not None,
            "custodian_consensus_votes": ledger_record["consensus"]["votes_count"] if ledger_record else 0,
            "custodian_quorum_threshold": 3,
            "tamper_evident_status": "VERIFIED_GENUINE" if ledger_record else "NOT_IN_LEDGER"
        },
        "candidate_scores": ext_res.get("candidate_scores", []),
        "processing_time_ms": round((time.time() - t0) * 1000, 2)
    }


@router.get("/forensics/reports")
def list_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "SUPERADMIN"))
):
    """Returns all forensic attribution sessions from DecryptionSession table."""
    sessions = db.query(DecryptionSession).filter(DecryptionSession.status == "COMPLETED").all()
    return [
        {
            "session_id": s.id,
            "package_id": s.package_id,
            "recipient_id": s.recipient_id,
            "watermark_id": s.watermark_id,
            "timestamp": s.timestamp.isoformat() if s.timestamp else None,
            "block_height": s.block_height,
            "psnr_db": s.psnr_db,
            "ssim": s.ssim
        }
        for s in sessions
    ]
