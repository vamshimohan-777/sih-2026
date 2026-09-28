"""
AEGIS-PQC System Launcher
Single command to start the production-grade backend.
Usage: python run_system.py
"""
import os
import sys
import subprocess

def main():
    print("=" * 60)
    print("  AEGIS-PQC Post-Quantum Forensic Watermarking System")
    print("  SIH26237 | Air-Gapped | NIST FIPS 203/204")
    print("=" * 60)
    print()
    print("Starting backend server...")
    print()
    print("  API:      http://127.0.0.1:8000")
    print("  Docs:     http://127.0.0.1:8000/api/docs")
    print("  Frontend: http://127.0.0.1:8000")
    print()
    print("  Credentials:")
    print("    SUPERADMIN: superadmin1 / SuperAdmin@123")
    print("    ADMIN:      admin1      / Admin@123")
    print("    USER:       user1       / User1@123")
    print("                user2       / User2@123")
    print()
    print("NOTE: First startup generates PQC keypairs (~60-90s). Subsequent")
    print("      startups are instant (keys cached to storage/keys/).")
    print()
    print("Press Ctrl+C to stop.")
    print("=" * 60)

    os.environ.setdefault("PYTHONPATH", os.path.dirname(os.path.abspath(__file__)))

    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "backend.app.main:app",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--no-access-log"
    ])

if __name__ == "__main__":
    main()
