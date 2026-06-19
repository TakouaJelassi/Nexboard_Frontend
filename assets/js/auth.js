/* ===========================
   NexBoard — auth.js
   Login · Register · Guest · Logout
   Requires: config.js
   =========================== */

// ── Storage helpers ───────────────────────────────────────────
function getToken() { return localStorage.getItem('nexboard_token'); }
function getUser()  { try { return JSON.parse(localStorage.getItem('nexboard_user')); } catch { return null; } }
function isGuest()  { return getToken() === 'guest'; }

function saveSession(data) {
  localStorage.setItem('nexboard_token', data.token);
  localStorage.setItem('nexboard_user', JSON.stringify(data));
}

// ── Logout ────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('nexboard_token');
  localStorage.removeItem('nexboard_user');
  window.location.href = '../pages/login.html';
}

// ── Guest login ───────────────────────────────────────────────
function guestLogin() {
  localStorage.setItem('nexboard_token', 'guest');
  localStorage.setItem('nexboard_user', JSON.stringify({
    fullname: 'Guest User',
    email:    'guest@nexboard.dev',
    user_id:  0,
  }));
  window.location.href = 'dashboard.html';
}

// ── Password toggle ───────────────────────────────────────────
function initPasswordToggle(btnId, inputId) {
  const btn = document.getElementById(btnId);
  const inp = document.getElementById(inputId);
  if (!btn || !inp) return;
  btn.addEventListener('click', () => {
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    const img = btn.querySelector('img');
    if (img) img.src = img.src.replace(show ? 'eye.svg' : 'eye-off.svg', show ? 'eye-off.svg' : 'eye.svg');
  });
}

// ── Password strength ─────────────────────────────────────────
const PW_LEVELS = [
  { w: '0%',   color: 'transparent', label: '' },
  { w: '25%',  color: '#ef4444',     label: 'Weak' },
  { w: '50%',  color: '#f59e0b',     label: 'Fair' },
  { w: '75%',  color: '#3b82f6',     label: 'Good' },
  { w: '100%', color: '#10b981',     label: 'Strong' },
];

function initPasswordStrength(inputId, barId, hintId) {
  const input = document.getElementById(inputId);
  const bar   = document.getElementById(barId);
  const hint  = document.getElementById(hintId);
  if (!input || !bar || !hint) return;

  input.addEventListener('input', () => {
    const v = input.value;
    let score = 0;
    if (v.length >= 8)           score++;
    if (/[A-Z]/.test(v))        score++;
    if (/[0-9]/.test(v))        score++;
    if (/[^a-zA-Z0-9]/.test(v)) score++;
    const level      = PW_LEVELS[score];
    bar.style.width  = level.w;
    bar.style.background = level.color;
    hint.textContent = v.length ? level.label : '';
    hint.style.color = level.color;
  });
}

// ── Login form ────────────────────────────────────────────────
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  initPasswordToggle('togglePw', 'password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const err = document.getElementById('errorMsg');
    btn.disabled    = true;
    btn.textContent = 'Signing in…';
    err.classList.add('hidden');

    try {
      const res = await fetch(`${API}/login/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    document.getElementById('email').value,
          password: document.getElementById('password').value,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.non_field_errors?.[0] || data.detail || 'Invalid email or password.');
      saveSession(data);
      window.location.href = 'dashboard.html';
    } catch (error) {
      err.textContent = error.message;
      err.classList.remove('hidden');
      btn.disabled    = false;
      btn.textContent = 'Sign in';
    }
  });
}

// ── Register form ─────────────────────────────────────────────
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  initPasswordToggle('togglePw', 'password');
  initPasswordToggle('toggleConfirmPw', 'confirmPassword');
  initPasswordStrength('password', 'pwBar', 'pwHint');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn  = document.getElementById('submitBtn');
    const err  = document.getElementById('errorMsg');
    const succ = document.getElementById('successMsg');
    err.classList.add('hidden');
    succ.classList.add('hidden');

    const pw  = document.getElementById('password').value;
    const cpw = document.getElementById('confirmPassword').value;
    if (pw !== cpw) {
      err.textContent = 'Passwords do not match.';
      err.classList.remove('hidden');
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Creating account…';

    try {
      const res = await fetch(`${API}/registration/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname:          document.getElementById('fullname').value,
          email:             document.getElementById('email').value,
          password:          pw,
          repeated_password: cpw,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Object.values(data).flat().join(' ') || 'Registration failed');
      succ.textContent = 'Account created! Redirecting to login…';
      succ.classList.remove('hidden');
      setTimeout(() => window.location.href = 'login.html', 1800);
    } catch (error) {
      err.textContent = error.message;
      err.classList.remove('hidden');
      btn.disabled    = false;
      btn.textContent = 'Create account';
    }
  });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
});
