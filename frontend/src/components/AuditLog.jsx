import React from 'react';

export default function AuditLog() {
  const logs = [
    { id: 'AUD-881', time: '2026-09-28 14:05:11', action: 'FORENSIC_EXTRACT', user: 'sys_root', resource: 'DOC-9921', detail: 'Attribution match: USR-002' },
    { id: 'AUD-880', time: '2026-09-28 14:02:45', action: 'DECRYPT_SUCCESS', user: 'bob_cmd', resource: 'PKG-881-A9F2', detail: 'PSNR: 42.8dB' },
    { id: 'AUD-879', time: '2026-09-28 13:58:20', action: 'DISTRIBUTE_PKG', user: 'sys_root', resource: 'DOC-9921', detail: 'Recipients: 3' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Security Audit Log</h2>
      
      <div className="aegis-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0a0f1e] font-mono text-slate-400 border-b border-[#1e3a5f]">
            <tr>
              <th className="p-4">TIMESTAMP</th>
              <th className="p-4">ACTION</th>
              <th className="p-4">USER</th>
              <th className="p-4">RESOURCE</th>
              <th className="p-4">DETAILS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3a5f] font-mono text-xs">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-[#1e3a5f]/20 transition-colors">
                <td className="p-4 text-slate-400">{log.time}</td>
                <td className="p-4 text-teal-400">{log.action}</td>
                <td className="p-4 text-slate-300">{log.user}</td>
                <td className="p-4 text-slate-400">{log.resource}</td>
                <td className="p-4 text-slate-500">{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
