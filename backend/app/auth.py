"""
Authentication service for AEGIS-PQC.
Password hashing: PBKDF2-HMAC-SHA256 via cryptography library (compatible with Python 3.14).
JWT: python-jose HS256 access tokens + refresh tokens.
RBAC: server-side role enforcement via require_role() dependency.
"""
import os
import hashlib
import hmac
import base64
import datetime
from typing import Optional

from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer

from backend.app.config import settings
from backend.app.database import get_db, User

# ---------------------------------------------------------------------------
# Password Hashing — PBKDF2-HMAC-SHA256 (compatible with Python 3.14+)
# No passlib dependency needed (avoids bcrypt/__about__ bug)
# ---------------------------------------------------------------------------

HASH_ITERATIONS = 480_000  # OWASP recommended for PBKDF2-SHA256 in 2024


def _derive_key(password: str, salt: bytes) -> bytes:
    """Derive a 32-byte key from password + salt using PBKDF2-HMAC-SHA256."""
    return hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        HASH_ITERATIONS,
        dklen=32
    )


def hash_password(password: str) -> str:
    """Hash a password. Returns 'pbkdf2$<iterations>$<salt_b64>$<hash_b64>'."""
    salt = os.urandom(32)
    key = _derive_key(password, salt)
    salt_b64 = base64.b64encode(salt).decode()
    key_b64 = base64.b64encode(key).decode()
    return f"pbkdf2${HASH_ITERATIONS}${salt_b64}${key_b64}"


def verify_password(plain_password: str, hashed: str) -> bool:
    """Verify a password against its stored hash (constant-time comparison)."""
    try:
        scheme, iters, salt_b64, stored_b64 = hashed.split("$")
        if scheme != "pbkdf2":
            return False
        salt = base64.b64decode(salt_b64)
        stored = base64.b64decode(stored_b64)
        computed = _derive_key(plain_password, salt)
        return hmac.compare_digest(computed, stored)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT Token Management
# ---------------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + (
        expires_delta or datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# FastAPI Dependencies
# ---------------------------------------------------------------------------

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency: decode JWT and return the authenticated User from DB."""
    payload = decode_token(token)
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return user


def require_role(*roles: str):
    """
    Dependency factory for RBAC enforcement.
    Usage: Depends(require_role("ADMIN", "SUPERADMIN"))
    Server-side only — never trust frontend role claims.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {' or '.join(roles)}"
            )
        return current_user
    return role_checker
