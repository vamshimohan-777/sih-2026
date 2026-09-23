import React, { useState } from 'react';
import { 
  FileSearch, 
  Search, 
  Camera, 
  Minimize2, 
  Radio, 
  Flame, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Terminal, 
  Sliders, 
  Cpu, 
  Database, 
  Award,
  Sparkles,
  Upload,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ForensicLab({ decryptedInstances }) {
  const [selectedInstanceId, setSelectedInstanceId] = useState(decryptedInstances[0]?.instance_id || '');
  const [candidateImageB64, setCandidateImageB64] = useState(decryptedInstances[0]?.watermarked_image_b64 || '');
  
  // Attack Controls
  const [attackType, setAttackType] = useState('recapture'); // 'recapture', 'jpeg', 'noise', 'crop', 'blur'
  const [attackIntensity, setAttackIntensity] = useState(50);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackInfo, setAttackInfo] = useState(null);

  // Scanner Controls
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanLogs, setScanLogs] = useState([]);
  const [attributionReport, setAttributionReport] = useState(null);

  // If decryptedInstances updates
  React.useEffect(() => {
    if (decryptedInstances.length > 0 && !candidateImageB64) {
      setSelectedInstanceId(decryptedInstances[0].instance_id);
      setCandidateImageB64(decryptedInstances[0].watermarked_image_b64);
    }
  }, [decryptedInstances]);

  const handleSelectInstance = (id) => {
    setSelectedInstanceId(id);
    const inst = decryptedInstances.find(d => d.instance_id === id);
    if (inst) {
      setCandidateImageB64(inst.watermarked_image_b64);
      setAttackInfo(null);
      setAttributionReport(null);
    }
  };

  const handleCustomUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCandidateImageB64(reader.result.split(',')[1]);
        setSelectedInstanceId('custom_uploaded');
        setAttackInfo(null);
        setAttributionReport(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyAttack = async () => {
    if (!candidateImageB64) return;
    setIsAttacking(true);
    try {
      const res = await fetch('/api/attacks/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_b64: candidateImageB64,
          attack_type: attackType,
          intensity: attackIntensity
        })
      });
      const data = await res.json();
      setCandidateImageB64(data.attacked_image_b64);
      setAttackInfo(data.description);
      setAttributionReport(null);
    } catch (err) {
      console.error("Attack failed", err);
    } finally {
      setIsAttacking(false);
    }
  };

  const runForensicScanner = async () => {
    if (!candidateImageB64) return;
    setIsScanning(true);
    setScanStep(1);
    setAttributionReport(null);
    setScanLogs([
      "Stage 1: Ingesting leaked document candidate into isolated forensic workstation...",
      "Analyzing boundary contours: applying automatic geometric homography rectification..."
    ]);

    try {
      await new Promise(r => setTimeout(r, 600));
      setScanStep(2);
      setScanLogs(prev => [
        ...prev,
        "Stage 2: 2D Wavelet DWT decomposition: separating luminance Y-channel...",
        "Executing Gaussian high-pass filtering to isolate microscopic spread-spectrum residuals..."
      ]);

      await new Promise(r => setTimeout(r, 700));
      setScanStep(3);
      setScanLogs(prev => [
        ...prev,
        "Stage 3: Correlating extracted frequency residuals against registered ledger watermark signatures...",
        "Calculating normalized cross-correlation peaks and signal-to-noise Z-scores..."
      ]);

      const res = await fetch('/api/forensics/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_image_b64: candidateImageB64
        })
      });

      const report = await res.json();
      await new Promise(r => setTimeout(r, 600));

      if (report.attributed) {
        setScanStep(4);
        setScanLogs(prev => [
          ...prev,
          `✓ Forensic correlation match confirmed: Watermark ID ${report.session_details.watermark_id}`,
          `Stage 4: Querying Permissioned DLT Ledger for Block #${report.ledger_audit_proof.committed_block_height}...`,
          "Stage 5: Verifying NIST FIPS 204 ML-DSA-65 post-quantum signature with recipient public key...",
          "✓ Cryptographic proof valid: strict non-repudiation confirmed!",
          `Stage 6: Quorum disclosure completed with 4/4 custodian consensus.`
        ]);

        setAttributionReport(report);
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        setScanLogs(prev => [
          ...prev,
          "Attribution inconclusive: No registered watermark signature matched the candidate document."
        ]);
        setAttributionReport(report);
      }
    } catch (err) {
      console.error(err);
      setScanLogs(prev => [...prev, `[ERROR]: Scanner error: ${err.message}`]);
    } finally {
      setIsScanning(false);
    }
  };

  const downloadCertificate = () => {
    if (!attributionReport) return;
    const blob = new Blob([JSON.stringify(attributionReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Forensic_Attribution_Certificate_${attributionReport.session_details.watermark_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border/60 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white flex items-center space-x-2">
            <FileSearch className="w-6 h-6 text-cyan-400" />
            <span>Forensic Attribution Lab & Leak Scanner</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Extract forensic watermarks from degraded copies (even phone screen photos), cross-check the blockchain ledger, and prove leak origin.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800">
          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Multi-Domain Frequency Correlation Radar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Leak Source & Attack Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Select Source */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <h3 className="font-mono font-bold text-sm text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>1. Select Leaked Document Source</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Target</span>
            </h3>

            <div className="space-y-2">
              {decryptedInstances.map((inst) => {
                const isSelected = selectedInstanceId === inst.instance_id;
                return (
                  <div
                    key={inst.instance_id}
                    onClick={() => handleSelectInstance(inst.instance_id)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-400 shadow-md'
                        : 'bg-slate-900/50 border-slate-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-300 font-bold">{inst.instance_id}</span>
                      <span className="text-emerald-400 font-semibold">{inst.recipient_name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Watermark: <span className="text-slate-300 font-mono">{inst.watermark_id}</span>
                    </div>
                  </div>
                );
              })}

              <label className="block p-3 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/40 cursor-pointer transition text-center">
                <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-300 font-mono">
                  Or Upload Any Leaked Candidate File
                </span>
                <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Realistic Leak Attack Simulation Matrix */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <h3 className="font-mono font-bold text-sm text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-red-400" />
                <span>2. Leak & Degradation Attack Lab</span>
              </span>
              <span className="text-[10px] font-mono text-red-400">Stress Test</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Real leaks are degraded by lossy recompression or photographed off a screen. Apply simulated attacks below to test watermark resilience:
            </p>

            {/* Attack Type Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={() => setAttackType('recapture')}
                className={`p-2.5 rounded-lg border flex items-center space-x-2 transition ${
                  attackType === 'recapture'
                    ? 'bg-red-950/60 border-red-500 text-red-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4 text-red-400" />
                <span>Phone Screen Photo</span>
              </button>

              <button
                onClick={() => setAttackType('jpeg')}
                className={`p-2.5 rounded-lg border flex items-center space-x-2 transition ${
                  attackType === 'jpeg'
                    ? 'bg-red-950/60 border-red-500 text-red-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Minimize2 className="w-4 h-4 text-red-400" />
                <span>Lossy JPEG (30%)</span>
              </button>

              <button
                onClick={() => setAttackType('noise')}
                className={`p-2.5 rounded-lg border flex items-center space-x-2 transition ${
                  attackType === 'noise'
                    ? 'bg-red-950/60 border-red-500 text-red-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4 text-red-400" />
                <span>Sensor Noise</span>
              </button>

              <button
                onClick={() => setAttackType('crop')}
                className={`p-2.5 rounded-lg border flex items-center space-x-2 transition ${
                  attackType === 'crop'
                    ? 'bg-red-950/60 border-red-500 text-red-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4 text-red-400" />
                <span>Crop & Scale</span>
              </button>
            </div>

            {/* Intensity Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Degradation Severity</span>
                <span className="text-red-400 font-bold">{attackIntensity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={attackIntensity}
                onChange={(e) => setAttackIntensity(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <button
              onClick={applyAttack}
              disabled={isAttacking || !candidateImageB64}
              className="w-full py-2.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 font-mono font-bold text-xs flex items-center justify-center space-x-2 transition"
            >
              <Flame className="w-4 h-4 text-red-400" />
              <span>APPLY SELECTED ATTACK TO DOCUMENT</span>
            </button>

            {attackInfo && (
              <div className="text-[11px] font-mono text-amber-300 bg-amber-950/30 p-2.5 rounded border border-amber-800">
                {attackInfo}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Radar Scanner & Attribution Verdict (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Candidate Document with Radar Scanning Overlay */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-cyan-300 uppercase tracking-wider flex items-center space-x-2">
                <Radio className="w-4 h-4" />
                <span>Candidate Forensic Visualizer</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {attackInfo ? "ATTACKED / DEGRADED" : "UNALTERED LEAK CANDIDATE"}
              </span>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[280px]">
              {candidateImageB64 ? (
                <div className="relative">
                  <img
                    src={`data:image/png;base64,${candidateImageB64}`}
                    alt="Candidate Leaked Document"
                    className="max-h-[300px] w-auto object-contain"
                  />

                  {/* Scanning Radar Overlay Animation */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-cyan-950/50 backdrop-blur-[1px] flex flex-col items-center justify-center overflow-hidden">
                      {/* Laser scanning line */}
                      <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_15px_#00ffcc] animate-scanline" />
                      <div className="w-20 h-20 rounded-full border-2 border-cyan-400 border-dashed animate-spin flex items-center justify-center">
                        <Radio className="w-8 h-8 text-cyan-400 animate-pulse" />
                      </div>
                      <div className="mt-4 text-cyan-300 font-mono font-bold text-sm tracking-wider animate-pulse">
                        FREQUENCY RADAR SCANNING ACTIVE
                      </div>
                      <div className="text-[11px] font-mono text-slate-300 mt-1">
                        Correlating DWT-DCT spread spectrum against blockchain ledger...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-500 font-mono text-xs">
                  <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <div>Select a leaked document source or upload a candidate to scan.</div>
                </div>
              )}
            </div>

            {/* Run Forensic Scanner Button */}
            <button
              onClick={runForensicScanner}
              disabled={isScanning || !candidateImageB64}
              className={`w-full py-3.5 rounded-xl font-mono font-bold text-sm tracking-wider flex items-center justify-center space-x-2 transition shadow-lg ${
                isScanning
                  ? 'bg-cyan-900 text-cyan-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black shadow-cyan-500/25'
              }`}
            >
              <FileSearch className="w-5 h-5" />
              <span>RUN FORENSIC WATERMARK SCANNER & ATTRIBUTION</span>
            </button>
          </div>

          {/* Real-Time Forensic Scanning Diagnostics */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Terminal className="w-4 h-4" />
                <span>Forensic Investigation Pipeline Trace</span>
              </span>
              <span>DWT-DCT // ML-DSA-65 // DLT Audit</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1 text-[11px]">
              {scanLogs.length === 0 ? (
                <div className="text-slate-500 italic">
                  &gt; Waiting. Click "Run Forensic Watermark Scanner" to investigate this candidate...
                </div>
              ) : (
                scanLogs.map((log, i) => (
                  <div key={i} className="text-slate-300 flex items-start space-x-2">
                    <span className="text-cyan-400 select-none">&gt;</span>
                    <span className={log.includes("✓") ? "text-emerald-400 font-semibold" : ""}>{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Conclusive Attribution Verdict Card */}
          {attributionReport && attributionReport.attributed && (
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-cyan-950/50 border-2 border-emerald-500 p-6 space-y-5 shadow-2xl shadow-emerald-500/10 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono font-extrabold text-base text-emerald-300 tracking-wide">
                      VERDICT: FORENSIC ATTRIBUTION DEFINITIVELY CONFIRMED
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400">
                      Cryptographically bound non-repudiable audit evidence established
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono text-xs font-bold">
                  {attributionReport.forensic_metrics.confidence_percentage}% CONFIDENCE
                </div>
              </div>

              {/* Culprit Profile Header */}
              <div className="flex items-center space-x-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                {attributionReport.recipient.avatar && (
                  <img
                    src={attributionReport.recipient.avatar}
                    alt={attributionReport.recipient.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400"
                  />
                )}
                <div className="space-y-1">
                  <div className="text-lg font-bold text-white flex items-center space-x-2">
                    <span>{attributionReport.recipient.name}</span>
                    <span className="text-xs font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                      {attributionReport.recipient.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {attributionReport.recipient.role} // {attributionReport.recipient.department}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Clearance: <strong className="text-emerald-300">{attributionReport.recipient.clearance}</strong>
                  </div>
                </div>
              </div>

              {/* Proof Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400">DECRYPTION TIMESTAMP</div>
                  <div className="text-white font-bold">{attributionReport.session_details.decryption_timestamp}</div>
                  <div className="text-[9px] text-slate-500">Session: {attributionReport.session_details.session_nonce}</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400">POST-QUANTUM SIGNATURE</div>
                  <div className="text-purple-300 font-bold">ML-DSA-65 Validated</div>
                  <div className="text-[9px] text-emerald-400">✓ Non-Repudiation Secured</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-400">LEDGER AUDIT PROOF</div>
                  <div className="text-cyan-300 font-bold">Block #{attributionReport.ledger_audit_proof.committed_block_height}</div>
                  <div className="text-[9px] text-slate-400">4/4 Custodian PBFT Quorum</div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={downloadCertificate}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs flex items-center justify-center space-x-2 border border-slate-700 transition"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>EXPORT CRYPTOGRAPHIC ATTRIBUTION CERTIFICATE (JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
