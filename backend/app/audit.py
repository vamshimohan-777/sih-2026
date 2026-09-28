import uuid
import datetime
import hashlib
from sqlalchemy.orm import Session
from backend.app.database import AuditLog

def get_latest_hash(db: Session) -> str:
    latest_log = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).first()
    return latest_log.current_hash if latest_log else "0" * 64

def log_action(db: Session, action: str, user_id: str, resource_type: str, resource_id: str, details: str):
    previous_hash = get_latest_hash(db)
    
    timestamp = datetime.datetime.utcnow()
    id = str(uuid.uuid4())
    
    # Calculate current hash
    data_to_hash = f"{id}{action}{user_id}{resource_type}{resource_id}{details}{timestamp.isoformat()}{previous_hash}"
    current_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()
    
    new_log = AuditLog(
        id=id,
        action=action,
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        timestamp=timestamp,
        previous_hash=previous_hash,
        current_hash=current_hash
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log
