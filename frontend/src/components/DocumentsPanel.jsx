import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

// ─── Upload Modal ──────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [classification, setClassification] = useState('CONFIDENTIAL');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!file) { setError('Please select an image file'); return; }
    setLoading(true);
    setError('');
    try {
      // Convert file to base64
      const b64 = preview.split(',')[1];
      await api.createDocument({ title, classification, description, image_b64: b64 });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1526] border border-[#1e3a5f] rounded-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Upload New Document</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>}

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Document Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Operation Alpha Specs"
              className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Classification *</label>
            <select
              value={classification}
              onChange={e => setClassification(e.target.value)}
              className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
            >
              <option value="TOP SECRET">TOP SECRET</option>
              <option value="SECRET">SECRET</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of document contents"
              className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Document Image *</label>
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-[#1e3a5f] rounded-lg p-4 text-center cursor-pointer hover:border-teal-500 transition-colors"
            >
              {preview ? (
                <img src={preview} alt="preview" className="h-32 mx-auto object-contain rounded" />
              ) : (
                <p className="text-slate-500 text-sm">Click to select image (PNG/JPG)</p>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-[#1e3a5f] text-slate-400 hover:text-white py-2 rounded text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload & Encrypt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Distribute Modal ──────────────────────────────────────────────────────
function DistributeModal({ doc, onClose, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getRecipients()
      .then(data => {
        setUsers(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleDistribute = async () => {
    if (selected.length === 0) { setError('Select at least one recipient'); return; }
    setDistributing(true);
    setError('');
    try {
      const res = await api.distribute({ doc_id: doc.id, recipient_ids: selected });
      setResult(res);
      onSuccess && onSuccess(res);
    } catch (err) {
      setError(err.message || 'Distribution failed');
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d1526] border border-[#1e3a5f] rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white">Distribute Document</h3>
            <p className="text-xs text-teal-400 font-mono mt-0.5">{doc.id} — {doc.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>}

        {result ? (
          <div className="space-y-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded p-4">
              <p className="text-green-400 font-bold mb-1">DISTRIBUTION COMPLETE</p>
              <p className="font-mono text-xs text-slate-300">Package: {result.package_id}</p>
              <p className="font-mono text-xs text-slate-300">Recipients: {result.recipient_count}</p>
              <p className="font-mono text-xs text-slate-300">Encryption: ML-KEM-768 + AES-256-GCM</p>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {(result.crypto_steps || []).map((step, i) => (
                <div key={i} className="text-xs font-mono text-teal-300 bg-[#0a0f1e] rounded px-2 py-1">
                  <span className="text-slate-500">Step {step.step}:</span> {step.title}
                </div>
              ))}
            </div>
            <button onClick={onClose} className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded text-sm font-semibold">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400">Select recipients. Each will receive their own ML-KEM-768 encrypted envelope.</p>
            {loading ? (
              <p className="text-teal-400 font-mono animate-pulse text-sm">Loading users...</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {users.length === 0 && <p className="text-slate-500 text-sm">No USER-role recipients found.</p>}
                {users.map(u => (
                  <label key={u.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.includes(u.id) ? 'border-teal-500 bg-teal-500/10' : 'border-[#1e3a5f] hover:border-teal-500/50'}`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(u.id)}
                      onChange={() => toggle(u.id)}
                      className="accent-teal-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{u.username}</p>
                      <p className="text-xs text-slate-500 font-mono">{u.id.slice(0, 16)}... · {u.has_pqc_keys ? '🔑 PQC Keys Ready' : '⚠ No PQC Keys'}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 border border-[#1e3a5f] text-slate-400 hover:text-white py-2 rounded text-sm transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDistribute}
                disabled={distributing || selected.length === 0}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-2 rounded text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {distributing ? 'Encrypting & Distributing...' : `Distribute to ${selected.length} Recipient${selected.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main DocumentsPanel ───────────────────────────────────────────────────
export default function DocumentsPanel({ onNavigate }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [distributeDoc, setDistributeDoc] = useState(null);

  const loadDocs = () => {
    setLoading(true);
    api.getDocuments()
      .then(data => { setDocuments(data); setLoading(false); })
      .catch(err => { setError(err.message || 'Failed to load'); setLoading(false); });
  };

  useEffect(() => { loadDocs(); }, []);

  const getClassColor = (c) => {
    if (c?.includes('TOP')) return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (c?.includes('SECRET') || c === 'SECRET') return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
    if (c?.includes('CONF')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
  };

  const isAdminOrSuper = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  return (
    <div className="space-y-6">
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={loadDocs}
        />
      )}
      {distributeDoc && (
        <DistributeModal
          doc={distributeDoc}
          onClose={() => setDistributeDoc(null)}
          onSuccess={() => {}}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Document Repository</h2>
          <p className="text-sm text-slate-500 font-mono mt-0.5">{documents.length} classified assets</p>
        </div>
        {isAdminOrSuper && (
          <button
            onClick={() => setShowUpload(true)}
            className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> UPLOAD NEW
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>
      )}

      {loading ? (
        <div className="text-teal-400 font-mono animate-pulse">Scanning repository...</div>
      ) : documents.length === 0 ? (
        <div className="aegis-panel p-12 text-center text-slate-500">
          <p className="text-4xl mb-3">📁</p>
          <p className="font-mono">No documents in repository.</p>
          {isAdminOrSuper && (
            <button onClick={() => setShowUpload(true)} className="mt-4 text-teal-400 hover:text-teal-300 text-sm underline">
              Upload the first document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {documents.map(doc => (
            <div key={doc.id} className="aegis-panel p-5 hover:border-teal-500/50 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-teal-300 text-sm">{doc.id}</span>
                <span className={`text-[10px] px-2 py-1 rounded border font-bold ${getClassColor(doc.classification)}`}>
                  {doc.classification}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{doc.title}</h3>
              <p className="text-slate-400 text-sm flex-1">{doc.description}</p>

              <div className="mt-6 border-t border-[#1e3a5f] pt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-mono">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                  </span>
                  <div className="flex gap-2">
                    {/* DECRYPT button — all roles */}
                    <button
                      onClick={() => onNavigate && onNavigate('decrypt', { doc_id: doc.id })}
                      className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded transition-colors"
                    >
                      DECRYPT
                    </button>
                    {/* DISTRIBUTE button — ADMIN/SUPERADMIN only */}
                    {isAdminOrSuper && (
                      <button
                        onClick={() => setDistributeDoc(doc)}
                        className="text-xs bg-[#1e3a5f] hover:bg-teal-600 text-white px-3 py-1.5 rounded transition-colors"
                      >
                        DISTRIBUTE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
