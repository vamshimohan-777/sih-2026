import React, { useState } from 'react';
import { useAuth } from '../App';
import Dashboard from './Dashboard';
import DocumentsPanel from './DocumentsPanel';
import DistributionWizard from './DistributionWizard';
import DecryptPanel from './DecryptPanel';
import SessionsPanel from './SessionsPanel';
import ForensicLab from './ForensicLab';
import LedgerExplorer from './LedgerExplorer';
import AdminPanel from './AdminPanel';
import AuditLog from './AuditLog';
import PqcBenchmark from './PqcBenchmark';

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',      icon: '⬡', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
  { id: 'documents',  label: 'Documents',       icon: '📄', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
  { id: 'decrypt',    label: 'Decrypt & Verify',icon: '🔓', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
  { id: 'sessions',   label: 'Sessions',        icon: '📋', roles: ['SUPERADMIN'] },
  { id: 'forensics',  label: 'Forensic Lab',    icon: '🔬', roles: ['ADMIN', 'SUPERADMIN'] },
  { id: 'ledger',     label: 'Ledger Explorer', icon: '⛓', roles: ['ADMIN', 'SUPERADMIN'] },
  { id: 'benchmark',  label: 'PQC Benchmark',   icon: '📊', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
  { id: 'admin',      label: 'Admin Panel',     icon: '⚙', roles: ['SUPERADMIN'] },
  { id: 'audit',      label: 'Audit Log',       icon: '🛡', roles: ['SUPERADMIN'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [navState, setNavState] = useState({});   // extra state passed between pages

  const visible = NAV.filter(n => n.roles.includes(user.role));

  // Called by child components to navigate to another tab (optionally with state)
  const onNavigate = (tab, state = {}) => {
    setNavState(state);
    setCurrentTab(tab);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':  return <Dashboard onNavigate={onNavigate} />;
      case 'documents':  return <DocumentsPanel onNavigate={onNavigate} />;
      case 'decrypt':    return <DecryptPanel onNavigate={onNavigate} initialDocId={navState.doc_id} />;
      case 'sessions':   return <SessionsPanel onNavigate={onNavigate} />;
      case 'forensics':  return <ForensicLab onNavigate={onNavigate} />;
      case 'ledger':     return <LedgerExplorer onNavigate={onNavigate} />;
      case 'benchmark':  return <PqcBenchmark />;
      case 'admin':      return <AdminPanel />;
      case 'audit':      return <AuditLog />;
      default:           return <Dashboard onNavigate={onNavigate} />;
    }
  };

  const roleColor = {
    SUPERADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
    ADMIN:      'bg-orange-500/20 text-orange-400 border-orange-500/30',
    USER:       'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }[user.role] || 'bg-blue-500/20 text-blue-400 border-blue-500/30';

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 flex">
      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="w-60 bg-[#0d1526] border-r border-[#1e3a5f] flex flex-col flex-shrink-0 relative z-20">
        {/* Logo */}
        <div className="p-6 border-b border-[#1e3a5f]">
          <h1 className="text-2xl font-bold text-teal-400 tracking-wider">
            AEGIS<span className="text-white">TRACE</span>
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">SIH26237 · v2.0.0</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-0.5 px-3">
            {visible.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => { setNavState({}); setCurrentTab(item.id); }}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors text-sm flex items-center gap-2.5 ${
                    currentTab === item.id
                      ? 'bg-teal-600/20 text-teal-300 border-l-2 border-teal-500 pl-[10px]'
                      : 'text-slate-400 hover:bg-[#1e3a5f]/50 hover:text-slate-200'
                  }`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User info at bottom */}
        <div className="p-4 border-t border-[#1e3a5f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-600/30 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-bold">
              {user.username?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.username}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${roleColor}`}>
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-[#0d1526] border-b border-[#1e3a5f] flex items-center justify-between px-8 z-10 flex-shrink-0">
          <div className="flex items-center text-xs font-mono text-slate-400 gap-4">
            <span>NODE: <span className="text-teal-400">PQC-PRIMARY-01</span></span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              ONLINE · AIR-GAPPED
            </span>
          </div>

          <button
            onClick={logout}
            className="text-slate-400 hover:text-white border border-[#1e3a5f] px-3 py-1.5 rounded-md text-xs transition-colors hover:bg-red-500/20 hover:border-red-500/50 font-mono"
          >
            LOGOUT
          </button>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
