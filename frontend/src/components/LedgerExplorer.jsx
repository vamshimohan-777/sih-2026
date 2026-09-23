import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Flame, 
  Lock, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Server, 
  Key, 
  GitCommit,
  Layers
} from 'lucide-react';

export default function LedgerExplorer() {
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [tamperStatus, setTamperStatus] = useState(null);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ledger');
      const data = await res.json();
      setLedgerData(data);
      if (data.chain.length > 0 && expandedBlock === null) {
        setExpandedBlock(data.chain[data.chain.length - 1].block_height);
      }
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleTamper = async (blockHeight) => {
    try {
      const res = await fetch('/api/ledger/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          block_height: blockHeight,
          field: 'recipient_id',
          malicious_value: 'user_CORRUPTED_ADMIN'
        })
      });
      const data = await res.json();
      setTamperStatus(data);
      fetchLedger();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async () => {
    try {
      await fetch('/api/ledger/restore', { method: 'POST' });
      setTamperStatus(null);
      fetchLedger();
    } catch (err) {
      console.error(err);
    }
  };

  const isChainValid = ledgerData?.integrity?.valid;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border/60 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white flex items-center space-x-2">
            <Database className="w-6 h-6 text-purple-400" />
            <span>Permissioned DLT Ledger & Custodian Consensus</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Offline Byzantine Fault Tolerant (PBFT) audit network replicated across 4 independent custodian organizations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLedger}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Chain</span>
          </button>
        </div>
      </div>

      {/* Custodian Nodes Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ledgerData?.custodian_nodes?.map((node, i) => (
          <div 
            key={node.id} 
            className="rounded-xl bg-cyber-card border border-purple-900/30 p-4 space-y-2 hover:border-purple-500/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                VALIDATOR #{i + 1}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="text-sm font-bold text-white truncate">{node.name}</div>
            <div className="text-[11px] text-slate-400">{node.department}</div>
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
              Role: <span className="text-slate-300">{node.role}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chain Integrity Alert & Tamper Lab */}
      <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            {isChainValid ? (
              <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>LEDGER STATE: PRISTINE & CRYPTOGRAPHICALLY SECURE</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-400 font-mono font-bold text-sm animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span>TAMPER DETECTED: CRYPTOGRAPHIC MERKLE ROOT FAILURE!</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {isChainValid ? (
              <button
                onClick={() => handleTamper(ledgerData.chain.length > 1 ? 1 : 0)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-mono text-xs transition"
              >
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>Simulate Rogue Admin Tamper Attack</span>
              </button>
            ) : (
              <button
                onClick={handleRestore}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-mono text-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Restore Clean Ledger State</span>
              </button>
            )}
          </div>
        </div>

        {/* Tamper Warning Box */}
        {tamperStatus && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-xs font-mono space-y-2">
            <div className="text-red-300 font-bold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>CONSENSUS REJECTION: Unauthorized Admin Database Modification Caught</span>
            </div>
            <p className="text-slate-300">
              An unauthorized insider administrator tried to modify Block #{tamperStatus.tampered_block} to replace the true recipient with <code className="text-red-300 bg-red-950 px-1 py-0.5 rounded">"{tamperStatus.new_value}"</code>.
            </p>
            <div className="text-red-400 text-[11px]">
              &gt; {tamperStatus.chain_audit_after_tamper?.message}
            </div>
          </div>
        )}
      </div>

      {/* Visual Blockchain Blocks Timeline */}
      <div className="space-y-4">
        <h3 className="font-mono font-bold text-sm text-cyan-300 uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4" />
          <span>Immutable Blocks Chain ({ledgerData?.total_blocks || 0} Total Blocks)</span>
        </h3>

        <div className="space-y-3">
          {ledgerData?.chain?.map((block) => {
            const isExpanded = expandedBlock === block.block_height;
            const isGenesis = block.block_height === 0;

            return (
              <div
                key={block.block_height}
                className="rounded-xl bg-cyber-card border border-slate-800 overflow-hidden transition"
              >
                {/* Block Header */}
                <div
                  onClick={() => setExpandedBlock(isExpanded ? null : block.block_height)}
                  className="p-4 bg-slate-900/60 hover:bg-slate-900 cursor-pointer flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                      isGenesis 
                        ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      #{block.block_height}
                    </span>

                    <div>
                      <div className="flex items-center space-x-2 text-xs font-mono font-bold text-white">
                        <span>{isGenesis ? "GENESIS BLOCK" : `DECRYPTION AUDIT BLOCK #${block.block_height}`}</span>
                        <span className="text-[10px] text-slate-500 font-normal">{block.timestamp}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-md">
                        Hash: <span className="text-cyan-300">{block.block_hash.slice(0, 24)}...</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                      {block.consensus?.votes_count}/4 Custodian Votes
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Block Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800/80 bg-slate-950/80 space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                        <div className="text-slate-500 text-[10px]">PREVIOUS BLOCK POINTER</div>
                        <div className="text-slate-300 break-all">{block.prev_hash}</div>
                      </div>
                      <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                        <div className="text-slate-500 text-[10px]">MERKLE TREE ROOT</div>
                        <div className="text-purple-300 break-all">{block.merkle_root}</div>
                      </div>
                    </div>

                    {/* Transactions Inside Block */}
                    <div className="space-y-2">
                      <div className="text-slate-400 font-bold text-[11px]">TRANSACTIONS ({block.transactions.length})</div>
                      {block.transactions.map((tx, idx) => (
                        <div key={idx} className="p-3 rounded bg-slate-900/50 border border-slate-800 space-y-1.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-cyan-400 font-bold">{tx.doc_id || "SYSTEM_INIT"}</span>
                            <span className="text-[10px] text-slate-500">{tx.timestamp}</span>
                          </div>

                          {tx.watermark_id && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                              <div>
                                <span className="text-slate-500">Watermark ID:</span>{" "}
                                <strong className="text-white">{tx.watermark_id}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Recipient ID:</span>{" "}
                                <strong className="text-emerald-300">{tx.recipient_id}</strong>
                              </div>
                              <div>
                                <span className="text-slate-500">Session Nonce:</span>{" "}
                                <strong className="text-slate-300">{tx.session_nonce}</strong>
                              </div>
                            </div>
                          )}

                          {tx.signature && (
                            <div className="text-[10px] text-slate-500 pt-1">
                              <span>ML-DSA Signature: </span>
                              <span className="text-purple-300 truncate">{tx.signature.slice(0, 48)}...</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* PBFT Custodian Consensus Votes */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="text-slate-400 font-bold text-[11px]">CUSTODIAN SIGNATURE VOTES (PBFT QUORUM)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {block.consensus?.custodian_votes?.map((v, idx) => (
                          <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                            <span className="text-slate-300">{v.name}</span>
                            <span className="text-emerald-400 text-[10px] font-bold">✓ APPROVED</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
