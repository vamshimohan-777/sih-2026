import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

// ─── Attack Simulator Panel ─────────────────────────────────────────────────
function AttackSimulator() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [attackType, setAttackType] = useState('jpeg');
  const [intensity, setIntensity] = useState(50);
  const [originalImg, setOriginalImg] = useState(null);    // b64
  const [attackedImg, setAttackedImg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    api.getDecryptedInstances()
      .then(data => setSessions(data || []))
      .catch(() => {});
  }, []);

  const ATTACKS = [
    { id: 'jpeg',      label: 'JPEG Compress', icon: '🗜' },
    { id: 'recapture', label: 'Recapture',     icon: '📷' },
    { id: 'noise',     label: 'Noise',         icon: '📡' },
    { id: 'crop',      label: 'Crop',          icon: '✂' },
    { id: 'blur',      label: 'Blur',          icon: '🔵' },
  ];

  const loadSession = async (id) => {
    if (!id) { setSelectedSession(null); setOriginalImg(null); setAttackedImg(null); return; }
    try {
      const sess = await api.getDecryptedInstance(id);
      setSelectedSession(sess);
      setOriginalImg(sess.watermarked_image_b64 || null);
      setAttackedImg(null);
    } catch (e) {
      setError('Failed to load session image');
    }
  };

  const runAttack = async () => {
    if (!originalImg) { setError('Select a decryption session first'); return; }
    setLoading(true);
    setError('');
    setAttackedImg(null);
    try {
      const res = await api.simulateAttack({
        image_b64: originalImg,
        attack_type: attackType,
        intensity,
      });
      setAttackedImg(res.attacked_image_b64);
      setDesc(res.description);
    } catch (e) {
      setError(e.message || 'Attack simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aegis-panel p-5 space-y-4">
      <h3 className="text-lg font-semibold text-teal-300 border-b border-[#1e3a5f] pb-2">
        Attack Simulator
      </h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded">{error}</div>
      )}

      {/* Session Selector */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Select Decrypted Document</label>
        <select
          className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
          onChange={e => loadSession(e.target.value)}
        >
          <option value="">— Choose session —</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.id} · {s.recipient_id} · PSNR {s.psnr_db} dB
            </option>
          ))}
        </select>
      </div>

      {/* Attack Type */}
      <div>
        <label className="block text-xs text-slate-400 mb-2">Attack Vector</label>
        <div className="flex flex-wrap gap-2">
          {ATTACKS.map(a => (
            <button
              key={a.id}
              onClick={() => setAttackType(a.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                attackType === a.id
                  ? 'bg-teal-600 border-teal-500 text-white'
                  : 'bg-[#0a0f1e] border-[#1e3a5f] text-slate-300 hover:border-teal-500/50'
              }`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Intensity: {intensity}%</label>
        <input
          type="range" min="1" max="100" value={intensity}
          onChange={e => setIntensity(Number(e.target.value))}
          className="w-full accent-teal-500"
        />
      </div>

      <button
        onClick={runAttack}
        disabled={loading || !originalImg}
        className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded text-sm font-bold disabled:opacity-40 transition-colors"
      >
        {loading ? 'Applying Attack...' : 'RUN ATTACK SIMULATION'}
      </button>

      {/* Before / After */}
      {(originalImg || attackedImg) && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 font-mono mb-1">ORIGINAL (WATERMARKED)</p>
            {originalImg ? (
              <img src={`data:image/png;base64,${originalImg}`} alt="original" className="w-full rounded border border-[#1e3a5f] object-contain max-h-40" />
            ) : (
              <div className="h-32 bg-[#0a0f1e] rounded border border-[#1e3a5f] flex items-center justify-center text-slate-600 text-xs">no image</div>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500 font-mono mb-1">AFTER ATTACK</p>
            {attackedImg ? (
              <img src={`data:image/png;base64,${attackedImg}`} alt="attacked" className="w-full rounded border border-orange-500/30 object-contain max-h-40" />
            ) : (
              <div className="h-32 bg-[#0a0f1e] rounded border border-[#1e3a5f] flex items-center justify-center text-slate-600 text-xs">run attack first</div>
            )}
          </div>
        </div>
      )}
      {desc && (
        <p className="text-xs text-slate-400 font-mono bg-[#0a0f1e] rounded px-3 py-2">{desc}</p>
      )}

      {/* Transfer attacked image to attribution */}
      {attackedImg && (
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('forensic-load-image', { detail: attackedImg }));
          }}
          className="w-full border border-teal-500/50 text-teal-400 hover:bg-teal-500/10 py-1.5 rounded text-xs font-mono transition-colors"
        >
          → Send Attacked Image to Attribution Engine
        </button>
      )}
    </div>
  );
}

// ─── Attribution Engine Panel ───────────────────────────────────────────────
function AttributionEngine() {
  const fileRef = useRef();
  const [sessions, setSessions] = useState([]);
  const [imageB64, setImageB64] = useState(null);
  const [imageSource, setImageSource] = useState(''); // 'file' | 'session'
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    api.getDecryptedInstances()
      .then(d => setSessions(d || []))
      .catch(() => {});

    // Listen for attacked image from simulator
    const handler = (e) => {
      setImageB64(e.detail);
      setImageSource('attacked image from simulator');
      setResult(null);
      setError('');
    };
    window.addEventListener('forensic-load-image', handler);
    return () => window.removeEventListener('forensic-load-image', handler);
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageB64(ev.target.result.split(',')[1]);
      setImageSource(file.name);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageB64(ev.target.result.split(',')[1]);
      setImageSource(file.name);
      setResult(null);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const loadFromSession = async (id) => {
    if (!id) return;
    try {
      const sess = await api.getDecryptedInstance(id);
      if (sess.watermarked_image_b64) {
        setImageB64(sess.watermarked_image_b64);
        setImageSource(`Session ${id}`);
        setResult(null);
        setError('');
      }
    } catch (e) {
      setError('Could not load session image');
    }
  };

  const runExtraction = async () => {
    if (!imageB64) { setError('Load an image first'); return; }
    setScanning(true);
    setResult(null);
    setError('');
    setProgress(0);

    // Progress animation
    const timer = setInterval(() => {
      setProgress(p => Math.min(p + 8, 90));
    }, 300);

    try {
      const res = await api.extractForensics({ candidate_image_b64: imageB64 });
      clearInterval(timer);
      setProgress(100);
      setResult(res);
    } catch (e) {
      clearInterval(timer);
      setError(e.message || 'Extraction failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="aegis-panel p-5 space-y-4">
      <h3 className="text-lg font-semibold text-teal-300 border-b border-[#1e3a5f] pb-2">
        Attribution Engine
      </h3>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded">{error}</div>
      )}

      {/* Input: file upload */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Upload Suspected Leaked Image</label>
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current.click()}
          className={`border-2 border-dashed rounded-lg h-28 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            imageB64 ? 'border-teal-500/60 bg-teal-500/5' : 'border-[#1e3a5f] hover:border-teal-500 hover:bg-teal-500/5'
          }`}
        >
          {imageB64 ? (
            <>
              <img src={`data:image/png;base64,${imageB64}`} alt="loaded" className="h-20 object-contain rounded" />
              <p className="text-xs text-teal-400 font-mono mt-1 truncate max-w-full px-2">{imageSource}</p>
            </>
          ) : (
            <>
              <p className="text-2xl mb-1">🔍</p>
              <p className="text-slate-500 text-xs">Drag & Drop or Click to Upload</p>
              <p className="text-slate-600 text-xs">Supports PNG, JPG</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Input: from decrypted session */}
      <div>
        <label className="block text-xs text-slate-400 mb-1">Or select from decrypted sessions</label>
        <select
          className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
          onChange={e => loadFromSession(e.target.value)}
        >
          <option value="">— Load watermarked image from session —</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.id} · {s.recipient_id} · PSNR {s.psnr_db} dB
            </option>
          ))}
        </select>
      </div>

      {/* Scan button */}
      <button
        onClick={runExtraction}
        disabled={scanning || !imageB64}
        className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white py-2.5 rounded font-bold text-sm transition-colors"
      >
        {scanning ? 'EXTRACTING WATERMARK PAYLOAD...' : 'RUN FORENSIC EXTRACTION'}
      </button>

      {/* Progress bar */}
      {scanning && (
        <div className="space-y-1">
          <div className="h-1.5 bg-[#0a0f1e] rounded overflow-hidden">
            <div
              className="h-full bg-teal-500 transition-all duration-300 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-teal-400 font-mono animate-pulse">
            DWT correlation sweep · {progress}% complete
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`rounded-lg border p-4 relative overflow-hidden ${
          result.attributed
            ? 'bg-red-500/5 border-red-500/40'
            : 'bg-slate-500/5 border-slate-500/30'
        }`}>
          <div className={`absolute top-0 left-0 w-1 h-full ${result.attributed ? 'bg-red-500' : 'bg-slate-500'}`} />

          <h4 className={`font-bold text-sm mb-3 ${result.attributed ? 'text-red-400' : 'text-slate-400'}`}>
            {result.attributed ? '⚠ LEAK ATTRIBUTED' : '✓ NO MATCH FOUND'}
          </h4>

          {result.attributed ? (
            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-slate-500">RECIPIENT:</span>
                <span className="text-white">{result.recipient?.username || result.recipient?.name}</span>

                <span className="text-slate-500">CONFIDENCE:</span>
                <span className="text-teal-400">{result.forensic_metrics?.confidence_percentage?.toFixed(1)}%</span>

                <span className="text-slate-500">CORRELATION:</span>
                <span className="text-teal-400">{result.forensic_metrics?.correlation_peak?.toFixed(4)}</span>

                <span className="text-slate-500">WATERMARK ID:</span>
                <span className="text-white break-all">{result.session_details?.watermark_id?.slice(0, 24)}...</span>

                <span className="text-slate-500">ML-DSA SIG:</span>
                <span className={result.cryptographic_proof?.ml_dsa_signature_valid ? 'text-green-400' : 'text-yellow-400'}>
                  {result.cryptographic_proof?.ml_dsa_signature_valid ? 'VALID ✓' : 'UNVERIFIED'}
                </span>

                <span className="text-slate-500">LEDGER BLOCK:</span>
                <span className="text-white">{result.ledger_audit_proof?.committed_block_height}</span>

                <span className="text-slate-500">MERKLE PROOF:</span>
                <span className={result.ledger_audit_proof?.merkle_proof_verified ? 'text-green-400' : 'text-yellow-400'}>
                  {result.ledger_audit_proof?.merkle_proof_verified ? 'VERIFIED ✓' : 'PENDING'}
                </span>

                <span className="text-slate-500">CONSENSUS:</span>
                <span className="text-green-400">
                  {result.ledger_audit_proof?.custodian_consensus_votes}/4 nodes
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-red-500/20">
                <p className="text-slate-500">DECRYPTED AT:</p>
                <p className="text-white">{result.session_details?.decryption_timestamp}</p>
              </div>
            </div>
          ) : (
            <div className="font-mono text-xs space-y-1">
              <p className="text-slate-400">{result.message}</p>
              <p className="text-slate-500">Correlation peak: <span className="text-white">{result.correlation_peak?.toFixed(4)}</span></p>
              <p className="text-slate-500">Candidates evaluated: <span className="text-white">{result.candidates_evaluated}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ForensicLab ───────────────────────────────────────────────────────
export default function ForensicLab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Forensic Lab: Leak Investigation</h2>
        <p className="text-sm text-slate-500 font-mono mt-0.5">
          DWT-DCT Hybrid Correlation · ML-DSA-65 Signature Verification · PBFT Ledger Proof
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttackSimulator />
        <AttributionEngine />
      </div>
    </div>
  );
}
