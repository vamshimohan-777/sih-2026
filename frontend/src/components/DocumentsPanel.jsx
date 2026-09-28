import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../App';

export default function DocumentsPanel() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // api.getDocuments().then(data => { setDocuments(data); setLoading(false); });
    setTimeout(() => {
      setDocuments([
        { id: 'DOC-9921', title: 'Operation Nightfall Map', classification: 'TOP SECRET', desc: 'Satellite imagery of Sector 7G.', date: '2026-09-28' },
        { id: 'DOC-9922', title: 'Q3 Financial Audit', classification: 'CONFIDENTIAL', desc: 'Internal financial metrics and projections.', date: '2026-09-27' },
        { id: 'DOC-9923', title: 'Project Aegis Specs', classification: 'SECRET', desc: 'Technical specifications for PQC implementation.', date: '2026-09-25' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getClassColor = (classification) => {
    switch (classification) {
      case 'TOP SECRET': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'SECRET': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'CONFIDENTIAL': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Document Repository</h2>
        {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
          <button className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
            + UPLOAD NEW
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-teal-400 font-mono animate-pulse">Scanning repository...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {documents.map(doc => (
            <div key={doc.id} className="aegis-panel p-5 hover:border-teal-500/50 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="font-mono text-teal-300 text-sm">{doc.id}</span>
                <span className={`text-[10px] px-2 py-1 rounded border font-bold ${getClassColor(doc.classification)}`}>
                  {doc.classification}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{doc.title}</h3>
              <p className="text-slate-400 text-sm flex-1">{doc.desc}</p>
              
              <div className="mt-6 flex justify-between items-center border-t border-[#1e3a5f] pt-4">
                <span className="text-xs text-slate-500 font-mono">{doc.date}</span>
                {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (
                  <button className="text-xs bg-[#1e3a5f] hover:bg-teal-600 text-white px-3 py-1.5 rounded transition-colors">
                    DISTRIBUTE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
