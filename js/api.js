// ══════════════════════════════════════════════════════════════
// api.js — Centralized API configuration and helpers
// ══════════════════════════════════════════════════════════════

// Backend API Base URL
// Deployed Hostinger VPS API: https://marketai.solutions/sapi
const DEFAULT_API_BASE = 'https://marketai.solutions/sapi';

// When running locally via local-dev-server.js on localhost:5500, use relative '' to let it proxy
const isLocalProxy = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
  (window.location.port === '5500');

const API_BASE = (typeof window !== 'undefined' && window.API_BASE_URL)
  ? window.API_BASE_URL
  : (isLocalProxy ? '' : DEFAULT_API_BASE);

// Helper to resolve absolute or relative API URL
function getApiUrl(endpoint) {
  if (!endpoint) return '';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = API_BASE.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
  return base ? `${base}${path}` : path;
}

// Global API Object
const API = {
  // Base fetch with auth and error handling
  async fetch(url, options = {}) {
    const finalUrl = getApiUrl(url);
    const token = localStorage.getItem('susu9_token');

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(finalUrl, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      localStorage.removeItem('susu9_token');
      localStorage.removeItem('susu9_user');
      window.location.href = '/login.html';
      return null;
    }

    return data;
  },

  get: (url) => API.fetch(url),

  post: (url, body) => API.fetch(url, {
    method: 'POST',
    body: JSON.stringify(body)
  }),

  put: (url, body) => API.fetch(url, {
    method: 'PUT',
    body: JSON.stringify(body)
  }),

  delete: (url) => API.fetch(url, {
    method: 'DELETE'
  })
};

// Expose on window for easy access from inline scripts
if (typeof window !== 'undefined') {
  window.API = API;
  window.API_BASE = API_BASE;
  window.getApiUrl = getApiUrl;
}

// Current user helper
let currentUser = null;

async function getCurrentUser() {
  if (!currentUser) {
    const res = await API.get('/api/auth/me');
    if (res && res.success) {
      currentUser = res.user;
    } else {
      window.location.href = '/login.html';
    }
  }
  return currentUser;
}

// Logout
async function logout() {
  try {
    await API.post('/api/auth/logout', {});
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('susu9_token');
  localStorage.removeItem('susu9_user');
  window.location.href = '/login.html';
}

// Format number
function formatNum(n) {
  return parseFloat(n || 0).toFixed(2);
}

// Toast notification
function showToast(msg, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10001;
    background: ${type === 'success' ? '#00c853' : '#ff5252'};
    color: ${type === 'success' ? '#0a0f0a' : '#fff'};
    padding: 12px 24px; border-radius: 8px;
    font-family: 'Noto Sans', sans-serif; font-size: 0.9rem; font-weight: 500;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// IST date helper
function getISTDate() {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}

function formatDate(d) {
  const date = d || getISTDate();
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Navigation helper
function goTo(page) {
  window.location.href = `/app/${page}`;
}

// ─── Global ESC Navigation ───────────────────────────────────────────────────
function setupEscBack(fallbackUrl) {
  document.addEventListener('keyup', function(e) {
    if (e.key !== 'Escape' && e.keyCode !== 27) return;
    const openModal = document.querySelector('.modal-bg.show, .modal.show, [class*="modal"][style*="display: flex"]');
    if (openModal) {
      openModal.classList.remove('show');
      openModal.style.display = '';
      return;
    }
    if (fallbackUrl) {
      window.location.href = fallbackUrl;
    } else {
      if (history.length > 1) history.back();
      else window.location.href = '/pages/home.html';
    }
  });
}