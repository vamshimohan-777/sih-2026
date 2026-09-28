import React, { useState } from 'react';

export default function ForensicLab() {
  const [intensity, setIntensity] = useState(50);
  const [verdict, setVerdict] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const runExtraction = () => {
    setIsScanning(true);
    setVerdict(null);
    setTimeout(() => {
      setIsScanning(false);
      setVerdict({ match: true, user: 'USR-002 (Bob)', confidence: '99.8%' });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Forensic Lab: Leak Investigation</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator */}
        <div className="aegis-panel p-5">
          <h3 className="text-lg font-semibold text-teal-300 mb-4 border-b border-[#1e3a5f] pb-2">Attack Simulator</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Select Attack Vector</label>
              <div className="flex space-x-2">
                {['JPEG Compress', 'Crop', 'Noise', 'Blur'].map(atk => (
                  <button key={atk} className="px-3 py-1.5 bg-[#0a0f1e] border border-[#1e3a5f] rounded text-xs text-slate-300 hover:border-teal-500 transition-colors">
                    {atk}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Intensity: {intensity}%</label>
              <input type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(e.target.value)} className="w-full accent-teal-500" />
            </div>
            <div className="h-48 bg-black rounded border border-[#1e3a5f] flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-50 mix-blend-luminosity filter blur-sm"></div>
               <span className="relative z-10 text-white font-mono bg-black/50 px-2 rounded">Simulated Output</span>
            </div>
          </div>
        </div>

        {/* Investigator */}
        <div className="aegis-panel p-5">
          <h3 className="text-lg font-semibold text-teal-300 mb-4 border-b border-[#1e3a5f] pb-2">Attribution Engine</h3>
          
          <div className="border-2 border-dashed border-[#1e3a5f] rounded-lg h-32 flex items-center justify-center text-slate-500 cursor-pointer hover:border-teal-500 hover:text-teal-400 transition-colors mb-4 bg-[#0a0f1e]">
            Drag & Drop Suspected Leak Image Here
          </div>
          
          <button onClick={runExtraction} disabled={isScanning} className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded font-bold mb-6 disabled:opacity-50">
            {isScanning ? 'EXTRACTING WATERMARK PAYLOAD...' : 'RUN FORENSIC EXTRACTION'}
          </button>

          {isScanning && (
            <div className="h-2 w-full bg-[#0a0f1e] rounded overflow-hidden">
              <div className="h-full bg-teal-500 animate-[slide-in_1s_ease-in-out_infinite_alternate] w-1/3"></div>
            </div>
          )}

          {verdict && (
            <div className="slide-in bg-[#0a0f1e] border border-red-500/50 rounded p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500 glow-red"></div>
              <h4 className="text-red-400 font-bold mb-2">LEAK ATTRIBUTED</h4>
              <div className="space-y-1 font-mono text-sm">
                <p><span className="text-slate-500">SOURCE NODE:</span> <span className="text-white">{verdict.user}</span></p>
                <p><span className="text-slate-500">CONFIDENCE:</span> <span className="text-teal-400">{verdict.confidence}</span></p>
                <p><span className="text-slate-500">SIGNATURE:</span> <span className="text-green-400">VALID (ML-DSA-65)</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
