import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

// ─── Expandable Row Detail ──────────────────────────────────────────────────
function SessionDetail({ session, onClose }) {
  return (
    <tr className="bg-[#0a0f1e]">
      <td colSpan={7} className="px-6 py-4 border-b border-[#1e3a5f]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Watermark Info */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-mono uppercase mb-1">Watermark</p>
            <p className="text-xs font-mono text-teal-300 break-all">{session.watermark_id || '—'}</p>
            <p className="text-xs text-slate-500">Nonce: <span className="text-slate-300 font-mono">{session.session_nonce || '—'}</span></p>
          </div>
          {/* Ledger Info */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-mono uppercase mb-1">Ledger</p>
            <p className="text-xs text-slate-300">Block: <span className="text-teal-400 font-mono">{session.block_height ?? '—'}</span></p>
            <p className="text-xs text-slate-500 font-mono break-all">{session.block_hash ? session.block_hash.slice(0, 32) + '...' : '—'}</p>
          </div>
          {/* Metrics */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-mono uppercase mb-1">Quality Metrics</p>
            <p className="text-xs text-slate-300">PSNR: <span className="text-green-400">{session.psnr_db ? session.psnr_db + ' dB' : '—'}</span></p>
            <p className="text-xs text-slate-300">SSIM: <span className="text-green-400">{session.ssim ?? '—'}</span></p>
          </div>
        </div>
        {/* Watermarked image thumbnail */}
        {session.watermarked_image_b64 && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-mono mb-2">WATERMARKED DOCUMENT</p>
            <img
              src={`data:image/png;base64,${session.watermarked_image_b64}`}
              alt="watermarked"
              className="h-40 rounded border border-[#1e3a5f] object-contain"
            />
            <a
              href={`data:image/png;base64,${session.watermarked_image_b64}`}
              download={`watermarked_${session.id}.png`}
              className="inline-block mt-2 text-xs text-teal-400 hover:text-teal-300 underline"
            >
              Download watermarked image
            </a>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Main SessionsPanel ─────────────────────────────────────────────────────
export default function SessionsPanel() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [packages, setPackages] = useState([]);  // distribution packages with recipients
  const [users, setUsers] = useState({});          // id → username map
  const [docs, setDocs] = useState({});            // id → title map
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState('decryptions'); // 'decryptions' | 'distributions'

  useEffect(() => {
    const isAdminOrSuper = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    Promise.all([
      api.getDecryptedInstances(),
      api.getDocuments(),
      isAdminOrSuper ? api.getPackagesWithRecipients() : Promise.resolve([]),
      isAdminOrSuper ? api.getRecipients() : Promise.resolve([]),
    ])
      .then(([sessions, docList, pkgs, userList]) => {
        setSessions(sessions || []);
        setPackages(pkgs || []);

        const docMap = {};
        (docList || []).forEach(d => { docMap[d.id] = d.title; });
        setDocs(docMap);

        const userMap = {};
        (userList || []).forEach(u => { userMap[u.id] = u.username; });
        setUsers(userMap);

        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load sessions');
        setLoading(false);
      });
  }, []);

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED' || status === 'SUCCESS')
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (status === 'FAILED')
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  };

  const fmtDate = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString();
  };

  if (loading) {
    return <div className="text-teal-400 font-mono animate-pulse p-8">Loading session data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Session Registry</h2>
          <p className="text-sm text-slate-500 font-mono mt-0.5">
            {sessions.length} decryption sessions · {packages.length} distribution packages
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded">{error}</div>
      )}

      {/* Tab Switcher */}
      {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
        <div className="flex gap-2 border-b border-[#1e3a5f] pb-0">
          {[
            { id: 'decryptions', label: 'Decryption Sessions' },
            { id: 'distributions', label: 'Distribution Log — Who Received What' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── DECRYPTION SESSIONS TABLE ─────────────────────────────────────── */}
      {activeTab === 'decryptions' && (
        <div className="aegis-panel overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0a0f1e] font-mono text-slate-400 border-b border-[#1e3a5f] text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Session ID</th>
                <th className="p-4">Document</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Watermark ID</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">PSNR</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3a5f]">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                    No decryption sessions yet. Distribute a document and have users decrypt it.
                  </td>
                </tr>
              ) : (
                sessions.map(s => (
                  <React.Fragment key={s.id}>
                    <tr
                      className="hover:bg-[#1e3a5f]/20 cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                    >
                      <td className="p-4 font-mono text-teal-400 text-xs">{s.id}</td>
                      <td className="p-4 text-white text-xs font-mono">
                        {docs[s.package_id] || s.package_id?.slice(0, 12) + '...'}
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {users[s.recipient_id] || s.recipient_id}
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">
                        {s.watermark_id ? s.watermark_id.slice(0, 20) + '...' : '—'}
                      </td>
                      <td className="p-4 font-mono text-slate-400 text-xs">{fmtDate(s.timestamp)}</td>
                      <td className="p-4 text-slate-300 text-sm">
                        {s.psnr_db ? `${s.psnr_db} dB` : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] px-2 py-1 border rounded font-mono ${getStatusBadge(s.status)}`}>
                          {s.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                    {expanded === s.id && (
                      <SessionDetail session={s} onClose={() => setExpanded(null)} />
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DISTRIBUTION LOG — WHO RECEIVED WHAT ─────────────────────────── */}
      {activeTab === 'distributions' && (user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
        <div className="aegis-panel overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0a0f1e] font-mono text-slate-400 border-b border-[#1e3a5f] text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4">Package ID</th>
                <th className="p-4">Document</th>
                <th className="p-4">Sent To (Recipients)</th>
                <th className="p-4">Distributed At</th>
                <th className="p-4">Distributed By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3a5f]">
              {packages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                    No distribution packages yet.
                  </td>
                </tr>
              ) : (
                packages.map(pkg => (
                  <tr key={pkg.id} className="hover:bg-[#1e3a5f]/20 transition-colors">
                    <td className="p-4 font-mono text-teal-400 text-xs">{pkg.id}</td>
                    <td className="p-4 text-white text-xs font-mono">
                      {docs[pkg.doc_id] || pkg.doc_id || '—'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(pkg.envelopes || []).length === 0 ? (
                          <span className="text-slate-500 text-xs">—</span>
                        ) : (
                          pkg.envelopes.map(env => (
                            <span key={env.id} className="text-xs px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded font-mono">
                              {users[env.recipient_id] || env.recipient_id}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-xs">{fmtDate(pkg.created_at)}</td>
                    <td className="p-4 text-slate-300 text-sm">
                      {users[pkg.created_by] || pkg.created_by || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
