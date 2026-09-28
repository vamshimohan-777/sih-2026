import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database import get_db, User, RefreshToken
from backend.app.auth import verify_password, hash_password, create_access_token, create_refresh_token, decode_token, get_current_user
from backend.app.audit import log_action
from backend.app.config import settings
import uuid
import hashlib

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class RefreshRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    if user.locked_until and user.locked_until > datetime.datetime.utcnow():
        raise HTTPException(status_code=403, detail="Account locked. Try again later.")

    if not verify_password(request.password, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.locked_until = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.LOCKOUT_MINUTES)
            log_action(db, "ACCOUNT_LOCKED", user.id, "User", user.id, "Too many failed attempts")
        db.commit()
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Success
    user.failed_attempts = 0
    user.locked_until = None
    user.last_login = datetime.datetime.utcnow()
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    # Store refresh token hash
    rt_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
    db_rt = RefreshToken(id=str(uuid.uuid4()), user_id=user.id, token_hash=rt_hash, expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    db.add(db_rt)
    db.commit()
    
    log_action(db, "USER_LOGIN", user.id, "User", user.id, "User logged in successfully")
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }

@router.post("/refresh", response_model=dict)
def refresh(request: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_token(request.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        username = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    rt_hash = hashlib.sha256(request.refresh_token.encode()).hexdigest()
    db_rt = db.query(RefreshToken).filter(RefreshToken.token_hash == rt_hash).first()
    
    if not db_rt or db_rt.is_revoked or db_rt.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user = db.query(User).filter(User.username == username).first()
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    return {"access_token": access_token}

@router.post("/logout")
def logout(request: RefreshRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rt_hash = hashlib.sha256(request.refresh_token.encode()).hexdigest()
    db_rt = db.query(RefreshToken).filter(RefreshToken.token_hash == rt_hash).first()
    if db_rt:
        db_rt.is_revoked = True
        db.commit()
    log_action(db, "USER_LOGOUT", current_user.id, "User", current_user.id, "User logged out")
    return {"message": "Logged out successfully"}

@router.post("/change-password")
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(request.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    current_user.password_hash = hash_password(request.new_password)
    db.commit()
    log_action(db, "PASSWORD_CHANGED", current_user.id, "User", current_user.id, "User changed password")
    return {"message": "Password updated successfully"}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "kem_public_key": current_user.kem_public_key_hex,
        "dsa_verification_key": current_user.dsa_verification_key_hex
    }
