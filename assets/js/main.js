/* ===========================
   NexBoard — main.js
   Shared UI utilities
   Requires: config.js, auth.js
   =========================== */

// ── API wrapper ───────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  if (isGuest()) return null;
  const res = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) { logout(); return null; }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(Object.values(data).flat().join(' ') || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 280);
  }, duration);
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Move to body so position:fixed is never broken by a parent stacking context
  if (el.parentElement !== document.body) document.body.appendChild(el);
  el.classList.add('open');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open');
});

// ── Confirm dialog (replaces native confirm()) ────────────────
(function injectConfirmModal() {
  const el = document.createElement('div');
  el.className = 'modal-overlay modal-sm';
  el.id = 'confirmModal';
  el.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3 class="modal-title">Confirm</h3></div>
      <div class="modal-body">
        <p id="confirmMessage" style="color:var(--text-secondary);font-size:0.9rem;margin:0;"></p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="_confirmCancel()">Cancel</button>
        <button class="btn btn-primary" id="confirmOkBtn" onclick="_confirmOk()">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(el);
})();

let _confirmResolve = null;

function showConfirm(message, confirmLabel = 'Confirm', danger = false) {
  return new Promise(resolve => {
    _confirmResolve = resolve;
    document.getElementById('confirmMessage').textContent = message;
    const btn = document.getElementById('confirmOkBtn');
    btn.textContent = confirmLabel;
    btn.className   = `btn ${danger ? 'btn-primary btn-danger-solid' : 'btn-primary'}`;
    openModal('confirmModal');
  });
}

function _confirmOk()     { closeModal('confirmModal'); _confirmResolve?.(true);  }
function _confirmCancel() { closeModal('confirmModal'); _confirmResolve?.(false); }

// ── User avatar + dropdown ────────────────────────────────────
function initAvatar() {
  const el = document.getElementById('userAvatar');
  if (!el) return;

  const u = getUser();
  if (u) {
    const name = u.fullname || `${u.first_name || ''} ${u.last_name || ''}`.trim();
    el.textContent = initials(name) || 'G';
    el.style.cssText += avatarStyle(0);

    const nameEl  = document.getElementById('avatarName');
    const emailEl = document.getElementById('avatarEmail');
    if (nameEl)  nameEl.textContent  = name  || '—';
    if (emailEl) emailEl.textContent = u.email || '—';
  }

  const menu     = document.getElementById('avatarMenu');
  const dropdown = document.getElementById('avatarDropdown');
  if (!menu || !dropdown) return;

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));
}

// ── Greeting ─────────────────────────────────────────────────
function setGreeting() {
  const el = document.getElementById('greetMsg');
  if (!el) return;
  const h    = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  const u    = getUser();
  const name = u?.fullname ? `, ${u.fullname.split(' ')[0]}` : '';
  el.textContent = `Good ${part}${name}! Here's what's happening today.`;
}

// ── Date formatter ────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Sidebar boards (shared: dashboard · boards · tasks · board) ──
function renderSidebarBoards(boards, activeId = null) {
  const el = document.getElementById('sidebarBoards');
  if (!el) return;
  el.innerHTML = boards?.length
    ? boards.map((b, i) => Templates.sidebarBoard(b, i, activeId)).join('')
    : Templates.sidebarEmpty();
}

async function loadSidebarBoards(activeId = null) {
  let boards = [];
  try { const data = await apiFetch(ENDPOINTS.boards()); if (data) boards = data; } catch { /* empty */ }
  renderSidebarBoards(boards, activeId);
}

// ── Sidebar toggle (mobile) ───────────────────────────────────
function toggleSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const isOpen   = sidebar?.classList.contains('open');
  sidebar?.classList.toggle('open', !isOpen);
  if (overlay) { overlay.style.display = isOpen ? 'none' : 'block'; }
}

function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  const overlay = document.getElementById('sidebarOverlay');
  if (overlay) overlay.style.display = 'none';
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAvatar();
  setGreeting();

  // inject sidebar overlay once
  if (!document.getElementById('sidebarOverlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.onclick = closeSidebar;
    document.body.appendChild(overlay);
  }
});
