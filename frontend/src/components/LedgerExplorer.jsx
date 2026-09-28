import React, { useState } from 'react';

export default function LedgerExplorer() {
  const [tampered, setTampered] = useState(false);

  const blocks = [
    { height: 1042, hash: '0x8f7a33...c2b9', time: 'Just now', txs: 1 },
    { height: 1041, hash: '0x2a1b9c...f8e1', time: '2 hrs ago', txs: 3 },
    { height: 1040, hash: '0x99cc4d...1a22', time: '5 hrs ago', txs: 2 },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Immutable Ledger</h2>
          <p className="text-slate-400 text-sm">Post-Quantum Verifiable Data Structure</p>
        </div>
        <div className={`px-4 py-1.5 rounded-full font-mono text-sm font-bold flex items-center ${tampered ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-green-500/20 text-green-400 border border-green-500/50'}`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${tampered ? 'bg-red-500' : 'bg-green-500'}`}></span>
          {tampered ? 'CHAIN COMPROMISED' : 'CHAIN INTACT'}
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#1e3a5f] z-0"></div>
        
        <div className="space-y-8 relative z-10">
          {blocks.map((block, i) => (
            <div key={block.height} className="flex items-start">
              <div className={`w-16 h-16 rounded flex items-center justify-center font-mono font-bold border-2 mr-6 shrink-0 bg-[#0a0f1e] transition-colors
                ${tampered && i === 0 ? 'border-red-500 text-red-500' : 'border-teal-500 text-teal-400'}`}>
                #{block.height}
              </div>
              <div className={`flex-1 aegis-panel p-4 ${tampered && i === 0 ? 'border-red-500/50' : ''}`}>
                <div className="flex justify-between mb-2">
                  <span className="font-mono text-sm text-white">Hash: <span className={tampered && i===0 ? 'text-red-400':'text-teal-300'}>{block.hash}</span></span>
                  <span className="text-xs text-slate-500">{block.time}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 font-mono text-xs text-slate-400">
                  <div>
                    <p className="mb-1">PREV_HASH</p>
                    <p className="truncate bg-[#0a0f1e] p-1 rounded">{i === blocks.length-1 ? '0x000000...0000' : blocks[i+1].hash}</p>
                  </div>
                  <div>
                    <p className="mb-1">MERKLE_ROOT</p>
                    <p className="truncate bg-[#0a0f1e] p-1 rounded">0x{Math.random().toString(16).slice(2)}...</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
          onClick={() => setTampered(!tampered)} 
          className="text-xs font-mono px-3 py-1 border border-slate-600 rounded text-slate-400 hover:bg-slate-800 transition-colors"
        >
          {tampered ? 'RESTORE CHAIN' : 'DEMO: TAMPER BLOCK'}
        </button>
      </div>
    </div>
  );
}
