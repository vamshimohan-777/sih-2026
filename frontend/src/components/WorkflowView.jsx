import React from 'react';
import { 
  FileText, 
  Lock, 
  EyeOff, 
  PenTool, 
  Database, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Users,
  ChevronRight
} from 'lucide-react';

export default function WorkflowView({ onSelectTab }) {
  const steps = [
    {
      num: 1,
      title: "Prepare & Distribute",
      subtitle: "Sender Environment",
      icon: Lock,
      color: "from-blue-600 to-cyan-600",
      border: "border-blue-500/40",
      desc: "Encrypt the document once with symmetric AES-256-GCM, then wrap the key for each recipient using NIST ML-KEM-768.",
      actionTab: "encrypt",
      actionText: "Launch Encrypter Studio"
    },
    {
      num: 2,
      title: "Recipient Decrypts",
      subtitle: "Air-Gapped Client",
      icon: Cpu,
      color: "from-emerald-600 to-teal-600",
      border: "border-emerald-500/40",
      desc: "Recipient uses their private key held in local hardware/token to decapsulate the content key via ML-KEM-768.",
      actionTab: "decrypt",
      actionText: "Open Decryption Terminal"
    },
    {
      num: 3,
      title: "Embed Watermark",
      subtitle: "Decryption-Time Injection",
      icon: EyeOff,
      color: "from-amber-600 to-yellow-600",
      border: "border-amber-500/40",
      desc: "Client embeds a unique, per-session watermark (recipient ID + nonce + timestamp) using DWT-DCT spread spectrum.",
      actionTab: "decrypt",
      actionText: "Inspect Watermark Metrics"
    },
    {
      num: 4,
      title: "Sign Decryption Record",
      subtitle: "Non-Repudiation",
      icon: PenTool,
      color: "from-rose-600 to-pink-600",
      border: "border-rose-500/40",
      desc: "Recipient device signs a decryption audit record with their post-quantum private key (ML-DSA-65) so they cannot deny opening it.",
      actionTab: "decrypt",
      actionText: "View Digital Signatures"
    },
    {
      num: 5,
      title: "Commit to Ledger",
      subtitle: "Permissioned DLT Network",
      icon: Database,
      color: "from-purple-600 to-indigo-600",
      border: "border-purple-500/40",
      desc: "Signed record is committed to a permissioned blockchain replicated across 4 independent custodian nodes (IT, Compliance, Auditor, Legal).",
      actionTab: "ledger",
      actionText: "Explore DLT Ledger"
    },
    {
      num: 6,
      title: "Investigate a Leak",
      subtitle: "Forensic Attribution Lab",
      icon: Search,
      color: "from-cyan-600 to-blue-600",
      border: "border-cyan-500/40",
      desc: "Extract watermark from degraded leaked file (even phone screen photos), match against ledger, verify PQC signature chain, and issue report.",
      actionTab: "forensics",
      actionText: "Run Forensic Scanner"
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-cyber-border p-6 sm:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-mono">
            <span>DEFENSE-GRADE CYBER FORENSICS // AIR-GAPPED DEPLOYMENT</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Post-Quantum Forensic Watermarking & Leak Attribution
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Eliminates the <em>broadcast-encrypt, individually-decrypt</em> insider leak vulnerability. 
            By stamping unique, invisible forensic watermarks at the precise moment of decryption, 
            backed by NIST FIPS 204 post-quantum signatures and a 4-node permissioned ledger, 
            every leaked file is definitively attributable to its source.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onSelectTab('encrypt')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-sm shadow-lg shadow-cyan-500/25 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Step 1: Start Encrypter Studio</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab('forensics')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Step 6: Live Leak Scanner Demo</span>
            </button>
          </div>
        </div>
      </div>

      {/* The Problem vs Our Solution Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Problem */}
        <div className="rounded-xl bg-cyber-card border border-red-900/30 p-5 space-y-4">
          <div className="flex items-center space-x-3 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-mono font-bold text-base uppercase">The Problem: Group Decryption Dilemma</h3>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm">
            When sensitive documents are shared with a group under broadcast encryption, all decrypted copies are byte-identical. 
            If a document leaks, all recipients are equally plausible suspects.
          </p>
          <ul className="space-y-2 text-xs font-mono text-slate-400">
            <li className="flex items-start space-x-2">
              <span className="text-red-400 font-bold">✕</span>
              <span>All decrypted copies are byte-identical across the organization</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-red-400 font-bold">✕</span>
              <span>Server-side access logs can be altered by rogue privileged administrators</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-red-400 font-bold">✕</span>
              <span>Static watermarks applied prior to distribution reproduce the same attribution flaw</span>
            </li>
          </ul>
        </div>

        {/* The Solution */}
        <div className="rounded-xl bg-cyber-card border border-cyan-900/40 p-5 space-y-4">
          <div className="flex items-center space-x-3 text-cyan-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-mono font-bold text-base uppercase">Our Solution: Post-Quantum Forensic Attribution</h3>
          </div>
          <p className="text-slate-300 text-xs sm:text-sm">
            Invisible watermarks embedded dynamically at decryption time, bound to recipient identity with post-quantum signatures and committed to an immutable 4-node ledger.
          </p>
          <ul className="space-y-2 text-xs font-mono text-slate-300">
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>Unique, invisible watermark embedded at decryption time (PSNR &gt; 45 dB)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>NIST FIPS 204 ML-DSA-65 post-quantum signature for strict non-repudiation</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>Permissioned 4-node DLT (PBFT consensus) prevents single-admin log tampering</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span>Recapture-resistant forensic extraction even from smartphone screen photos</span>
            </li>
          </ul>
        </div>
      </div>

      {/* End-to-End Workflow Flowchart (Matching workflow.png) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-mono font-bold text-white tracking-wide uppercase flex items-center space-x-2">
            <span className="text-cyan-400">01-06</span>
            <span>End-to-End Pipeline Workflow</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Click any stage to test live action</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div 
                key={st.num}
                className={`rounded-xl bg-cyber-card border ${st.border} p-5 space-y-3 flex flex-col justify-between hover:border-cyan-400/80 transition group relative overflow-hidden`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-slate-800 text-cyan-300 font-mono text-xs flex items-center justify-center font-bold border border-slate-700">
                      {st.num}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      {st.subtitle}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${st.color} text-white shadow-md`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                      {st.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <button
                  onClick={() => onSelectTab(st.actionTab)}
                  className="w-full mt-2 flex items-center justify-between px-3 py-2 rounded bg-slate-800/80 hover:bg-cyan-500 hover:text-black text-slate-300 text-xs font-mono transition border border-slate-700/60 group-hover:border-cyan-500/50"
                >
                  <span>{st.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Air-Gapped Topology Architecture Diagram */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-6 space-y-4">
        <h3 className="font-mono font-bold text-sm text-cyan-300 uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Air-Gapped Deployment Topology (Zero Cloud / Zero Public Chain)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-mono font-bold text-xs uppercase">1. Sender Station</div>
            <p className="text-[11px] text-slate-400">
              AES-256-GCM encryption + ML-KEM-768 recipient key encapsulation. Local hardware tokens.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-emerald-400 font-mono font-bold text-xs uppercase">2. Recipient Endpoint</div>
            <p className="text-[11px] text-slate-400">
              Local ML-KEM decapsulation, DWT-DCT watermark injection, and ML-DSA-65 hardware signing.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-purple-400 font-mono font-bold text-xs uppercase">3. Custodian DLT Ledger</div>
            <p className="text-[11px] text-slate-400">
              4 independent nodes (IT, Compliance, Auditor, Legal) enforcing PBFT majority consensus.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-rose-400 font-mono font-bold text-xs uppercase">4. Forensic Workstation</div>
            <p className="text-[11px] text-slate-400">
              Multi-domain extraction, ledger correlation, PQC signature audit, and tamper-proof reporting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
