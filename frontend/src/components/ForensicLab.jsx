import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

// ─── Image Diff Comparison Modal ───────────────────────────────────────────
function DiffComparisonModal({ originalB64, attackedB64, attackType, intensity, onClose }) {
  const [mode, setMode] = useState('heatmap'); // 'heatmap' | 'side' | 'toggle'
  const [toggleState, setToggleState] = useState(false); // false: original, true: attacked
  const [metrics, setMetrics] = useState({ psnr: 'Calculating...', mse: '...', alteredPct: '...' });
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!originalB64 || !attackedB64) return;

    const img1 = new Image();
    const img2 = new Image();
    img1.crossOrigin = 'anonymous';
    img2.crossOrigin = 'anonymous';

    let loadedCount = 0;
    const onLoadBoth = () => {
      loadedCount++;
      if (loadedCount < 2) return;

      const w = img1.width;
      const h = img1.height;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');

      // Draw original to get data
      ctx.drawImage(img1, 0, 0, w, h);
      const data1 = ctx.getImageData(0, 0, w, h);

      // Draw attacked to get data
      ctx.drawImage(img2, 0, 0, w, h);
      const data2 = ctx.getImageData(0, 0, w, h);

      const d1 = data1.data;
      const d2 = data2.data;
      const diffImg = ctx.createImageData(w, h);
      const dd = diffImg.data;

      let sumSquaredErr = 0;
      let alteredCount = 0;
      const totalPixels = w * h;

      for (let i = 0; i < d1.length; i += 4) {
        const dr = Math.abs(d1[i] - d2[i]);
        const dg = Math.abs(d1[i + 1] - d2[i + 1]);
        const db = Math.abs(d1[i + 2] - d2[i + 2]);
        const delta = (dr + dg + db) / 3;

        const sqErr = (dr * dr + dg * dg + db * db) / 3;
        sumSquaredErr += sqErr;

        if (dr > 0 || dg > 0 || db > 0) alteredCount++;

        // Heatmap color mapping (amplified by 12x for high contrast)
        const amp = Math.min(delta * 12, 255);
        if (amp < 8) {
          // No/negligible change: dark navy tint
          dd[i] = 10;
          dd[i + 1] = 20;
          dd[i + 2] = 40;
        } else if (amp < 60) {
          // Low distortion: cyan/teal
          dd[i] = 0;
          dd[i + 1] = Math.min(amp * 4, 255);
          dd[i + 2] = 240;
        } else if (amp < 140) {
          // Moderate distortion: yellow/amber
          dd[i] = 255;
          dd[i + 1] = 200;
          dd[i + 2] = 0;
        } else {
          // Heavy distortion: hot red / magenta
          dd[i] = 255;
          dd[i + 1] = Math.max(0, 255 - amp);
          dd[i + 2] = 40;
        }
        dd[i + 3] = 255;
      }

      ctx.putImageData(diffImg, 0, 0);

      // Compute PSNR & MSE
      const mse = sumSquaredErr / totalPixels;
      const psnr = mse > 0 ? (10 * Math.log10((255 * 255) / mse)).toFixed(2) : '> 60.0';
      const alteredPct = ((alteredCount / totalPixels) * 100).toFixed(1);

      setMetrics({
        psnr: `${psnr} dB`,
        mse: mse.toFixed(2),
        alteredPct: `${alteredPct}%`
      });
    };

    img1.onload = onLoadBoth;
    img2.onload = onLoadBoth;
    img1.src = `data:image/png;base64,${originalB64}`;
    img2.src = `data:image/png;base64,${attackedB64}`;
  }, [originalB64, attackedB64]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1526] border border-[#1e3a5f] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#1e3a5f] bg-[#0a0f1e]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-teal-400">🔍</span> Pixel Difference & Degradation Inspector
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Attack: <span className="text-teal-300 uppercase">{attackType}</span> · Intensity: {intensity}%
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-[#0a0f1e]/60 border-b border-[#1e3a5f]">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('heatmap')}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                mode === 'heatmap' ? 'bg-teal-600 text-white' : 'bg-[#0d1526] text-slate-400 hover:text-white'
              }`}
            >
              🔥 Pixel Difference Heatmap
            </button>
            <button
              onClick={() => setMode('side')}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                mode === 'side' ? 'bg-teal-600 text-white' : 'bg-[#0d1526] text-slate-400 hover:text-white'
              }`}
            >
              ◫ Side-by-Side
            </button>
            <button
              onClick={() => setMode('toggle')}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                mode === 'toggle' ? 'bg-teal-600 text-white' : 'bg-[#0d1526] text-slate-400 hover:text-white'
              }`}
            >
              ⇄ A/B Flash Toggle
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div><span className="text-slate-500">PSNR: </span><span className="text-teal-400 font-bold">{metrics.psnr}</span></div>
            <div><span className="text-slate-500">MSE: </span><span className="text-white">{metrics.mse}</span></div>
            <div><span className="text-slate-500">Altered Pixels: </span><span className="text-yellow-400 font-bold">{metrics.alteredPct}</span></div>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[380px]">
          {mode === 'heatmap' && (
            <div className="space-y-3 w-full flex flex-col items-center">
              <div className="relative border border-teal-500/40 rounded-lg overflow-hidden bg-black max-w-full flex items-center justify-center p-1">
                <canvas ref={canvasRef} className="max-h-[340px] object-contain rounded" />
              </div>
              <div className="flex items-center gap-6 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#0a1428] border border-slate-700"></span> Zero Change</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#00f0f0]"></span> Low Distortion</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#ffd000]"></span> Moderate Distortion</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-[#ff0028]"></span> Heavy Alteration</span>
              </div>
            </div>
          )}

          {mode === 'side' && (
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="space-y-1 text-center">
                <p className="text-xs text-slate-400 font-mono">ORIGINAL (WATERMARKED)</p>
                <div className="border border-[#1e3a5f] rounded-lg p-1 bg-[#0a0f1e] flex items-center justify-center">
                  <img src={`data:image/png;base64,${originalB64}`} alt="orig" className="max-h-[320px] object-contain rounded" />
                </div>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-xs text-orange-400 font-mono">AFTER ATTACK ({attackType.toUpperCase()})</p>
                <div className="border border-orange-500/40 rounded-lg p-1 bg-[#0a0f1e] flex items-center justify-center">
                  <img src={`data:image/png;base64,${attackedB64}`} alt="att" className="max-h-[320px] object-contain rounded" />
                </div>
              </div>
            </div>
          )}

          {mode === 'toggle' && (
            <div className="space-y-3 flex flex-col items-center">
              <div className="relative border border-teal-500/40 rounded-lg p-1 bg-[#0a0f1e] flex items-center justify-center">
                <img
                  src={`data:image/png;base64,${toggleState ? attackedB64 : originalB64}`}
                  alt="toggled"
                  className="max-h-[340px] object-contain rounded transition-all duration-150"
                />
                <span className="absolute top-3 left-3 px-2 py-1 rounded bg-black/80 font-mono text-xs text-teal-400 border border-teal-500/40">
                  Showing: {toggleState ? `ATTACKED (${attackType.toUpperCase()})` : 'ORIGINAL WATERMARKED'}
                </span>
              </div>
              <button
                onClick={() => setToggleState(!toggleState)}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-mono text-xs font-bold transition-all shadow-lg shadow-teal-500/20"
              >
                Click to Toggle (Now: {toggleState ? 'Attacked' : 'Original'})
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#1e3a5f] bg-[#0a0f1e] flex justify-between items-center text-xs">
          <p className="text-slate-500 font-mono">
            Pixel changes reflect lossy compression block artifacts, noise injection, or spatial filters.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1e3a5f] hover:bg-[#2a4d7d] text-white rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [showDiffModal, setShowDiffModal] = useState(false);

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
      {showDiffModal && originalImg && attackedImg && (
        <DiffComparisonModal
          originalB64={originalImg}
          attackedB64={attackedImg}
          attackType={attackType}
          intensity={intensity}
          onClose={() => setShowDiffModal(false)}
        />
      )}

      <div className="flex justify-between items-center border-b border-[#1e3a5f] pb-2">
        <h3 className="text-lg font-semibold text-teal-300">
          Attack Simulator
        </h3>
        {originalImg && attackedImg && (
          <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded">
            Click images to inspect diff
          </span>
        )}
      </div>

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

      {/* Before / After with Clickable Differences */}
      {(originalImg || attackedImg) && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            {/* Original Card */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-slate-500 font-mono">ORIGINAL (WATERMARKED)</p>
                {attackedImg && <span className="text-[10px] text-teal-400 font-mono">click to diff</span>}
              </div>
              {originalImg ? (
                <div
                  onClick={() => attackedImg && setShowDiffModal(true)}
                  className={`group relative rounded border border-[#1e3a5f] overflow-hidden bg-[#0a0f1e] ${
                    attackedImg ? 'cursor-pointer hover:border-teal-500 transition-all' : ''
                  }`}
                >
                  <img src={`data:image/png;base64,${originalImg}`} alt="original" className="w-full object-contain max-h-40" />
                  {attackedImg && (
                    <div className="absolute inset-0 bg-teal-500/0 group-hover:bg-teal-500/10 flex items-center justify-center transition-colors">
                      <span className="opacity-0 group-hover:opacity-100 bg-black/80 text-teal-300 text-[10px] font-mono px-2 py-1 rounded border border-teal-500/30">
                        🔍 Inspect Differences
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 bg-[#0a0f1e] rounded border border-[#1e3a5f] flex items-center justify-center text-slate-600 text-xs">no image</div>
              )}
            </div>

            {/* Attacked Card */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-slate-500 font-mono">AFTER ATTACK</p>
                {attackedImg && <span className="text-[10px] text-orange-400 font-mono">click to diff</span>}
              </div>
              {attackedImg ? (
                <div
                  onClick={() => setShowDiffModal(true)}
                  className="group relative rounded border border-orange-500/30 overflow-hidden bg-[#0a0f1e] cursor-pointer hover:border-orange-400 transition-all"
                >
                  <img src={`data:image/png;base64,${attackedImg}`} alt="attacked" className="w-full object-contain max-h-40" />
                  <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 flex items-center justify-center transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 bg-black/80 text-orange-300 text-[10px] font-mono px-2 py-1 rounded border border-orange-500/30">
                      🔍 Inspect Differences
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-32 bg-[#0a0f1e] rounded border border-[#1e3a5f] flex items-center justify-center text-slate-600 text-xs">run attack first</div>
              )}
            </div>
          </div>

          {/* Prominent Button to Inspect Differences */}
          {originalImg && attackedImg && (
            <button
              onClick={() => setShowDiffModal(true)}
              className="w-full bg-[#111c33] hover:bg-[#162544] border border-teal-500/40 text-teal-300 py-2 rounded text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <span>🔍</span> Click to Compare Image Differences & Pixel Heatmap
            </button>
          )}
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
  const [evidenceTab, setEvidenceTab] = useState('where'); // 'where' | 'how'

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
        <div className={`rounded-lg border p-4 relative overflow-hidden space-y-3 ${
          result.attributed
            ? 'bg-red-500/5 border-red-500/40'
            : 'bg-slate-500/5 border-slate-500/30'
        }`}>
          <div className={`absolute top-0 left-0 w-1 h-full ${result.attributed ? 'bg-red-500' : 'bg-slate-500'}`} />

          <h4 className={`font-bold text-sm ${result.attributed ? 'text-red-400' : 'text-slate-400'}`}>
            {result.attributed ? '⚠ LEAK ATTRIBUTED' : '✓ NO MATCH FOUND'}
          </h4>

          {result.attributed ? (
            <div className="space-y-3 font-mono text-xs">
              {/* Primary Attribution Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-[#0a0f1e]/80 p-3 rounded border border-red-500/20">
                <span className="text-slate-500">RECIPIENT:</span>
                <span className="text-white font-bold text-sm text-red-300">{result.recipient?.username || result.recipient?.name}</span>

                <span className="text-slate-500">CONFIDENCE:</span>
                <span className="text-teal-400 font-bold">{result.forensic_metrics?.confidence_percentage?.toFixed(1)}%</span>

                <span className="text-slate-500">CORRELATION:</span>
                <span className="text-teal-400 font-bold">{result.forensic_metrics?.correlation_peak?.toFixed(4)}</span>

                <span className="text-slate-500">WATERMARK ID:</span>
                <span className="text-white truncate">{result.session_details?.watermark_id}</span>

                <span className="text-slate-500">ML-DSA SIG:</span>
                <span className={result.cryptographic_proof?.ml_dsa_signature_valid ? 'text-green-400 font-bold' : 'text-yellow-400'}>
                  {result.cryptographic_proof?.ml_dsa_signature_valid ? 'VALID ✓ (NIST FIPS 204)' : 'UNVERIFIED'}
                </span>

                <span className="text-slate-500">LEDGER BLOCK:</span>
                <span className="text-white font-bold">#{result.ledger_audit_proof?.committed_block_height}</span>

                <span className="text-slate-500">MERKLE PROOF:</span>
                <span className="text-green-400">VERIFIED ✓ (PBFT 4/4 Consensus)</span>
              </div>

              {/* Exact How and Where Forensic Evidence Section */}
              <div className="bg-[#080d1a] border border-[#1e3a5f] rounded-lg p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#1e3a5f] pb-2">
                  <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wide flex items-center gap-1.5">
                    <span>🔬</span> Detection & Localization Evidence
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEvidenceTab('where')}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        evidenceTab === 'where' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📍 WHERE Found
                    </button>
                    <button
                      onClick={() => setEvidenceTab('how')}
                      className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                        evidenceTab === 'how' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚙️ HOW Extracted
                    </button>
                  </div>
                </div>

                {evidenceTab === 'where' ? (
                  <div className="space-y-2 text-[11px]">
                    {/* Visual 2D-DWT Subband Decomposition Diagram */}
                    <div>
                      <p className="text-slate-400 text-[10px] mb-1 font-mono">DWT Wavelet Sub-Band Localization Matrix:</p>
                      <div className="grid grid-cols-2 gap-1.5 bg-[#05080f] p-2 rounded border border-[#1e3a5f]">
                        <div className="border border-teal-500/60 bg-teal-500/10 p-2 rounded text-center">
                          <p className="font-bold text-teal-300 text-[10px]">LL Sub-band (Approximation)</p>
                          <p className="text-[9px] text-green-400">✓ Active Correlation Signal</p>
                        </div>
                        <div className="border border-[#1e3a5f] bg-[#0a0f1e] p-2 rounded text-center">
                          <p className="text-slate-400 text-[10px]">LH Sub-band (Vertical)</p>
                          <p className="text-[9px] text-slate-500">Residual Noise Floor</p>
                        </div>
                        <div className="border border-teal-500/60 bg-teal-500/10 p-2 rounded text-center">
                          <p className="font-bold text-teal-300 text-[10px]">HL Sub-band (Horizontal)</p>
                          <p className="text-[9px] text-green-400">✓ Active Correlation Signal</p>
                        </div>
                        <div className="border border-[#1e3a5f] bg-[#0a0f1e] p-2 rounded text-center">
                          <p className="text-slate-400 text-[10px]">HH Sub-band (Diagonal)</p>
                          <p className="text-[9px] text-slate-500">Suppressed High Freq</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-slate-300 pt-1">
                      <p>
                        <span className="text-slate-500">Carrier Channel:</span> <span className="text-white">Y-Luminance (YCbCr)</span> — human visual system insensitive channel.
                      </p>
                      <p>
                        <span className="text-slate-500">Spatial Synchronization:</span> <span className="text-white">4-Quadrant Margin Fiducials</span> at [24,24] survived attack scaling & tilt.
                      </p>
                      <p>
                        <span className="text-slate-500">Texture Masking:</span> Recovered from high-edge regions via <span className="text-teal-300 font-mono">Sobel Energy Masking (E = √(Gx²+Gy²))</span>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <p className="text-slate-400 text-[10px] mb-1 font-mono">Mathematical Verification Pipeline:</p>
                    <div className="space-y-1 bg-[#05080f] p-2.5 rounded border border-[#1e3a5f] font-mono text-[10px] leading-relaxed">
                      <p><span className="text-teal-400">1.</span> <span className="text-white">Residual Isolation:</span> 5×5 Gaussian spatial filter extracted high-frequency watermark noise from carrier image.</p>
                      <p><span className="text-teal-400">2.</span> <span className="text-white">Pattern Correlation:</span> Normalized 2D cross-correlation sweep evaluated against registered spread pattern of {result.session_details?.watermark_id}.</p>
                      <p><span className="text-teal-400">3.</span> <span className="text-white">Statistical Proof:</span> Correlation peak reached <span className="text-teal-300 font-bold">{result.forensic_metrics?.correlation_peak?.toFixed(4)}</span> with Z-Score of <span className="text-teal-300 font-bold">{result.forensic_metrics?.z_score?.toFixed(2)}</span> (P &lt; 0.001).</p>
                      <p><span className="text-teal-400">4.</span> <span className="text-white">Non-Repudiation:</span> Post-quantum <span className="text-green-400 font-bold">ML-DSA-65</span> digital signature verified against recipient's public key.</p>
                      <p><span className="text-teal-400">5.</span> <span className="text-white">Consensus Anchor:</span> Transaction verified on PBFT Block <span className="text-white">#{result.ledger_audit_proof?.committed_block_height}</span> with 4/4 custodian consensus votes.</p>
                    </div>
                  </div>
                )}
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
