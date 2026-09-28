import React, { useState, useEffect } from 'react';

export default function DistributionWizard() {
  const [step, setStep] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const docs = [{ id: 'DOC-9921', title: 'Operation Nightfall Map' }, { id: 'DOC-9923', title: 'Project Aegis Specs' }];
  const recipients = [
    { id: 'USR-001', name: 'Alice (Field Agent)' },
    { id: 'USR-002', name: 'Bob (Commander)' },
    { id: 'USR-003', name: 'Charlie (Analyst)' }
  ];

  const handleDistribute = async () => {
    setStep(4);
    setIsProcessing(true);
    const script = [
      "Initializing PQC Enclave...",
      "Generating ML-KEM-768 ephemeral keypair...",
      "Embedding robust forensic watermark (alpha=0.2)...",
      "Signing package with ML-DSA-65...",
      "Encrypting payload via AES-256-GCM...",
      "Committing transaction to Ledger...",
      "Distribution package sealed successfully."
    ];
    
    for (let i = 0; i < script.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setLogs(prev => [...prev, script[i]]);
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Secure Distribution Wizard</h2>
      
      <div className="flex space-x-2 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-2 flex-1 rounded ${step >= s ? 'bg-teal-500 glow-teal' : 'bg-[#1e3a5f]'}`}></div>
        ))}
      </div>

      <div className="aegis-panel p-6 min-h-[400px]">
        {step === 1 && (
          <div className="slide-in space-y-4">
            <h3 className="text-lg font-semibold text-teal-300">Step 1: Select Payload</h3>
            <div className="space-y-2">
              {docs.map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => setSelectedDoc(doc.id)}
                  className={`p-4 border rounded cursor-pointer transition-colors ${selectedDoc === doc.id ? 'bg-teal-900/30 border-teal-500' : 'bg-[#0a0f1e] border-[#1e3a5f] hover:border-slate-500'}`}
                >
                  <span className="font-mono text-teal-400 mr-4">{doc.id}</span>
                  <span className="text-white">{doc.title}</span>
                </div>
              ))}
            </div>
            <button disabled={!selectedDoc} onClick={() => setStep(2)} className="mt-4 bg-teal-600 px-6 py-2 rounded text-white disabled:opacity-50">Next</button>
          </div>
        )}

        {step === 2 && (
          <div className="slide-in space-y-4">
            <h3 className="text-lg font-semibold text-teal-300">Step 2: Target Recipients</h3>
            <div className="space-y-2">
              {recipients.map(rec => (
                <label key={rec.id} className="flex items-center space-x-3 p-3 bg-[#0a0f1e] border border-[#1e3a5f] rounded cursor-pointer hover:bg-[#1e3a5f]/30">
                  <input 
                    type="checkbox" 
                    className="form-checkbox text-teal-500 bg-transparent border-slate-500 rounded"
                    checked={selectedRecipients.includes(rec.id)}
                    onChange={(e) => {
                      if(e.target.checked) setSelectedRecipients([...selectedRecipients, rec.id]);
                      else setSelectedRecipients(selectedRecipients.filter(id => id !== rec.id));
                    }}
                  />
                  <span className="font-mono text-slate-400">{rec.id}</span>
                  <span className="text-white">{rec.name}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-4 mt-4">
              <button onClick={() => setStep(1)} className="bg-[#1e3a5f] px-6 py-2 rounded text-white">Back</button>
              <button disabled={selectedRecipients.length === 0} onClick={() => setStep(3)} className="bg-teal-600 px-6 py-2 rounded text-white disabled:opacity-50">Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="slide-in space-y-4">
            <h3 className="text-lg font-semibold text-teal-300">Step 3: Review & Execute</h3>
            <div className="bg-[#0a0f1e] p-4 rounded border border-[#1e3a5f] font-mono text-sm space-y-2">
              <p><span className="text-slate-500">PAYLOAD:</span> <span className="text-teal-400">{selectedDoc}</span></p>
              <p><span className="text-slate-500">RECIPIENTS:</span> {selectedRecipients.join(', ')}</p>
              <p><span className="text-slate-500">WATERMARK TYPE:</span> SPREAD-SPECTRUM BLIND</p>
              <p><span className="text-slate-500">ENCRYPTION:</span> ML-KEM-768 + AES-256-GCM</p>
            </div>
            <div className="flex space-x-4 mt-4">
              <button onClick={() => setStep(2)} className="bg-[#1e3a5f] px-6 py-2 rounded text-white">Back</button>
              <button onClick={handleDistribute} className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded text-white font-bold">EXECUTE PROTOCOL</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="slide-in space-y-4">
            <h3 className="text-lg font-semibold text-teal-300">Step 4: Cryptographic Execution</h3>
            <div className="bg-black p-4 rounded border border-[#1e3a5f] h-64 overflow-y-auto font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="text-teal-400 mb-1 slide-in">&gt; {log}</div>
              ))}
              {isProcessing && <div className="text-slate-500 animate-pulse mt-2">_</div>}
              {!isProcessing && <div className="text-green-400 mt-4 font-bold">SUCCESS: Package IDs PKG-881 to PKG-88X generated.</div>}
            </div>
            {!isProcessing && (
              <button onClick={() => {setStep(1); setLogs([]); setSelectedDoc(null); setSelectedRecipients([]);}} className="mt-4 bg-[#1e3a5f] px-6 py-2 rounded text-white">Start New Distribution</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
