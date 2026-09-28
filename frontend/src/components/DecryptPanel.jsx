import React, { useState } from 'react';

export default function DecryptPanel() {
  const [status, setStatus] = useState('IDLE'); // IDLE, PROCESSING, SUCCESS
  const [packageId, setPackageId] = useState('PKG-881-A9F2');

  const handleDecrypt = () => {
    setStatus('PROCESSING');
    setTimeout(() => {
      setStatus('SUCCESS');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">Decryption & Verification Portal</h2>

      {status === 'IDLE' && (
        <div className="max-w-md aegis-panel p-6 slide-in">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">PACKAGE ID</label>
              <input type="text" value={packageId} onChange={(e)=>setPackageId(e.target.value)} className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded p-2 text-slate-100 font-mono focus:border-teal-500" />
            </div>
            <button onClick={handleDecrypt} className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded font-bold tracking-wide">
              INITIATE DECRYPTION
            </button>
          </div>
        </div>
      )}

      {status === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center h-64 space-y-4 text-teal-400 font-mono">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse">Performing ML-KEM Decapsulation...</p>
        </div>
      )}

      {status === 'SUCCESS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 slide-in">
          <div className="aegis-panel p-4 flex flex-col items-center">
            <h3 className="text-sm font-mono text-slate-400 mb-2">WATERMARKED PAYLOAD</h3>
            <div className="w-full h-64 bg-[#0a0f1e] border border-[#1e3a5f] rounded flex items-center justify-center relative overflow-hidden group">
              {/* Simulated Image */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-80 mix-blend-luminosity"></div>
              <div className="absolute inset-0 bg-teal-900/20 group-hover:bg-transparent transition-all"></div>
            </div>
            <button className="mt-4 bg-[#1e3a5f] hover:bg-[#1e40af] text-white px-4 py-2 rounded text-sm w-full">
              DOWNLOAD SECURE ASSET
            </button>
          </div>

          <div className="space-y-6">
            <div className="aegis-panel p-4">
              <h3 className="text-sm font-mono text-slate-400 mb-4 border-b border-[#1e3a5f] pb-2">QUALITY METRICS</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0a0f1e] p-3 rounded border border-[#1e3a5f]">
                  <p className="text-xs text-slate-500 font-mono">PSNR</p>
                  <p className="text-2xl font-bold text-green-400">42.8 dB</p>
                </div>
                <div className="bg-[#0a0f1e] p-3 rounded border border-[#1e3a5f]">
                  <p className="text-xs text-slate-500 font-mono">SSIM</p>
                  <p className="text-2xl font-bold text-green-400">0.998</p>
                </div>
              </div>
            </div>

            <div className="aegis-panel p-4">
              <h3 className="text-sm font-mono text-slate-400 mb-4 border-b border-[#1e3a5f] pb-2">LEDGER VERIFICATION</h3>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between"><span className="text-slate-500">STATUS</span><span className="text-green-400">✓ INTEGRITY VERIFIED</span></div>
                <div className="flex justify-between"><span className="text-slate-500">BLOCK HEIGHT</span><span className="text-white">#1042</span></div>
                <div className="flex justify-between"><span className="text-slate-500">TX HASH</span><span className="text-teal-300">0x8f7a...c2b9</span></div>
              </div>
            </div>
            
            <button onClick={() => setStatus('IDLE')} className="text-slate-400 hover:text-white text-sm underline">Close Session</button>
          </div>
        </div>
      )}
    </div>
  );
}
