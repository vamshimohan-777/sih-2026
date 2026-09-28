import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

// Step timeline item
function StepItem({ step, active }) {
  return (
    <div className={`flex gap-3 ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          active ? 'border-teal-500 text-teal-400 bg-teal-500/10' : 'border-slate-600 text-slate-600'
        }`}>
          {step.step}
        </div>
        <div className="w-px flex-1 bg-[#1e3a5f] mt-1 mb-1" />
      </div>
      <div className="pb-4 min-w-0">
        <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-500'}`}>{step.name || step.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{step.tech || step.desc}</p>
        {active && step.output_preview && (
          <p className="text-xs font-mono text-teal-300 mt-1 break-all bg-[#0a0f1e] rounded px-2 py-1">
            {step.output_preview}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DecryptPanel({ initialDocId }) {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [packageId, setPackageId] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE | PROCESSING | SUCCESS | ERROR
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // All roles: load all packages (user sees theirs via envelope check at decrypt time)
    api.getPackages().catch(() => []).then(pkgs => setPackages(pkgs || []));
  }, []);

  const handleDecrypt = async () => {
    if (!packageId) { setError('Select a package to decrypt'); return; }

    setStatus('PROCESSING');
    setError('');
    setCurrentStep(0);
    setResult(null);

    const stepTimer = setInterval(() => {
      setCurrentStep(s => Math.min(s + 1, 5));
    }, 800);

    try {
      const res = await api.decrypt({
        package_id: packageId,
        recipient_id: user.id,   // always the logged-in user
      });
      clearInterval(stepTimer);
      setCurrentStep(6);
      setResult(res);
      setStatus('SUCCESS');
    } catch (err) {
      clearInterval(stepTimer);
      setError(err.message || 'Decryption failed');
      setStatus('ERROR');
    }
  };

  const reset = () => {
    setStatus('IDLE');
    setResult(null);
    setError('');
    setCurrentStep(0);
    setPackageId('');
  };

  const STEP_LABELS = [
    { step: 1, name: 'ML-KEM-768 Decapsulation',           tech: 'NIST FIPS 203 — Lattice KEM' },
    { step: 2, name: 'Content Key Unwrapping',              tech: 'AES-256-GCM Authenticated Decryption' },
    { step: 3, name: 'Document Plaintext Recovery',         tech: 'AEAD Integrity Verification' },
    { step: 4, name: 'Invisible Forensic Watermarking',     tech: 'DWT-DCT Spread Spectrum Embedding' },
    { step: 5, name: 'ML-DSA-65 Non-Repudiation Signature', tech: 'NIST FIPS 204 — Post-Quantum DSA' },
    { step: 6, name: 'PBFT Consensus Ledger Commit',        tech: 'Permissioned DLT — Merkle Block' },
  ];

  const steps = result?.decryption_steps || STEP_LABELS;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Decryption & Verification Portal</h2>
        <p className="text-sm text-slate-500 font-mono mt-0.5">
          ML-KEM-768 Decapsulation · AES-256-GCM · DWT Watermark · PBFT Ledger
        </p>
      </div>

      {status === 'IDLE' || status === 'ERROR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="aegis-panel p-6 space-y-4">
            <h3 className="text-sm font-mono text-teal-400 uppercase tracking-wider">Initiate Decryption</h3>

            {/* Logged-in user identity — read only */}
            <div className="bg-[#0a0f1e] border border-[#1e3a5f] rounded px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">DECRYPTING AS:</span>
              <span className="text-sm text-teal-300 font-mono font-bold">{user.username}</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 rounded font-mono">{user.role}</span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">
                {error}
              </div>
            )}

            {/* Package selector */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">Encrypted Package</label>
              {packages.length === 0 ? (
                <p className="text-slate-500 text-sm font-mono">
                  No packages available. You have not been enrolled in any package yet.
                </p>
              ) : (
                <select
                  value={packageId}
                  onChange={e => setPackageId(e.target.value)}
                  className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 font-mono"
                >
                  <option value="">— Select package —</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id} {p.doc_id ? `· doc: ${p.doc_id}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={handleDecrypt}
              disabled={!packageId || packages.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white py-3 rounded font-bold tracking-wide transition-colors"
            >
              INITIATE DECRYPTION SEQUENCE
            </button>

            <p className="text-xs text-slate-600 font-mono text-center">
              Decryption triggers forensic watermarking & PBFT ledger commit
            </p>
          </div>

          {/* Step preview */}
          <div className="aegis-panel p-6">
            <h3 className="text-sm font-mono text-slate-400 mb-4 uppercase tracking-wider">Decryption Pipeline</h3>
            <div>
              {STEP_LABELS.map(s => (
                <StepItem key={s.step} step={s} active={false} />
              ))}
            </div>
          </div>
        </div>
      ) : status === 'PROCESSING' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spinner */}
          <div className="aegis-panel p-6 flex flex-col items-center justify-center h-64 space-y-4">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-teal-400 font-mono animate-pulse text-sm">Executing cryptographic pipeline...</p>
          </div>
          {/* Live steps */}
          <div className="aegis-panel p-6">
            <h3 className="text-sm font-mono text-slate-400 mb-4 uppercase tracking-wider">Live Pipeline</h3>
            <div>
              {STEP_LABELS.map(s => (
                <StepItem key={s.step} step={s} active={s.step <= currentStep} />
              ))}
            </div>
          </div>
        </div>
      ) : status === 'SUCCESS' && result ? (
        <div className="space-y-6">
          {/* Success banner */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <p className="text-green-400 font-bold text-sm">DECRYPTION & WATERMARKING COMPLETE</p>
              <p className="text-xs text-slate-400 font-mono">
                Session: {result.instance_id} · Block #{result.block_height} committed to ledger
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Watermarked image */}
            <div className="lg:col-span-2 aegis-panel p-4 space-y-3">
              <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider">Watermarked Document</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 font-mono mb-1">ORIGINAL</p>
                  {result.original_image_b64 ? (
                    <img
                      src={`data:image/png;base64,${result.original_image_b64}`}
                      alt="original"
                      className="w-full rounded border border-[#1e3a5f] object-contain max-h-48"
                    />
                  ) : (
                    <div className="h-48 bg-[#0a0f1e] rounded border border-[#1e3a5f] flex items-center justify-center text-slate-600 text-xs">
                      no preview
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-mono mb-1">WATERMARKED (YOUR COPY)</p>
                  {result.watermarked_image_b64 ? (
                    <img
                      src={`data:image/png;base64,${result.watermarked_image_b64}`}
                      alt="watermarked"
                      className="w-full rounded border border-teal-500/30 object-contain max-h-48"
                    />
                  ) : (
                    <div className="h-48 bg-[#0a0f1e] rounded border border-[#1e3a5f] flex items-center justify-center text-slate-600 text-xs">
                      no preview
                    </div>
                  )}
                </div>
              </div>

              {result.diff_heatmap_b64 && (
                <div>
                  <p className="text-xs text-slate-500 font-mono mb-1">WATERMARK DIFF HEATMAP</p>
                  <img
                    src={`data:image/png;base64,${result.diff_heatmap_b64}`}
                    alt="heatmap"
                    className="w-full rounded border border-purple-500/30 object-contain max-h-32"
                  />
                </div>
              )}

              {result.watermarked_image_b64 && (
                <a
                  href={`data:image/png;base64,${result.watermarked_image_b64}`}
                  download={`watermarked_${result.instance_id}.png`}
                  className="inline-block bg-[#1e3a5f] hover:bg-teal-600 text-white text-sm px-4 py-2 rounded transition-colors"
                >
                  ↓ Download Watermarked Document
                </a>
              )}
            </div>

            {/* Metrics & Ledger */}
            <div className="space-y-4">
              {/* Quality metrics */}
              <div className="aegis-panel p-4">
                <h3 className="text-xs font-mono text-slate-400 uppercase mb-3">Quality Metrics</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">PSNR</p>
                    <p className={`text-2xl font-bold ${result.psnr_db >= 40 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {result.psnr_db} dB
                    </p>
                    <p className="text-xs text-slate-600">{result.psnr_db >= 40 ? 'Imperceptible watermark' : 'Visible degradation'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">SSIM</p>
                    <p className={`text-2xl font-bold ${result.ssim >= 0.99 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {result.ssim?.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Watermark & Ledger */}
              <div className="aegis-panel p-4">
                <h3 className="text-xs font-mono text-slate-400 uppercase mb-3">Ledger Verification</h3>
                <div className="space-y-2 font-mono text-xs">
                  <div>
                    <span className="text-slate-500">WATERMARK ID</span>
                    <p className="text-teal-300 break-all mt-0.5">{result.watermark_id}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">BLOCK</span>
                    <span className="text-white">#{result.block_height}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">BLOCK HASH</span>
                    <p className="text-teal-300 break-all mt-0.5">
                      {result.block_hash ? result.block_hash.slice(0, 32) + '...' : '—'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">SIGNATURE</span>
                    <span className="text-green-400">{result.pqc_signature_preview ? 'VALID' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step timeline */}
          <div className="aegis-panel p-6">
            <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider mb-4">Cryptographic Execution Log</h3>
            <div>
              {steps.map(s => (
                <StepItem key={s.step} step={s} active={true} />
              ))}
            </div>
          </div>

          <button
            onClick={reset}
            className="text-slate-400 hover:text-white text-sm underline"
          >
            ← Decrypt another package
          </button>
        </div>
      ) : null}
    </div>
  );
}
