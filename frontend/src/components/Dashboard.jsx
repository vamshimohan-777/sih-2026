import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({ docs: 0, encrypted: 0, sessions: 0, blocks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real scenario, this fetches from /api/status
    // api.getStatus().then(data => setStats(data));
    setTimeout(() => {
      setStats({ docs: 124, encrypted: 892, sessions: 45, blocks: 1042 });
      setLoading(false);
    }, 600);
  }, []);

  const pqcSuites = [
    { name: 'ML-KEM-768', type: 'Key Encapsulation', status: 'ACTIVE', standard: 'NIST FIPS 203' },
    { name: 'ML-DSA-65', type: 'Digital Signature', status: 'ACTIVE', standard: 'NIST FIPS 204' },
    { name: 'AES-256-GCM', type: 'Symmetric Encryption', status: 'ACTIVE', standard: 'NIST SP 800-38D' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">Mission Control</h2>
          <p className="text-slate-400 text-sm">System Overview & Cryptographic Status</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'TOTAL DOCUMENTS', value: stats.docs, color: 'text-blue-400' },
          { label: 'ENCRYPTED PACKAGES', value: stats.encrypted, color: 'text-teal-400' },
          { label: 'DECRYPTION SESSIONS', value: stats.sessions, color: 'text-purple-400' },
          { label: 'LEDGER BLOCKS', value: stats.blocks, color: 'text-orange-400' },
        ].map((stat, i) => (
          <div key={i} className="aegis-panel p-5 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors"></div>
            <p className="text-slate-400 text-xs font-mono mb-2">{stat.label}</p>
            {loading ? (
              <div className="h-10 bg-[#1e3a5f] animate-pulse rounded w-1/2"></div>
            ) : (
              <p className={`text-4xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PQC Suite Status */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-teal-300 border-b border-[#1e3a5f] pb-2">Active PQC Suites</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pqcSuites.map(suite => (
              <div key={suite.name} className="bg-[#0d1526] border border-[#1e3a5f] rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-mono text-white text-sm">{suite.name}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded">{suite.status}</span>
                </div>
                <p className="text-xs text-slate-400 mb-1">{suite.type}</p>
                <p className="text-[10px] text-slate-500 font-mono">{suite.standard}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Custodian Nodes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-teal-300 border-b border-[#1e3a5f] pb-2">Custodian Nodes</h3>
          <div className="bg-[#0d1526] border border-[#1e3a5f] rounded-lg p-4 space-y-3">
            {[1, 2, 3, 4].map(node => (
              <div key={node} className="flex justify-between items-center p-2 bg-[#0a0f1e] rounded border border-[#1e3a5f]">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 glow-teal"></div>
                  <span className="font-mono text-sm text-slate-300">NODE-0{node}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">{Math.floor(Math.random() * 20 + 10)}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
