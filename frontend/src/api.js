const API_BASE = '/api';

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('aegis_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    
    if (response.status === 401) {
      localStorage.removeItem('aegis_token');
      localStorage.removeItem('aegis_user');
      window.location.reload();
      return null;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in API ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
  getDocuments: () => request('/documents'),
  getRecipients: () => request('/recipients'),
  distribute: (data) => request('/distribute', { method: 'POST', body: JSON.stringify(data) }),
  decrypt: (data) => request('/decrypt', { method: 'POST', body: JSON.stringify(data) }),
  getDecryptedInstances: () => request('/decrypted_instances'),
  simulateAttack: (data) => request('/attacks/simulate', { method: 'POST', body: JSON.stringify(data) }),
  extractForensics: (data) => request('/forensics/extract', { method: 'POST', body: JSON.stringify(data) }),
  getLedger: () => request('/ledger'),
  getStatus: () => request('/status'),
  getAdminUsers: () => request('/admin/users'),
  getAuditLog: () => request('/admin/audit-log'),
  getPqcBenchmark: () => request('/pqc/benchmark'),
};
