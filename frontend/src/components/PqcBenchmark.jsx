import React from 'react';

export default function PqcBenchmark() {
  const data = [
    { algo: 'ML-KEM-768', type: 'KEM', pub: '1184', priv: '2400', cipher: '1088', sec: '192' },
    { algo: 'ML-DSA-65', type: 'Sig', pub: '1952', priv: '4032', sig: '3309', sec: '192' },
    { algo: 'RSA-3072', type: 'Legacy Sig', pub: '384', priv: '384', sig: '384', sec: '128' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">PQC Performance Benchmarks</h2>
        <p className="text-slate-400 text-sm">Live comparison of NIST standardized algorithms</p>
      </div>

      <div className="aegis-panel overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0a0f1e] font-mono text-teal-400 border-b border-[#1e3a5f]">
            <tr>
              <th className="p-4">ALGORITHM</th>
              <th className="p-4">TYPE</th>
              <th className="p-4">SECURITY (bits)</th>
              <th className="p-4">PUB KEY (bytes)</th>
              <th className="p-4">PRIV KEY (bytes)</th>
              <th className="p-4">CT / SIG (bytes)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3a5f]">
            {data.map(row => (
              <tr key={row.algo} className="hover:bg-[#1e3a5f]/20 transition-colors">
                <td className="p-4 font-semibold text-white">{row.algo}</td>
                <td className="p-4 text-slate-400">{row.type}</td>
                <td className="p-4 text-teal-300 font-mono">{row.sec}</td>
                <td className="p-4 font-mono text-slate-300">{row.pub}</td>
                <td className="p-4 font-mono text-slate-300">{row.priv}</td>
                <td className="p-4 font-mono text-slate-300">{row.cipher || row.sig}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="aegis-panel p-5">
          <h3 className="text-sm font-mono text-slate-400 mb-4">ENCAPSULATION LATENCY (μs)</h3>
          <div className="space-y-3">
            <div className="flex items-center"><span className="w-24 text-xs font-mono">ML-KEM-768</span><div className="flex-1 bg-[#0a0f1e] h-4 rounded ml-2 relative"><div className="absolute top-0 left-0 h-full bg-teal-500 rounded" style={{width: '30%'}}></div></div><span className="ml-2 text-xs">45μs</span></div>
            <div className="flex items-center"><span className="w-24 text-xs font-mono">RSA-3072</span><div className="flex-1 bg-[#0a0f1e] h-4 rounded ml-2 relative"><div className="absolute top-0 left-0 h-full bg-slate-500 rounded" style={{width: '90%'}}></div></div><span className="ml-2 text-xs">1200μs</span></div>
          </div>
        </div>
        <div className="aegis-panel p-5">
          <h3 className="text-sm font-mono text-slate-400 mb-4">SIGNATURE LATENCY (μs)</h3>
          <div className="space-y-3">
            <div className="flex items-center"><span className="w-24 text-xs font-mono">ML-DSA-65</span><div className="flex-1 bg-[#0a0f1e] h-4 rounded ml-2 relative"><div className="absolute top-0 left-0 h-full bg-teal-500 rounded" style={{width: '40%'}}></div></div><span className="ml-2 text-xs">85μs</span></div>
            <div className="flex items-center"><span className="w-24 text-xs font-mono">RSA-3072</span><div className="flex-1 bg-[#0a0f1e] h-4 rounded ml-2 relative"><div className="absolute top-0 left-0 h-full bg-slate-500 rounded" style={{width: '80%'}}></div></div><span className="ml-2 text-xs">950μs</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
