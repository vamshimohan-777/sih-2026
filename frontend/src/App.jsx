import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import WorkflowView from './components/WorkflowView';
import EncrypterStudio from './components/EncrypterStudio';
import DecrypterTerminal from './components/DecrypterTerminal';
import LedgerExplorer from './components/LedgerExplorer';
import ForensicLab from './components/ForensicLab';
import PqcBenchmark from './components/PqcBenchmark';

export default function App() {
  const [activeTab, setActiveTab] = useState('workflow');
  const [systemStatus, setSystemStatus] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [decryptedInstances, setDecryptedInstances] = useState([]);
  const [latestPackageId, setLatestPackageId] = useState('');

  const fetchInitialData = async () => {
    try {
      const [statusRes, docsRes, recsRes, decsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/documents'),
        fetch('/api/recipients'),
        fetch('/api/decrypted_instances')
      ]);

      const statusData = await statusRes.json();
      const docsData = await docsRes.json();
      const recsData = await recsRes.json();
      const decsData = await decsRes.json();

      setSystemStatus(statusData);
      setDocuments(docsData);
      setRecipients(recsData);
      setDecryptedInstances(decsData);
    } catch (err) {
      console.error("Failed to load initial system data:", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleDistributionComplete = (pkg) => {
    setLatestPackageId(pkg.package_id);
  };

  const handleDecryptionSuccess = (instanceData) => {
    setDecryptedInstances(prev => [instanceData, ...prev]);
  };

  const handleProceedToDecrypt = (pkgId) => {
    setLatestPackageId(pkgId);
    setActiveTab('decrypt');
  };

  const handleProceedToForensics = (instanceData) => {
    setActiveTab('forensics');
  };

  const handleResetDemo = async () => {
    if (confirm("Reset demo ledger and state to pristine initial condition?")) {
      try {
        await fetch('/api/ledger/restore', { method: 'POST' });
        await fetchInitialData();
        setLatestPackageId('');
        setActiveTab('workflow');
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-cyber-darkest text-slate-100 flex flex-col cyber-grid">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        onReset={handleResetDemo}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'workflow' && (
          <WorkflowView onSelectTab={setActiveTab} />
        )}

        {activeTab === 'encrypt' && (
          <EncrypterStudio
            documents={documents}
            recipients={recipients}
            onDistributionComplete={handleDistributionComplete}
            onProceedToDecrypt={handleProceedToDecrypt}
          />
        )}

        {activeTab === 'decrypt' && (
          <DecrypterTerminal
            recipients={recipients}
            latestPackageId={latestPackageId}
            onDecryptionSuccess={handleDecryptionSuccess}
            onProceedToForensics={handleProceedToForensics}
          />
        )}

        {activeTab === 'forensics' && (
          <ForensicLab
            decryptedInstances={decryptedInstances}
          />
        )}

        {activeTab === 'ledger' && (
          <LedgerExplorer />
        )}

        {activeTab === 'pqc' && (
          <PqcBenchmark />
        )}
      </main>

      {/* Military-Grade Cyber Footer */}
      <footer className="border-t border-cyber-border/40 bg-cyber-dark py-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            AEGIS-PQC // SIH26237 — Post-Quantum Forensic Watermarking & Leak Attribution System
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-emerald-400">● 100% AIR-GAPPED VERIFIED</span>
            <span className="text-cyan-400">● FIPS 203 & 204 COMPLIANT</span>
            <span className="text-purple-400">● 4-NODE PBFT DLT</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
