/**
 * Shared Utility Functions
 * API calls, toast notifications, token management, helpers
 */

const API_BASE = '/api';

// ─── Token Management ────────────────────────────────────
function getToken() {
  return localStorage.getItem('mess_token');
}

function setToken(token) {
  localStorage.setItem('mess_token', token);
}

function removeToken() {
  localStorage.removeItem('mess_token');
  localStorage.removeItem('mess_user');
}

function getUser() {
  const raw = localStorage.getItem('mess_user');
  return raw ? JSON.parse(raw) : null;
}

function setUser(user) {
  localStorage.setItem('mess_user', JSON.stringify(user));
}

function isLoggedIn() {
  return !!getToken();
}

function logout() {
  const token = getToken();
  if (token) {
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  }
  removeToken();
  window.location.href = '/';
}

// ─── API Fetch Wrapper ───────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const url = API_BASE + endpoint;
  const token = getToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      removeToken();
      window.location.href = '/';
    }
    throw error;
  }
}

// ─── Toast Notifications ─────────────────────────────────
function getToastContainer() {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'info', duration = 3000) {
  const container = getToastContainer();

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toast;
}

// ─── Date / Time Helpers ─────────────────────────────────
function getDayName(date = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// ─── DOM Helpers ─────────────────────────────────────────
function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

function createElement(tag, className = '', innerHTML = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

// ─── Stars Display ───────────────────────────────────────
function renderStars(rating) {
  let html = '<div class="stars-display">';
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
  }
  html += '</div>';
  return html;
}

// ─── User Avatar Initials ────────────────────────────────
function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Auth Guard ──────────────────────────────────────────
function requireAuth(role = null) {
  if (!isLoggedIn()) {
    window.location.href = '/';
    return false;
  }
  const user = getUser();
  if (role && user.role !== role) {
    window.location.href = '/';
    return false;
  }
  return true;
}
