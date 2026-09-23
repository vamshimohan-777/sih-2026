import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Users, 
  Cpu, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  Terminal, 
  Key, 
  Upload, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function EncrypterStudio({ 
  documents, 
  recipients, 
  onDistributionComplete,
  onProceedToDecrypt
}) {
  const [selectedDocId, setSelectedDocId] = useState(documents[0]?.id || '');
  const [selectedRecipients, setSelectedRecipients] = useState(['user_042', 'user_088']);
  const [customImage, setCustomImage] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptStep, setEncryptStep] = useState(0);
  const [cryptoLogs, setCryptoLogs] = useState([]);
  const [resultPackage, setResultPackage] = useState(null);

  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents]);

  const activeDoc = documents.find(d => d.id === selectedDocId);

  const toggleRecipient = (id) => {
    setSelectedRecipients(prev => 
      prev.includes(id) 
        ? prev.filter(r => r !== id)
        : [...prev, id]
    );
  };

  const handleCustomUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImage(reader.result.split(',')[1]);
        setCustomTitle(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const runLiveEncryption = async () => {
    if (selectedRecipients.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    setIsEncrypting(true);
    setEncryptStep(1);
    setResultPackage(null);
    setCryptoLogs([
      "Initializing air-gapped cryptographic pipeline...",
      "Generating 256-bit AES master content key via CSPRNG...",
    ]);

    try {
      // Step simulation for visual impact
      await new Promise(r => setTimeout(r, 600));
      setEncryptStep(2);
      setCryptoLogs(prev => [
        ...prev,
        "Encrypting document bytes via AES-256-GCM (NIST SP 800-38D)...",
        "Generating 96-bit cryptographic nonce and 128-bit authentication tag..."
      ]);

      await new Promise(r => setTimeout(r, 700));
      setEncryptStep(3);
      setCryptoLogs(prev => [
        ...prev,
        `Wrapping master key for ${selectedRecipients.length} recipients using NIST FIPS 203 ML-KEM-768...`,
        "Performing lattice-based Module-LWE public key encapsulation..."
      ]);

      const res = await fetch('/api/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doc_id: selectedDocId,
          recipient_ids: selectedRecipients,
          custom_image_b64: customImage,
          custom_title: customTitle
        })
      });

      const data = await res.json();
      await new Promise(r => setTimeout(r, 500));

      setEncryptStep(4);
      setCryptoLogs(prev => [
        ...prev,
        `✓ ML-KEM-768 ciphertexts generated (${data.recipient_count} envelopes).`,
        `✓ AES-256-GCM authenticated bundle packaged as ${data.package_id}.`,
        "✓ Package successfully sealed and ready for air-gapped dispatch!"
      ]);

      setResultPackage(data);
      if (onDistributionComplete) {
        onDistributionComplete(data);
      }
    } catch (err) {
      console.error(err);
      setCryptoLogs(prev => [...prev, `[ERROR]: Encryption failed: ${err.message}`]);
    } finally {
      setIsEncrypting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border/60 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-mono font-bold text-white flex items-center space-x-2">
            <Lock className="w-6 h-6 text-cyan-400" />
            <span>Sender Studio: Live Encrypter & Distribution</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Encrypt once with AES-256-GCM; wrap content keys with NIST FIPS 203 ML-KEM-768 for designated recipients.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>FIPS 203 ML-KEM-768 / X25519 Hybrid</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Asset Selection & Recipients (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Document Picker */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <h3 className="font-mono font-bold text-sm text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>1. Select Confidential Asset</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Air-Gapped Source</span>
            </h3>

            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => { setSelectedDocId(doc.id); setCustomImage(null); }}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedDocId === doc.id && !customImage
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 font-semibold">{doc.id}</span>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-[10px]">
                      {doc.classification}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-white mt-1">{doc.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{doc.category} // {doc.date}</div>
                </div>
              ))}

              {/* Custom Upload Option */}
              <label className="block p-3 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-900/40 cursor-pointer transition text-center">
                <Upload className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-300 font-mono">
                  {customTitle ? `Loaded: ${customTitle}` : "Or Upload Custom Confidential Image/Document"}
                </span>
                <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Recipient Selector */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <h3 className="font-mono font-bold text-sm text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>2. Authorized Recipients</span>
              </span>
              <span className="text-[11px] text-cyan-300 font-mono">
                {selectedRecipients.length} Selected
              </span>
            </h3>

            <div className="space-y-2.5">
              {recipients.map((rec) => {
                const isSelected = selectedRecipients.includes(rec.id);
                return (
                  <div
                    key={rec.id}
                    onClick={() => toggleRecipient(rec.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/20 border-emerald-500/60 shadow-sm'
                        : 'bg-slate-900/50 border-slate-800/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img 
                          src={rec.avatar} 
                          alt={rec.name} 
                          className="w-9 h-9 rounded-full object-cover border border-slate-700" 
                        />
                        {isSelected && (
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <span>{rec.name}</span>
                          <span className="text-[10px] font-mono text-cyan-300">({rec.id})</span>
                        </div>
                        <div className="text-[11px] text-slate-400">{rec.role}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          Clearance: <span className="text-slate-300">{rec.clearance}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        ML-KEM-768
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={runLiveEncryption}
              disabled={isEncrypting || selectedRecipients.length === 0}
              className={`w-full py-3 rounded-xl font-mono font-bold text-sm tracking-wider flex items-center justify-center space-x-2 transition shadow-lg ${
                isEncrypting
                  ? 'bg-cyan-900 text-cyan-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black shadow-cyan-500/25'
              }`}
            >
              {isEncrypting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>EXECUTING QUANTUM ENCRYPTION...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>RUN QUANTUM ENCRYPTION & DISTRIBUTION</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Action Display & Crypto Inspection (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Document Preview & Encryption Hologram */}
          <div className="rounded-xl bg-cyber-card border border-cyber-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono font-bold text-sm text-cyan-300 uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Asset Hologram & Encryption Envelope</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {activeDoc?.dimensions ? `${activeDoc.dimensions.width}x${activeDoc.dimensions.height}` : "640x640 High-Res"}
              </span>
            </div>

            {/* Document Graphic with Scanner Overlay */}
            <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[260px]">
              {(customImage || activeDoc?.image_b64) && (
                <img
                  src={`data:image/png;base64,${customImage || activeDoc?.image_b64}`}
                  alt="Confidential Document"
                  className={`max-h-[300px] w-auto object-contain transition-all duration-700 ${
                    isEncrypting ? 'opacity-40 blur-[1px]' : 'opacity-95'
                  }`}
                />
              )}

              {/* Live Encrypting Animation Layer */}
              {isEncrypting && (
                <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin flex items-center justify-center">
                    <Lock className="w-6 h-6 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="text-cyan-300 font-mono font-bold text-sm animate-pulse">
                    APPLYING AES-256-GCM + ML-KEM-768 KEY WRAP
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 max-w-sm">
                    Lattice polynomials: deg 256, mod q=3329. Wrapping symmetric content key...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Cryptographic Execution Logs */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Terminal className="w-4 h-4" />
                <span>Cryptographic Execution Diagnostics</span>
              </span>
              <span>AES-256-GCM // FIPS 203 ML-KEM</span>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1 text-[11px]">
              {cryptoLogs.length === 0 ? (
                <div className="text-slate-500 italic">
                  &gt; Ready. Click "Run Quantum Encryption" to initiate distribution pipeline...
                </div>
              ) : (
                cryptoLogs.map((log, i) => (
                  <div key={i} className="text-slate-300 flex items-start space-x-2">
                    <span className="text-cyan-400 select-none">&gt;</span>
                    <span className={log.includes("✓") ? "text-emerald-400 font-semibold" : ""}>{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Result Sealed Package Card */}
          {resultPackage && (
            <div className="rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/50 p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span>DISTRIBUTION PACKAGE SEALED: {resultPackage.package_id}</span>
                </div>
                <span className="text-xs font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {resultPackage.distribution_summary.processing_time_ms} ms
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">PAYLOAD SIZE</div>
                  <div className="text-white font-bold">{resultPackage.distribution_summary.payload_size_bytes} B</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">CIPHERTEXT</div>
                  <div className="text-cyan-300 font-bold">{resultPackage.distribution_summary.ciphertext_size_bytes} B</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">RECIPIENT KEYS</div>
                  <div className="text-emerald-300 font-bold">{resultPackage.recipient_count} Envelopes</div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">GCM TAG</div>
                  <div className="text-purple-300 font-bold truncate">{resultPackage.tag_hex.slice(0, 8)}...</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => onProceedToDecrypt(resultPackage.package_id)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition"
                >
                  <span>PROCEED TO RECIPIENT DECRYPTION TERMINAL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
