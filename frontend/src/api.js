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
      throw new Error(errorData.detail || errorData.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API ${endpoint}:`, error);
    throw error;
  }
};

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  changePassword: (current_password, new_password) =>
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }),

  // ── Documents ─────────────────────────────────────────────────────────────
  getDocuments: () => request('/documents'),
  getDocument: (id) => request(`/documents/${id}`),
  createDocument: (data) =>
    request('/documents', { method: 'POST', body: JSON.stringify(data) }),

  // ── Distribution ──────────────────────────────────────────────────────────
  distribute: (data) =>
    request('/distribute', { method: 'POST', body: JSON.stringify(data) }),
  getPackages: () => request('/packages'),
  getPackage: (id) => request(`/packages/${id}`),
  getRecipients: () => request('/recipients'),

  // Packages with envelope details (recipient list per package)
  getPackagesWithRecipients: async () => {
    const pkgs = await request('/packages');
    if (!pkgs) return [];
    // Fetch envelope details for each package
    const detailed = await Promise.all(
      pkgs.map(pkg => request(`/packages/${pkg.id}`).catch(() => pkg))
    );
    return detailed;
  },

  // ── Decryption ────────────────────────────────────────────────────────────
  decrypt: (data) =>
    request('/decrypt', { method: 'POST', body: JSON.stringify(data) }),
  getDecryptedInstances: () => request('/decrypted_instances'),
  getDecryptedInstance: (id) => request(`/decrypted_instances/${id}`),

  // ── Forensics ─────────────────────────────────────────────────────────────
  simulateAttack: (data) =>
    request('/attacks/simulate', { method: 'POST', body: JSON.stringify(data) }),
  extractForensics: (data) =>
    request('/forensics/extract', { method: 'POST', body: JSON.stringify(data) }),
  getForensicReports: () => request('/forensics/reports'),

  // ── Ledger ────────────────────────────────────────────────────────────────
  getLedger: () => request('/ledger'),
  tamperLedger: (data) =>
    request('/ledger/tamper', { method: 'POST', body: JSON.stringify(data) }),
  restoreLedger: () =>
    request('/ledger/restore', { method: 'POST' }),

  // ── System ────────────────────────────────────────────────────────────────
  getStatus: () => request('/status'),
  getPqcBenchmark: () => request('/pqc/benchmark'),

  // ── Admin (SUPERADMIN only) ───────────────────────────────────────────────
  getAdminUsers: () => request('/admin/users'),
  createUser: (data) =>
    request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),
  toggleUserActive: (id, active) =>
    request(`/admin/users/${id}/activate?active=${active}`, { method: 'PATCH' }),
  getAuditLog: () => request('/admin/audit-log'),
};
