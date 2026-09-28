import React, { createContext, useState, useEffect, useContext } from 'react';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import { api } from './api';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('aegis_token');
    const storedUser = localStorage.getItem('aegis_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Optionally verify token with /api/auth/me here
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      localStorage.setItem('aegis_token', data.access_token);
      localStorage.setItem('aegis_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('aegis_token');
    localStorage.removeItem('aegis_user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-teal-400 font-mono">INITIALIZING AEGIS TRACE...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {user ? <Layout /> : <LoginPage />}
    </AuthContext.Provider>
  );
}

export default App;
