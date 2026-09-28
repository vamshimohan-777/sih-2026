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

export default function Layout() {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
    { id: 'documents', label: 'Documents', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
    { id: 'distribute', label: 'Distribution', roles: ['ADMIN', 'SUPERADMIN'] },
    { id: 'decrypt', label: 'Decrypt & Verify', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
    { id: 'sessions', label: 'My Sessions', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
    { id: 'forensics', label: 'Forensic Lab', roles: ['ADMIN', 'SUPERADMIN'] },
    { id: 'ledger', label: 'Ledger Explorer', roles: ['ADMIN', 'SUPERADMIN'] },
    { id: 'benchmark', label: 'PQC Benchmark', roles: ['USER', 'ADMIN', 'SUPERADMIN'] },
    { id: 'admin', label: 'Admin Panel', roles: ['SUPERADMIN'] },
    { id: 'audit', label: 'Audit Log', roles: ['SUPERADMIN'] },
  ];

  const visibleNavItems = navItems.filter(item => item.roles.includes(user.role));

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard />;
      case 'documents': return <DocumentsPanel />;
      case 'distribute': return <DistributionWizard />;
      case 'decrypt': return <DecryptPanel />;
      case 'sessions': return <SessionsPanel />;
      case 'forensics': return <ForensicLab />;
      case 'ledger': return <LedgerExplorer />;
      case 'benchmark': return <PqcBenchmark />;
      case 'admin': return <AdminPanel />;
      case 'audit': return <AuditLog />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-[#0d1526] border-r border-[#1e3a5f] flex flex-col relative z-20">
        <div className="p-6 border-b border-[#1e3a5f]">
          <h1 className="text-2xl font-bold text-teal-400 tracking-wider">AEGIS<span className="text-white">TRACE</span></h1>
          <p className="text-xs font-mono text-slate-500 mt-1">SYS_VER 2.4.0</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {visibleNavItems.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-md transition-colors font-medium text-sm
                    ${currentTab === item.id 
                      ? 'bg-teal-600/20 text-teal-300 border-l-2 border-teal-500' 
                      : 'text-slate-400 hover:bg-[#1e3a5f]/50 hover:text-slate-200'}`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-[#0d1526] border-b border-[#1e3a5f] flex items-center justify-between px-8 z-10">
          <div className="flex items-center text-sm font-mono text-slate-400">
            <span>NODE: <span className="text-teal-400">PQC-PRIMARY-01</span></span>
            <span className="mx-4">|</span>
            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2 glow-teal"></span> ONLINE</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-white">{user.username}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                user.role === 'SUPERADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                user.role === 'ADMIN' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {user.role}
              </span>
            </div>
            <button 
              onClick={logout}
              className="text-slate-400 hover:text-white border border-[#1e3a5f] px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-red-500/20 hover:border-red-500/50"
            >
              LOGOUT
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto slide-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
