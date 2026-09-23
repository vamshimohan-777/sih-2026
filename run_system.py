"""
Unified Startup Script for Post-Quantum Forensic Watermarking & Leak Attribution System.
Launches the full-stack system on http://127.0.0.1:8000
"""
import os
import sys
import uvicorn

if __name__ == "__main__":
    print("=" * 70)
    print("  AEGIS-PQC // SIH26237 — CYBER COMMAND CENTER")
    print("  Post-Quantum Forensic Watermarking & Leak Attribution System")
    print("=" * 70)
    print("  • Deployment Mode: AIR-GAPPED OFFLINE")
    print("  • PQC Suite: NIST FIPS 203 (ML-KEM-768) + FIPS 204 (ML-DSA-65)")
    print("  • DLT Ledger: 4-Node PBFT Permissioned Byzantine Consortium")
    print("  • Forensic Watermark: Multi-Domain DWT-DCT Spread Spectrum")
    print("-" * 70)
    print("  Access the Cyber Command Center at: http://127.0.0.1:8000")
    print("=" * 70)
    
    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=False)
