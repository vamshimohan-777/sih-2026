# AEGIS-PQC: Master Presentation & Live Demonstration Guide
### Problem Statement: SIH26237 — Post-Quantum Forensic Watermarking & Leak Attribution System

> **Objective:** Deliver a flawless, high-impact live demonstration of the AEGIS-PQC system to hackathon judges, defense evaluators, and technical panels.

---

## 📋 Table of Contents
1. [Elevator Pitch (30 Seconds)](#1-elevator-pitch-30-seconds)
2. [Quickstart & Launch Command](#2-quickstart--launch-command)
3. [Live Demo Script: Step-by-Step ("What to Show & What to Say")](#3-live-demo-script-step-by-step)
   - [Act I: The Core Problem & Architecture (1 Min)](#act-i-the-core-problem--architecture-1-min)
   - [Act II: Live Encrypter & PQC Distribution (1.5 Min)](#act-ii-live-encrypter--pqc-distribution-15-min)
   - [Act III: Recipient Decryption, Watermark & Signing (2 Min)](#act-iii-recipient-decryption-watermark--signing-2-min)
   - [Act IV: Attack Simulation & Forensic Radar Attribution (The Star Climax - 2.5 Min)](#act-iv-attack-simulation--forensic-radar-attribution-the-star-climax---25-min)
   - [Act V: Byzantine Fault Tolerance & Rogue Admin Tamper Lab (1.5 Min)](#act-v-byzantine-fault-tolerance--rogue-admin-tamper-lab-15-min)
   - [Act VI: NIST PQC Compliance & KAT Verification (1 Min)](#act-vi-nist-pqc-compliance--kat-verification-1-min)
4. [Anticipated Judge Questions & Bulletproof Answers](#4-anticipated-judge-questions--bulletproof-answers)

---

## 1. Elevator Pitch (30 Seconds)

> *"In broadcast encryption, everyone decrypts a byte-identical document. If that document is leaked to the public, every recipient is equally suspect, and server logs can be altered by any corrupt administrator.*
>
> *AEGIS-PQC solves this insider threat problem permanently. At the exact millisecond of recipient decryption, our system embeds an invisible forensic watermark, cryptographically binds the decryption to the recipient’s identity using **NIST FIPS 204 ML-DSA-65 post-quantum signatures**, and commits an immutable record to a **4-node permissioned blockchain**. Even if the leaker takes a tilted photo of their screen with a smartphone, our forensic scanner un-warps the image, recovers the watermark, and definitively attributes the leak with non-repudiable cryptographic proof—all operating 100% offline in an air-gapped environment."*

---

## 2. Quickstart & Launch Command

### To Start the System (One Command):
```bash
python run_system.py
```
Open your web browser to:
👉 **`http://127.0.0.1:8000`**

*(Note: The FastAPI server automatically serves the unified cyber command center frontend and all REST endpoints simultaneously on port 8000).*

---

## 3. Live Demo Script: Step-by-Step

### Act I: The Core Problem & Architecture (1 Min)
- **Where to go:** Click on **`Architecture & Workflow`** (Tab 1).
- **What to show:**
  - The side-by-side comparison matrix: **The Problem** (Group Decryption Dilemma) vs. **Our Solution**.
  - The 6-stage end-to-end interactive workflow flowchart matching the official problem statement diagram.
  - The **Air-Gapped Deployment Topology**: 4 distinct stations (Sender, Recipient, 4-Node DLT, Forensic Workstation).
- **What to say:**
  - *"Notice the hard constraints from the SIH problem statement: Zero Cloud KMS, Zero Public Blockchain, 100% Air-Gapped, and NIST-standardized Post-Quantum Cryptography. Our entire architecture runs locally on hardware tokens and an internal Byzantine consortium."*

---

### Act II: Live Encrypter & PQC Distribution (1.5 Min)
- **Where to go:** Click on **`Live Encrypter`** (Tab 2).
- **What to show:**
  - Select the classified document: `DOC-DEFENSE-701` (*"Quantum-Resilient Defense Link Specification"*).
  - Select two recipients: **Dr. Aris Thorne** (Chief Cryptographer) and **Elena Rostova** (Director of Cyber Operations).
  - Click the glowing button: **`RUN QUANTUM ENCRYPTION & DISTRIBUTION`**.
- **What happens on screen:**
  - Hologram turns into an encryption matrix.
  - Live execution diagnostics stream in real time:
    - `Step 1`: Master 256-bit AES symmetric key generated via CSPRNG.
    - `Step 2`: Bulk document encrypted with **AES-256-GCM** (96-bit IV, 128-bit authentication tag).
    - `Step 3`: Content key encapsulated for each recipient using **NIST FIPS 203 ML-KEM-768** lattice public keys.
  - The **Distribution Package Sealed Card** appears with package ID `PKG-xxxxxxxx` and timing metrics (~35 ms).
- **What to say:**
  - *"We don't bet solely on classical crypto or unverified algorithms. Bulk data is encrypted with authenticated AES-256-GCM, and the content key is wrapped individually for each recipient using NIST's finalized post-quantum standard, ML-KEM-768."*
- **Transition:** Click **`PROCEED TO RECIPIENT DECRYPTION TERMINAL`**.

---

### Act III: Recipient Decryption, Watermark & Signing (2 Min)
- **Where to go:** You are now in **`Live Decrypter & Mark`** (Tab 3).
- **What to show:**
  - The Package ID is auto-populated.
  - Select **Dr. Aris Thorne** (`user_042`) as the recipient.
  - Point out that the device is an air-gapped terminal holding Aris Thorne’s private keys in a virtualized local HSM token.
  - Click **`EXECUTE DECRYPTION & WATERMARKING`**.
- **What happens on screen:**
  - Visual spinner shows decapsulation $\rightarrow$ AES authentication $\rightarrow$ dynamic watermark injection $\rightarrow$ digital signing $\rightarrow$ DLT broadcast.
  - The decrypted document renders.
  - Point out the **Forensic Watermark Inspector**:
    - **PSNR Metric:** Displays **`45.65 dB`** (Industry threshold $>45\text{ dB}$ for imperceptibility).
    - **SSIM Metric:** Displays **`0.999`** (virtually $1.0$, identical structural similarity).
  - Click the toggle: **`Amplified Diff Heatmap (x30)`**.
    - Watch the image transform into a vivid heatmap displaying the amplified DWT-DCT spread-spectrum frequency residuals!
  - Point out the **ML-DSA Signature Box**:
    - Generated a 3309-byte digital signature using **NIST FIPS 204 ML-DSA-65**.
- **What to say:**
  - *"Notice that to human eyes, the document is pristine and unblemished. But under our amplified difference inspector, you can see the multi-domain spread-spectrum fingerprint embedded specifically for Dr. Aris Thorne and this specific decryption session. Furthermore, Aris's local token signed the audit record with ML-DSA-65, establishing absolute non-repudiation."*
- **Transition:** Click **`SIMULATE LEAK & TEST FORENSIC SCANNER ATTRIBUTION`**.

---

### Act IV: Attack Simulation & Forensic Radar Attribution (The Star Climax - 2.5 Min)
- **Where to go:** You are now in **`Forensic Lab & Leak Scanner`** (Tab 4).
- **What to show:**
  - Dr. Aris Thorne's decrypted copy is selected.
  - Explain: *"In the real world, leakers don't send clean PDFs. They photograph their monitor with a smartphone or compress it heavily."*
  - Under the **Degradation Attack Lab**, select **`Phone Screen Photo`** (smartphone screen recapture).
  - Set the slider to **`50%`**.
  - Click **`APPLY SELECTED ATTACK TO DOCUMENT`**.
  - **Show the result:** The image now has an LCD Moiré grid wave, ambient glare reflection spot, camera angle perspective tilt, and vignette darkening!
  - Now, click the big button: **`RUN FORENSIC WATERMARK SCANNER & ATTRIBUTION`**.
- **What happens on screen:**
  - The **green/cyan laser scanning line sweeps across the attacked document** with radar audio-visual cues!
  - Multi-stage diagnostic logs stream:
    - *Auto-rectifying boundary homography perspective tilt...*
    - *Extracting DWT-DCT luminance residuals...*
    - *Correlating against blockchain ledger watermark signatures...*
    - *Verifying ML-DSA-65 signature with recipient public key...*
    - *Verifying Merkle inclusion proof in Block #X...*
  - **The Grand Finale:** Confetti bursts across the screen! 🎉
  - The **Attribution Verdict Card** appears:
    - Culprit: **Dr. Aris Thorne (`user_042`)**
    - Confidence: **`99.8%`**
    - Decryption Timestamp & Session Nonce
    - Cryptographic Proof: **`ML-DSA-65 Signature Validated (Non-Repudiation Secured)`**
    - Ledger Proof: **`4/4 Custodian PBFT Quorum Verified`**
  - Click **`EXPORT CRYPTOGRAPHIC ATTRIBUTION CERTIFICATE (JSON)`** to show the downloadable forensic evidence file.
- **What to say:**
  - *"Despite perspective tilt, screen pixel grid distortion, and camera reflection, our multi-domain synchronization fiducials rectified the image, matched the watermark frequency pattern, verified the Dilithium digital signature on the blockchain, and conclusively identified the leaker."*

---

### Act V: Byzantine Fault Tolerance & Rogue Admin Tamper Lab (1.5 Min)
- **Where to go:** Click on **`DLT Ledger & Consensus`** (Tab 5).
- **What to show:**
  - The 4 Custodian Nodes:
    - `NODE_IT_SEC`: IT Security Operations
    - `NODE_COMPLIANCE`: Compliance Directorate
    - `NODE_AUDITOR`: Independent Audit Office
    - `NODE_LEGAL`: Office of General Counsel
  - The chain of blocks showing Merkle roots and 4/4 PBFT votes.
  - Explain: *"What if a corrupt super-admin tries to alter the database to frame someone else or erase their own tracks?"*
  - Click: **`Simulate Rogue Admin Tamper Attack`**.
- **What happens on screen:**
  - Red alert flashes: **`TAMPER DETECTED: CRYPTOGRAPHIC MERKLE ROOT FAILURE!`**
  - The system highlights the broken block: Merkle root recalculated does not match, and PBFT consensus is rejected across the other 3 nodes!
  - Click **`Restore Clean Ledger State`** to show recovery.
- **What to say:**
  - *"Because our ledger requires PBFT Byzantine majority consensus across 4 independent custodian entities, no single admin can alter a record without immediate cryptographic rejection."*

---

### Act VI: NIST PQC Compliance & KAT Verification (1 Min)
- **Where to go:** Click on **`NIST PQC Benchmarks`** (Tab 6).
- **What to show:**
  - 100% NIST FIPS Compliant badge.
  - Click **`Run Live Benchmark`** to show live latency measurements executed on the local machine (KeyGen: ~2 ms, Encaps: ~3 ms, Sign: ~8 ms).
  - Traceability table proving each item in the SIH problem statement has been addressed with byte-exact compliance.

---

## 4. Anticipated Judge Questions & Bulletproof Answers

| Question | Bulletproof Answer |
|---|---|
| **"Why not just use digital watermarks applied before distribution?"** | *"Static watermarks applied before distribution are byte-identical for all group recipients. If shared with 10 people, a leak cannot distinguish which of the 10 was the culprit. AEGIS-PQC injects the mark dynamically at decryption time."* |
| **"What if the recipient claims someone forged their decryption log?"** | *"They cannot repudiate it. The decryption record is signed using NIST FIPS 204 ML-DSA-65 with the recipient's private key held on their local HSM token. Forging that signature is mathematically equivalent to breaking Module-Lattice cryptography."* |
| **"Why not use Ethereum or public blockchain?"** | *"The problem statement strictly forbids public blockchain networks and cloud KMS due to air-gapped national security requirements. We use a private, permissioned PBFT ledger replicated across 4 internal custodians."* |
| **"How does the watermark survive a phone camera photo?"** | *"We use a multi-domain hybrid approach: DWT-DCT spread spectrum embedded into the luminance channel combined with corner geometric synchronization fiducials. When a photographed document is analyzed, our extractor detects the corner fiducials, un-warps the perspective tilt via homography transform, and recovers the correlation peak."* |
| **"Is this quantum-safe right now?"** | *"Yes. We implemented finalized NIST standards: FIPS 203 (ML-KEM-768 / Kyber) and FIPS 204 (ML-DSA-65 / Dilithium), with hybrid classical fallbacks (X25519/Ed25519) to reflect modern defense-in-depth transition standards."* |
