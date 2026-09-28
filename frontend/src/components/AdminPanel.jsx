import React from 'react';

export default function AdminPanel() {
  const users = [
    { id: 'USR-001', username: 'alice_field', role: 'USER', status: 'ACTIVE' },
    { id: 'USR-002', username: 'bob_cmd', role: 'ADMIN', status: 'ACTIVE' },
    { id: 'USR-000', username: 'sys_root', role: 'SUPERADMIN', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">System Administration</h2>
        <button className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm font-medium">
          + ADD OPERATOR
        </button>
      </div>

      <div className="aegis-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0a0f1e] font-mono text-slate-400 border-b border-[#1e3a5f]">
            <tr>
              <th className="p-4">OPERATOR ID</th>
              <th className="p-4">USERNAME</th>
              <th className="p-4">CLEARANCE ROLE</th>
              <th className="p-4">STATUS</th>
              <th className="p-4 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3a5f]">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-[#1e3a5f]/20 transition-colors">
                <td className="p-4 font-mono text-teal-400">{u.id}</td>
                <td className="p-4 text-white">{u.username}</td>
                <td className="p-4">
                  <span className={`text-[10px] px-2 py-1 rounded border font-mono
                    ${u.role === 'SUPERADMIN' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      u.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4"><span className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded font-mono">{u.status}</span></td>
                <td className="p-4 text-right">
                  <button className="text-slate-400 hover:text-white text-xs underline">EDIT</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
