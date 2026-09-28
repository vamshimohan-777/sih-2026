"""
Ledger Router — Permissioned PBFT Blockchain + DB Audit Log.
- GET  /api/ledger         — Full PBFT blockchain (all roles see chain, SUPERADMIN sees full detail)
- POST /api/ledger/tamper  — SUPERADMIN demo: tamper a block to show tamper detection
- POST /api/ledger/restore — SUPERADMIN: restore ledger to clean state
"""
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from backend.app.database import get_db, AuditLog, User
from backend.app.auth import get_current_user, require_role
from backend.app.audit import log_action
from backend.ledger.blockchain import default_ledger, PermissionedLedger

router = APIRouter(prefix="/api/ledger", tags=["ledger"])


class TamperRequest(BaseModel):
    block_height: int
    field: str
    malicious_value: str


@router.get("")
def get_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the PBFT blockchain chain + integrity status.
    SUPERADMIN sees full transaction details; others see truncated hashes.
    """
    integrity = default_ledger.verify_chain_integrity()

    chain_view = []
    for block in default_ledger.chain:
        b = {
            "block_height": block["block_height"],
            "timestamp": block["timestamp"],
            "block_hash": block["block_hash"],
            "previous_hash": block["previous_hash"],
            "merkle_root": block["merkle_root"],
            "transaction_count": len(block.get("transactions", [])),
            "consensus": block.get("consensus", {})
        }
        if current_user.role == "SUPERADMIN":
            b["transactions"] = block.get("transactions", [])
        chain_view.append(b)

    # Also include DB audit log chain integrity
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.asc()).all()
    audit_valid = True
    for i in range(1, len(logs)):
        if logs[i].previous_hash != logs[i-1].current_hash:
            audit_valid = False
            break

    return {
        "chain": chain_view,
        "total_blocks": len(default_ledger.chain),
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
        "integrity": integrity,
        "audit_log_integrity": audit_valid,
        "audit_log_entries": len(logs)
    }


@router.post("/tamper")
def tamper_ledger_demo(
    req: TamperRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERADMIN"))
):
    """Demo-only: tamper a block in the PBFT chain to show immutability detection."""
    res = default_ledger.tamper_block(req.block_height, req.field, req.malicious_value)
    audit = default_ledger.verify_chain_integrity()
    log_action(
        db, "LEDGER_TAMPER_DEMO", current_user.id, "Ledger", str(req.block_height),
        f"Tampered block {req.block_height} field='{req.field}' — integrity={audit['is_valid']}"
    )
    return {
        **res,
        "chain_audit_after_tamper": audit
    }


@router.post("/restore")
def restore_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPERADMIN"))
):
    """Reinitializes PBFT ledger to genesis-only state and recomputes DB audit hash chain."""
    global default_ledger
    import backend.ledger.blockchain as bc_module
    bc_module.default_ledger = PermissionedLedger()

    # Also restore DB audit hash chain
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.asc()).all()
    prev = "0" * 64
    for log in logs:
        log.previous_hash = prev
        data = f"{log.id}{log.action}{log.user_id}{log.resource_type}{log.resource_id}{log.details}{log.timestamp.isoformat() if log.timestamp else ''}{prev}"
        current = hashlib.sha256(data.encode()).hexdigest()
        log.current_hash = current
        prev = current
    db.commit()

    log_action(
        db, "LEDGER_RESTORED", current_user.id, "Ledger", "ALL",
        "PBFT ledger restored to genesis state; audit hash chain recomputed"
    )
    return {"status": "LEDGER_RESTORED_TO_PRISTINE_STATE", "message": "PBFT blockchain and audit hash chain restored"}
