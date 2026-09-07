const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('vault_token') || localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada server');
  }
  return data;
}

export const api = {
  login: (email, masterPassword) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, masterPassword })
    }),

  register: (email, masterPassword) =>
    fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, masterPassword })
    }),

  getMe: () => fetchWithAuth('/auth/me'),

  getVaultItems: () => fetchWithAuth('/vault'),

  createVaultItem: (itemData) =>
    fetchWithAuth('/vault', {
      method: 'POST',
      body: JSON.stringify(itemData)
    }),

  updateVaultItem: (id, itemData) =>
    fetchWithAuth(`/vault/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    }),

  deleteVaultItem: (id) =>
    fetchWithAuth(`/vault/${id}`, {
      method: 'DELETE'
    }),

  toggleFavorite: (id) =>
    fetchWithAuth(`/vault/${id}/favorite`, {
      method: 'PATCH'
    }),

  // Financial Recap & Assets API
  getFinancialRecap: () => fetchWithAuth('/finance/recap'),
  
  updateFinancialAsset: (id, assetData) =>
    fetchWithAuth(`/finance/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData)
    }),

  addFinancialAsset: (assetData) =>
    fetchWithAuth('/finance/assets', {
      method: 'POST',
      body: JSON.stringify(assetData)
    }),

  deleteFinancialAsset: (id) =>
    fetchWithAuth(`/finance/assets/${id}`, {
      method: 'DELETE'
    }),

  getFinancialAdvisory: () => fetchWithAuth('/finance/advisory'),
  
  getAIFinancialAdvice: (question) =>
    fetchWithAuth('/finance/ai-advisor', {
      method: 'POST',
      body: JSON.stringify({ question })
    }),

  // Financial Snapshots API (Historical Child Details & Daily Snapshots)
  getFinancialSnapshots: () => fetchWithAuth('/finance/snapshots'),

  getSnapshotDetail: (id) => fetchWithAuth(`/finance/snapshots/${id}`),

  createFinancialSnapshot: (snapshotData) =>
    fetchWithAuth('/finance/snapshots', {
      method: 'POST',
      body: JSON.stringify(snapshotData)
    }),

  // Financial Journal / Transaction History
  getJournalEntries: () => fetchWithAuth('/finance/journal'),

  createJournalEntry: (entryData) =>
    fetchWithAuth('/finance/journal', {
      method: 'POST',
      body: JSON.stringify(entryData)
    }),
};
