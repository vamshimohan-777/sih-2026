import React, { useState } from 'react';
import { 
  Unlock, 
  Eye, 
  EyeOff, 
  Cpu, 
  PenTool, 
  Database, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Terminal, 
  Sliders, 
  Layers, 
  Hash, 
  ExternalLink,
  Flame
} from 'lucide-react';

export default function DecrypterTerminal({ 
  recipients, 
  latestPackageId, 
  onDecryptionSuccess, 
  onProceedToForensics 
}) {
  const [packageId, setPackageId] = useState(latestPackageId || '');
  const [selectedRecipientId, setSelectedRecipientId] = useState('user_042');
  
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionStep, setDecryptionStep] = useState(0);
  const [decryptLogs, setDecryptLogs] = useState([]);
  const [decryptionResult, setDecryptionResult] = useState(null);
  
  // Interactive view controls: 'watermarked', 'heatmap', 'split'
  const [viewMode, setViewMode] = useState('watermarked');
  const [splitSlider, setSplitSlider] = useState(50);

  const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);

  const runLiveDecryption = async () => {
    if (!packageId) {
      alert("Please enter or generate a distribution package ID first.");
      return;
    }

    setIsDecrypting(true);
    setDecryptionStep(1);
    setDecryptionResult(null);
    setDecryptLogs([
      `Mounting local hardware token for recipient ${selectedRecipient?.name} (${selectedRecipientId})...`,
      "Loading NIST FIPS 203 ML-KEM-768 decapsulation private key (2400 bytes)..."
    ]);

    try {
      await new Promise(r => setTimeout(r, 600));
      setDecryptionStep(2);
      setDecryptLogs(prev => [
        ...prev,
        "Decapsulating 32-byte shared secret from KEM envelope...",
        "Unwrapping AES-256 master content key and verifying GCM authentication tag..."
      ]);

      await new Promise(r => setTimeout(r, 700));
      setDecryptionStep(3);
      setDecryptLogs(prev => [
        ...prev,
        "Plaintext document recovered in memory.",
        "Generating per-session unique forensic payload: Recipient ID + Nonce + Timestamp...",
        "Executing DWT-DCT luminance spread-spectrum injection + geometric sync markers..."
      ]);

      const res = await fetch('/api/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageId,
          recipient_id: selectedRecipientId
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Decryption failed");
      }

      const data = await res.json();
      await new Promise(r => setTimeout(r, 600));

      setDecryptionStep(4);
      setDecryptLogs(prev => [
        ...prev,
        `✓ Watermark embedded: ${data.watermark_id} (PSNR: ${data.psnr_db} dB, SSIM: ${data.ssim}).`,
        "Signing decryption record with recipient's ML-DSA-65 private key (non-repudiation)...",
        `✓ ML-DSA-65 signature created: ${data.pqc_signature_preview}`,
        `Broadcasting transaction to 4-node DLT ledger (Block #${data.block_height})...`,
        "✓ Quorum reached: PBFT consensus verified across IT, Compliance, Auditor, and Legal!"
      ]);

      setDecryptionResult(data);
      if (onDecryptionSuccess) {
        onDecryptionSuccess(data);
      }
    } catch (err) {
      console.error(err);
      setDecryptLogs(prev => [...prev, `[ERROR]: Decryption terminated: ${err.message}`]);
      alert(`Decryption Error: ${err.message}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border/60 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white flex items-center space-x-2">
            <Unlock className="w-6 h-6 text-emerald-400" />
            <span>Recipient Terminal: Live Decrypter & Watermarking</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulates air-gapped recipient hardware decapsulation, real-time invisible watermark injection, and ML-DSA-65 non-repudiation signing.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Non-Repudiation: FIPS 204 ML-DSA-65</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recipient Hardware Token & Config (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Package Input */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <h3 className="font-mono font-bold text-sm text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>1. Distribution Package ID</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Encrypted Container</span>
            </h3>

            <input
              type="text"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              placeholder="e.g. PKG-B31F9A02"
              className="w-full px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400"
            />
            {latestPackageId && packageId !== latestPackageId && (
              <button
                onClick={() => setPackageId(latestPackageId)}
                className="text-xs font-mono text-cyan-400 hover:underline"
              >
                Use latest package ({latestPackageId})
              </button>
            )}
          </div>

          {/* Recipient Persona Selector */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <h3 className="font-mono font-bold text-sm text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>2. Recipient Hardware Identity</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-300">HSM Attached</span>
            </h3>

            <div className="space-y-2.5">
              {recipients.map((rec) => {
                const isSelected = selectedRecipientId === rec.id;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecipientId(rec.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/25 border-emerald-500 shadow-md'
                        : 'bg-slate-900/40 border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={rec.avatar} 
                        alt={rec.name} 
                        className="w-9 h-9 rounded-full object-cover border border-slate-700" 
                      />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>{rec.name}</span>
                          <span className="text-[10px] font-mono text-emerald-300">({rec.id})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{rec.role}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Clearance: <span className="text-slate-300">{rec.clearance}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px]">
                      <span className="text-emerald-400 block font-semibold">TOKEN ACTIVE</span>
                      <span className="text-slate-500">DK: 2400B</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={runLiveDecryption}
              disabled={isDecrypting || !packageId}
              className={`w-full py-3 rounded-xl font-mono font-bold text-sm tracking-wider flex items-center justify-center space-x-2 transition shadow-lg ${
                isDecrypting
                  ? 'bg-emerald-900 text-emerald-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-emerald-500/25'
              }`}
            >
              {isDecrypting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>DECAPSULATING & WATERMARKING...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>EXECUTE DECRYPTION & WATERMARKING</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Decryption Action & Watermark Quality Inspector (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Decrypted Document Visual Inspector */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-mono font-bold text-sm text-emerald-300 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>Forensic Watermark Inspector</span>
              </h3>

              {/* View Mode Toggle: Watermarked vs Heatmap */}
              {decryptionResult && (
                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setViewMode('watermarked')}
                    className={`px-2.5 py-1 rounded transition ${
                      viewMode === 'watermarked' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Watermarked View
                  </button>
                  <button
                    onClick={() => setViewMode('heatmap')}
                    className={`px-2.5 py-1 rounded transition ${
                      viewMode === 'heatmap' 
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Amplified Diff Heatmap (x30)
                  </button>
                </div>
              )}
            </div>

            {/* Image Viewer Area */}
            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[280px]">
              {decryptionResult ? (
                viewMode === 'heatmap' ? (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={`data:image/png;base64,${decryptionResult.diff_heatmap_b64}`}
                      alt="Amplified Watermark Heatmap"
                      className="max-h-[300px] w-auto object-contain"
                    />
                    <div className="absolute bottom-2 px-3 py-1 rounded bg-black/80 border border-purple-800 text-[11px] font-mono text-purple-300">
                      Amplified Forensic Signature Residuals (DWT-DCT Spread Spectrum)
                    </div>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center">
                    <img
                      src={`data:image/png;base64,${decryptionResult.watermarked_image_b64}`}
                      alt="Watermarked Decrypted Document"
                      className="max-h-[300px] w-auto object-contain"
                    />
                    <div className="absolute bottom-2 px-3 py-1 rounded bg-black/80 border border-emerald-800 text-[11px] font-mono text-emerald-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Visually Imperceptible // Stamped for {decryptionResult.recipient_name}</span>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center p-8 space-y-2 text-slate-500 font-mono text-xs">
                  <Unlock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <div>Document will be rendered here upon successful decryption.</div>
                  <div className="text-[11px] text-slate-600">
                    Watermark is embedded dynamically at the moment of decryption.
                  </div>
                </div>
              )}

              {/* Decrypting Animation Layer */}
              {isDecrypting && (
                <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin flex items-center justify-center">
                    <Unlock className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-emerald-300 font-mono font-bold text-sm animate-pulse">
                    ML-KEM DECAPSULATION + FORENSIC WATERMARKING
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 max-w-sm">
                    Recovering AES-256 key, injecting DWT-DCT spread spectrum, signing with ML-DSA-65...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Decryption & Forensic Execution Logs */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Terminal className="w-4 h-4" />
                <span>Decryption & Signature Trace</span>
              </span>
              <span>FIPS 203 & 204 // PBFT DLT</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1 text-[11px]">
              {decryptLogs.length === 0 ? (
                <div className="text-slate-500 italic">
                  &gt; Waiting. Click "Execute Decryption & Watermarking" to begin...
                </div>
              ) : (
                decryptLogs.map((log, i) => (
                  <div key={i} className="text-slate-300 flex items-start space-x-2">
                    <span className="text-emerald-400 select-none">&gt;</span>
                    <span className={log.includes("✓") ? "text-emerald-400 font-semibold" : ""}>{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Forensic Watermark Quality & Non-Repudiation Summary Card */}
          {decryptionResult && (
            <div className="rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-emerald-950/30 border border-cyan-500/50 p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-cyan-300 font-mono font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span>NON-REPUDIATION AUDIT RECORD SECURED</span>
                </div>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                  Block #{decryptionResult.block_height} Committed
                </span>
              </div>

              {/* Quality Metrics Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">PSNR FIDELITY</div>
                  <div className="text-emerald-400 font-bold text-sm">{decryptionResult.psnr_db} dB</div>
                  <div className="text-[9px] text-slate-500">&gt; 45 dB (Target Met)</div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">SSIM STRUCTURAL</div>
                  <div className="text-emerald-400 font-bold text-sm">{decryptionResult.ssim}</div>
                  <div className="text-[9px] text-slate-500">&gt; 0.99 (Target Met)</div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">WATERMARK ID</div>
                  <div className="text-cyan-300 font-bold text-xs truncate">{decryptionResult.watermark_id}</div>
                  <div className="text-[9px] text-slate-500">Deterministic SHA3</div>
                </div>

                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">ML-DSA SIGNATURE</div>
                  <div className="text-purple-300 font-bold text-xs truncate">3309 Bytes Valid</div>
                  <div className="text-[9px] text-slate-500">NIST FIPS 204</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onProceedToForensics(decryptionResult)}
                  className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-mono font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition"
                >
                  <Flame className="w-4 h-4" />
                  <span>SIMULATE LEAK & TEST FORENSIC SCANNER ATTRIBUTION</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
