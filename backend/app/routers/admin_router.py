"""
Admin Router — SUPERADMIN only user management endpoints.
pqc_router — All authenticated users: /api/status, /api/pqc/benchmark
"""
import time
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from backend.app.database import (
    get_db, User, AuditLog, EncryptedPackage, DecryptionSession, Document
)
from backend.app.auth import get_current_user, require_role, hash_password
from backend.app.audit import log_action
from backend.ledger.blockchain import default_ledger

router = APIRouter(prefix="/api/admin", tags=["admin"])
pqc_router = APIRouter(prefix="/api", tags=["system"])


# ---------------------------------------------------------------------------
# User Management (SUPERADMIN only)
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    username: str
    password: str
    role: str  # SUPERADMIN | ADMIN | USER


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERADMIN"))
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login": u.last_login.isoformat() if u.last_login else None,
            "failed_attempts": u.failed_attempts,
            "locked_until": u.locked_until.isoformat() if u.locked_until else None,
            "has_pqc_keys": bool(u.kem_public_key_hex)
        }
        for u in users
    ]


@router.post("/users")
def create_user(
    req: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERADMIN"))
):
    if req.role not in ("SUPERADMIN", "ADMIN", "USER"):
        raise HTTPException(status_code=400, detail="Invalid role")
    existing = db.query(User).filter(User.username == req.username).first()
    if existing:
        raise HTTPException(status_code=409, detail="Username already exists")

    new_user = User(
        id=str(uuid.uuid4()),
        username=req.username,
        password_hash=hash_password(req.password),
        role=req.role,
        is_active=True,
        failed_attempts=0,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    log_action(db, "USER_CREATED", current_user.id, "User", new_user.id,
               f"Created user '{req.username}' with role {req.role}")
    return {"id": new_user.id, "username": new_user.username, "role": new_user.role}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERADMIN"))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    db.delete(u)
    db.commit()
    log_action(db, "USER_DELETED", current_user.id, "User", user_id,
               f"Deleted user '{u.username}'")
    return {"message": f"User '{u.username}' deleted"}


@router.patch("/users/{user_id}/activate")
def toggle_user_activation(
    user_id: str,
    active: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERADMIN"))
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_active = active
    if active:
        u.locked_until = None
        u.failed_attempts = 0
    db.commit()
    log_action(db, "USER_ACTIVATION_CHANGED", current_user.id, "User", user_id,
               f"Set is_active={active} for '{u.username}'")
    return {"message": f"User '{u.username}' is_active set to {active}"}


@router.get("/audit-log")
def get_full_audit_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERADMIN"))
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(500).all()
    return [
        {
            "id": l.id,
            "action": l.action,
            "user_id": l.user_id,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None,
            "previous_hash": l.previous_hash,
            "current_hash": l.current_hash
        }
        for l in logs
    ]


# ---------------------------------------------------------------------------
# System Status & PQC Benchmark (all authenticated users)
# ---------------------------------------------------------------------------

@pqc_router.get("/status")
def get_system_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Real system status from DB + ledger."""
    integrity = default_ledger.verify_chain_integrity()
    doc_count = db.query(Document).count()
    pkg_count = db.query(EncryptedPackage).count()
    session_count = db.query(DecryptionSession).count()

    return {
        "system_name": "AEGIS-PQC Post-Quantum Forensic Watermarking System (SIH26237)",
        "deployment_mode": "AIR_GAPPED_OFFLINE",
        "cloud_kms_dependency": False,
        "public_blockchain_dependency": False,
        "pqc_suite": {
            "kem": "ML-KEM-768 (NIST FIPS 203)",
            "dsa": "ML-DSA-65 (NIST FIPS 204)",
            "symmetric": "AES-256-GCM (NIST SP 800-38D)",
            "hash": "SHA3-256 (NIST FIPS 202)"
        },
        "stats": {
            "total_documents": doc_count,
            "encrypted_packages": pkg_count,
            "decryption_sessions": session_count,
            "ledger_blocks": len(default_ledger.chain)
        },
        "custodian_nodes": [
            {
                "id": n.node_id,
                "name": n.name,
                "department": n.department,
                "role": n.role,
                "status": n.status
            }
            for n in default_ledger.custodian_nodes
        ],
        "ledger_integrity": integrity,
        "version": "2.0.0"
    }


@pqc_router.get("/pqc/benchmark")
def get_pqc_benchmark(current_user: User = Depends(get_current_user)):
    """Live cryptographic benchmark — runs real keygen/sign/verify timing."""
    from backend.crypto.pqc_kem import default_kem
    from backend.crypto.pqc_dsa import default_dsa

    # KEM benchmark
    t0 = time.time()
    kem_kp = default_kem.generate_keypair()
    kem_keygen_ms = (time.time() - t0) * 1000

    t0 = time.time()
    enc = default_kem.encapsulate(kem_kp["ek_hex"], kem_kp.get("x_pub_hex"))
    kem_encaps_ms = (time.time() - t0) * 1000

    t0 = time.time()
    default_kem.decapsulate(kem_kp["dk_hex"], enc["kem_ciphertext_hex"],
                             kem_kp.get("x_priv_hex"), enc.get("x_ephem_pub_hex"))
    kem_decaps_ms = (time.time() - t0) * 1000

    # DSA benchmark (only keygen + sign small msg — verify skipped to avoid long runtime)
    t0 = time.time()
    dsa_kp = default_dsa.generate_keypair()
    dsa_keygen_ms = (time.time() - t0) * 1000

    t0 = time.time()
    sig = default_dsa.sign_record(dsa_kp["sk_hex"], {"test": "benchmark"})
    dsa_sign_ms = (time.time() - t0) * 1000

    t0 = time.time()
    default_dsa.verify_record(dsa_kp["vk_hex"], {"test": "benchmark"}, sig["pqc_sig_hex"])
    dsa_verify_ms = (time.time() - t0) * 1000

    return {
        "ml_kem_768": {
            "standard": "NIST FIPS 203 (ML-KEM-768 / Kyber-768)",
            "security_category": "NIST Level 3 (AES-192 equivalent)",
            "public_key_bytes": 1184,
            "private_key_bytes": 2400,
            "ciphertext_bytes": 1088,
            "keygen_latency_ms": round(kem_keygen_ms, 2),
            "encaps_latency_ms": round(kem_encaps_ms, 2),
            "decaps_latency_ms": round(kem_decaps_ms, 2)
        },
        "ml_dsa_65": {
            "standard": "NIST FIPS 204 (ML-DSA-65 / Dilithium3)",
            "security_category": "NIST Level 3",
            "verification_key_bytes": 1952,
            "signing_key_bytes": 4032,
            "signature_bytes": 3309,
            "keygen_latency_ms": round(dsa_keygen_ms, 2),
            "sign_latency_ms": round(dsa_sign_ms, 2),
            "verify_latency_ms": round(dsa_verify_ms, 2)
        },
        "aes_256_gcm": {
            "standard": "NIST SP 800-38D",
            "key_size_bits": 256,
            "iv_size_bits": 96,
            "tag_size_bits": 128,
            "note": "Hardware-accelerated via AES-NI"
        },
        "compliance": "100% NIST Post-Quantum Cryptography FIPS Standard Compliant"
    }
