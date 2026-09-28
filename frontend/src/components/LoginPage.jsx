import React, { useState } from 'react';
import { useAuth } from '../App';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await login(username, password);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Access denied.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex text-slate-100 font-sans">
      <div className="hidden lg:flex w-1/2 bg-[#0d1526] flex-col justify-center items-center relative overflow-hidden border-r border-[#1e3a5f]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500 via-[#0a0f1e] to-[#0a0f1e]"></div>
        <div className="z-10 text-center">
          <h1 className="text-5xl font-bold text-teal-400 mb-4 tracking-widest glow-teal">AEGIS<span className="text-slate-100">TRACE</span></h1>
          <p className="text-slate-400 font-mono text-sm">POST-QUANTUM FORENSIC WATERMARKING</p>
          <div className="mt-12 grid grid-cols-3 gap-4 opacity-30">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-16 h-16 border border-teal-500 transform rotate-45 animate-pulse" style={{animationDelay: `${i * 0.2}s`}}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-8 relative">
        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center lg:hidden mb-8">
            <h1 className="text-4xl font-bold text-teal-400 tracking-widest glow-teal">AEGIS<span className="text-slate-100">TRACE</span></h1>
          </div>
          
          <div className="aegis-panel p-8">
            <h2 className="text-2xl font-semibold mb-6 text-center border-b border-[#1e3a5f] pb-4">Secure Terminal Login</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">OPERATOR ID</label>
                <input
                  type="text"
                  className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded p-3 text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">ACCESS PHRASE</label>
                <input
                  type="password"
                  className="w-full bg-[#0a0f1e] border border-[#1e3a5f] rounded p-3 text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="text-red-500 text-sm font-mono bg-red-500/10 p-3 rounded border border-red-500/30">{error}</div>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded transition-colors flex justify-center items-center"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "INITIALIZE SESSION"
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 text-xs font-mono text-slate-500 bg-[#0d1526] p-4 rounded border border-[#1e3a5f]">
            <p className="mb-2 text-teal-400">TEST CREDENTIALS:</p>
            <ul className="space-y-1">
              <li>SUPERADMIN: <span className="text-slate-300">superadmin1 / SuperAdmin@123</span></li>
              <li>ADMIN: <span className="text-slate-300">admin1 / Admin@123</span></li>
              <li>USER: <span className="text-slate-300">user1 / User1@123</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
