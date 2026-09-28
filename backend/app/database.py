import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.app.config import settings

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # SUPERADMIN, ADMIN, USER
    is_active = Column(Boolean, default=True)
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime)
    last_login = Column(DateTime, nullable=True)
    kem_public_key_hex = Column(String, nullable=True)
    dsa_verification_key_hex = Column(String, nullable=True)

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    classification = Column(String)
    description = Column(String)
    image_b64 = Column(Text)
    created_at = Column(DateTime)
    created_by = Column(String, ForeignKey("users.id"))
    creator = relationship("User")

class EncryptedPackage(Base):
    __tablename__ = "encrypted_packages"
    id = Column(String, primary_key=True, index=True)
    doc_id = Column(String, ForeignKey("documents.id"))
    ciphertext_hex = Column(Text)
    nonce_hex = Column(String)
    tag_hex = Column(String)
    created_at = Column(DateTime)
    created_by = Column(String, ForeignKey("users.id"))

class RecipientEnvelope(Base):
    __tablename__ = "recipient_envelopes"
    id = Column(String, primary_key=True, index=True)
    package_id = Column(String, ForeignKey("encrypted_packages.id"))
    recipient_id = Column(String, ForeignKey("users.id"))
    kem_ciphertext_hex = Column(Text)
    x_ephem_pub_hex = Column(String, nullable=True)
    wrapped_content_key = Column(Text)
    wrapped_nonce_hex = Column(String)
    wrapped_tag_hex = Column(String)

class DecryptionSession(Base):
    __tablename__ = "decryption_sessions"
    id = Column(String, primary_key=True, index=True)
    package_id = Column(String, ForeignKey("encrypted_packages.id"))
    recipient_id = Column(String, ForeignKey("users.id"))
    watermark_id = Column(String)
    session_nonce = Column(String)
    timestamp = Column(DateTime)
    psnr_db = Column(Float)
    ssim = Column(Float)
    block_height = Column(Integer, nullable=True)
    block_hash = Column(String, nullable=True)
    status = Column(String)
    watermarked_image_b64 = Column(Text, nullable=True)
    diff_heatmap_b64 = Column(Text, nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, index=True)
    action = Column(String)
    user_id = Column(String, ForeignKey("users.id"))
    resource_type = Column(String)
    resource_id = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime)
    previous_hash = Column(String)
    current_hash = Column(String)

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    token_hash = Column(String)
    expires_at = Column(DateTime)
    is_revoked = Column(Boolean, default=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
