import React from 'react';

export default function SessionsPanel() {
  const sessions = [
    { id: 'SES-091', doc: 'DOC-9921', recipient: 'USR-002', time: '2026-09-28 14:02', psnr: '42.8 dB', status: 'VERIFIED' },
    { id: 'SES-090', doc: 'DOC-9923', recipient: 'USR-001', time: '2026-09-27 09:15', psnr: '41.2 dB', status: 'VERIFIED' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Decryption Sessions</h2>
      
      <div className="aegis-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0a0f1e] font-mono text-slate-400 border-b border-[#1e3a5f]">
            <tr>
              <th className="p-4">SESSION ID</th>
              <th className="p-4">DOCUMENT</th>
              <th className="p-4">RECIPIENT</th>
              <th className="p-4">TIMESTAMP</th>
              <th className="p-4">PSNR</th>
              <th className="p-4">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3a5f]">
            {sessions.map(s => (
              <tr key={s.id} className="hover:bg-[#1e3a5f]/20 cursor-pointer transition-colors">
                <td className="p-4 font-mono text-teal-400">{s.id}</td>
                <td className="p-4 text-white">{s.doc}</td>
                <td className="p-4 text-slate-300">{s.recipient}</td>
                <td className="p-4 font-mono text-slate-400 text-xs">{s.time}</td>
                <td className="p-4 text-slate-300">{s.psnr}</td>
                <td className="p-4"><span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded font-mono">{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
