import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Unlock, 
  FileSearch, 
  Database, 
  Layers, 
  Radio, 
  RotateCcw,
  Zap
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemStatus, onReset }) {
  const tabs = [
    { id: 'workflow', label: 'Architecture & Workflow', icon: Layers, badge: 'Overview' },
    { id: 'encrypt', label: 'Live Encrypter', icon: Lock, badge: 'ML-KEM-768' },
    { id: 'decrypt', label: 'Live Decrypter & Mark', icon: Unlock, badge: 'ML-DSA-65' },
    { id: 'forensics', label: 'Forensic Lab & Leak Scanner', icon: FileSearch, badge: 'Attribution' },
    { id: 'ledger', label: 'DLT Ledger & Consensus', icon: Database, badge: 'PBFT Audit' },
    { id: 'pqc', label: 'NIST PQC Benchmarks', icon: Zap, badge: 'FIPS 203/204' },
  ];

  return (
    <header className="border-b border-cyber-border bg-cyber-dark/95 backdrop-blur-md sticky top-0 z-50">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-cyber-border/40 gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 text-black animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-lg text-white tracking-wider">
                AEGIS<span className="text-cyan-400">-PQC</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                SIH26237
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Post-Quantum Forensic Watermarking & Tamper-Evident Leak Attribution System
            </p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Air-Gapped: <strong className="text-emerald-200">OFFLINE</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>PQC: <strong className="text-cyan-200">FIPS 203 / 204</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300">
            <Database className="w-3.5 h-3.5 text-purple-400" />
            <span>DLT: <strong className="text-purple-200">4/4 PBFT Nodes</strong></span>
          </div>

          <button
            onClick={onReset}
            title="Reset simulation ledger to pristine state"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs border border-slate-700"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
        <nav className="flex space-x-1 py-1.5 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  isActive ? 'bg-cyan-500/20 text-cyan-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
