"""
AEGIS-PQC FastAPI Application Entry Point.
Modular production-grade backend for SIH26237 Post-Quantum Forensic Watermarking System.

On startup:
  - Creates all SQLite tables (via SQLAlchemy)
  - Seeds 6 default users (superadmin1, admin1, user1-user4)
  - Generates ML-KEM-768 + ML-DSA-65 keypairs for user1-user4
  - Stores public keys in DB, private keys in filesystem (storage/keys/)
  - Seeds 2 classified demo documents
"""
import os
import uuid
import datetime
import base64
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.database import engine, Base, SessionLocal, User, Document
from backend.app.auth import hash_password
from backend.app.storage_adapter import storage_adapter
from backend.app.routers.auth_router import router as auth_router
from backend.app.routers.documents_router import router as docs_router, recipients_router
from backend.app.routers.distribution_router import router as dist_router
from backend.app.routers.decryption_router import router as dec_router
from backend.app.routers.forensics_router import router as for_router
from backend.app.routers.ledger_router import router as led_router
from backend.app.routers.admin_router import router as admin_router, pqc_router

app = FastAPI(
    title="AEGIS-PQC Post-Quantum Forensic Watermarking API",
    description="SIH26237 — Air-Gapped, NIST FIPS 203/204 Compliant Document Attribution System",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(docs_router)
app.include_router(recipients_router)
app.include_router(dist_router)
app.include_router(dec_router)
app.include_router(for_router)
app.include_router(led_router)
app.include_router(admin_router)
app.include_router(pqc_router)


# ---------------------------------------------------------------------------
# Default users to seed
# ---------------------------------------------------------------------------
DEFAULT_USERS = [
    {"username": "superadmin1", "password": "SuperAdmin@123", "role": "SUPERADMIN"},
    {"username": "admin1",      "password": "Admin@123",      "role": "ADMIN"},
    {"username": "user1",       "password": "User1@123",      "role": "USER"},
    {"username": "user2",       "password": "User2@123",      "role": "USER"},
    {"username": "user3",       "password": "User3@123",      "role": "USER"},
    {"username": "user4",       "password": "User4@123",      "role": "USER"},
]

# User personas for DB annotation (anonymized — no real names)
USER_PERSONAS = {
    "user1": {"role_title": "Chief Cryptographer",         "department": "Quantum Security Directorate", "clearance": "TOP SECRET / SCI",    "risk_score": "LOW (0.12)"},
    "user2": {"role_title": "Director of Cyber Defense",   "department": "Threat Operations Command",    "clearance": "TOP SECRET / NOFORN", "risk_score": "ELEVATED (0.48)"},
    "user3": {"role_title": "Senior Infrastructure Eng.",  "department": "Air-Gapped Systems Eng.",      "clearance": "SECRET",              "risk_score": "HIGH RISK (0.76)"},
    "user4": {"role_title": "Lead Systems Analyst",        "department": "Forensic Investigations Grp.", "clearance": "TOP SECRET",          "risk_score": "MINIMAL (0.05)"},
}


def _seed_users(db) -> dict:
    """
    Create default users if they don't exist.
    Returns a dict mapping username -> User object.
    """
    user_map = {}
    for u_def in DEFAULT_USERS:
        existing = db.query(User).filter(User.username == u_def["username"]).first()
        if existing:
            user_map[u_def["username"]] = existing
            continue
        new_user = User(
            id=str(uuid.uuid4()),
            username=u_def["username"],
            password_hash=hash_password(u_def["password"]),
            role=u_def["role"],
            is_active=True,
            failed_attempts=0,
            created_at=datetime.datetime.utcnow()
        )
        db.add(new_user)
        user_map[u_def["username"]] = new_user
    db.commit()
    return user_map


def _seed_pqc_keys(db, user_map: dict):
    """
    Generate ML-KEM-768 + ML-DSA-65 keypairs for user1–user4.
    Public keys are stored in DB (users table).
    Private keys are written to filesystem via storage_adapter.
    Skips users whose keys are already stored.
    """
    from backend.crypto.pqc_kem import default_kem
    from backend.crypto.pqc_dsa import default_dsa

    for username in ["user1", "user2", "user3", "user4"]:
        user = user_map.get(username)
        if not user:
            continue

        # Check if private key already exists on disk
        key_exists = False
        try:
            storage_adapter.load_private_key(user.id, "kem_private")
            key_exists = True
        except FileNotFoundError:
            pass

        if key_exists and user.kem_public_key_hex:
            print(f"  [OK] Keys already exist for {username} — skipping keygen")
            continue

        print(f"  Generating PQC keypair for {username}...")
        kem_kp = default_kem.generate_keypair()
        dsa_kp = default_dsa.generate_keypair()

        # Store private keys on filesystem
        storage_adapter.save_private_key(user.id, "kem_private", kem_kp["dk_hex"])
        storage_adapter.save_private_key(user.id, "dsa_signing", dsa_kp["sk_hex"])

        # Store X25519 keys if hybrid
        if kem_kp.get("x_pub_hex"):
            storage_adapter.save_private_key(user.id, "x_pub", kem_kp["x_pub_hex"])
        if kem_kp.get("x_priv_hex"):
            storage_adapter.save_private_key(user.id, "x_priv", kem_kp["x_priv_hex"])
        if dsa_kp.get("ed_pub_hex"):
            storage_adapter.save_private_key(user.id, "ed_pub", dsa_kp["ed_pub_hex"])
        if dsa_kp.get("ed_priv_hex"):
            storage_adapter.save_private_key(user.id, "ed_priv", dsa_kp["ed_priv_hex"])

        # Store public keys in DB
        user.kem_public_key_hex = kem_kp["ek_hex"]
        user.dsa_verification_key_hex = dsa_kp["vk_hex"]
        db.commit()
        print(f"  [OK] Keys generated and stored for {username}")


def _seed_documents(db, admin_user: User):
    """Seed 2 classified demo documents if none exist."""
    if db.query(Document).count() > 0:
        return  # Already seeded

    from backend.data_init import generate_sample_documents
    docs = generate_sample_documents()
    for d in docs:
        doc = Document(
            id=d["id"],
            title=d["title"],
            classification=d["classification"],
            description=d.get("description", ""),
            image_b64=d["image_b64"],
            created_at=datetime.datetime.utcnow(),
            created_by=admin_user.id
        )
        db.add(doc)
    db.commit()
    print(f"  [OK] Seeded {len(docs)} classified demo documents")


def init_db():
    """Full database initialization and seeding."""
    print("\n[AEGIS-PQC] Initializing database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("[AEGIS-PQC] Seeding default users...")
        user_map = _seed_users(db)

        print("[AEGIS-PQC] Generating PQC keypairs for user1–user4 (this may take ~60s first run)...")
        _seed_pqc_keys(db, user_map)

        print("[AEGIS-PQC] Seeding classified demo documents...")
        _seed_documents(db, user_map.get("admin1"))

        print("[AEGIS-PQC] Database ready.\n")
    except Exception as e:
        print(f"[AEGIS-PQC] WARNING: DB init error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    init_db()


# ---------------------------------------------------------------------------
# Serve frontend production build (if built)
# ---------------------------------------------------------------------------
_frontend_dist = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)
if os.path.isdir(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=False)
