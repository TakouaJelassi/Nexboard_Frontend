/* ===========================
   NexBoard — tasks.js
   =========================== */

let assignedCache = [];
let reviewCache   = [];
let currentFilter = 'assigned';

// ── Render ────────────────────────────────────────────────────

function renderTasks(tasks) {
  const el = document.getElementById('tasksList');
  if (!el) return;

  const q = document.getElementById('taskSearch')?.value.trim().toLowerCase() || '';
  const filtered = q ? tasks.filter(t => t.title.toLowerCase().includes(q)) : tasks;

  if (!filtered.length) {
    el.innerHTML = Templates.emptyTasks('No tasks found. Open a board and add tasks to see them here.');
    return;
  }

  el.innerHTML = Templates.taskTable(filtered, ['Title','Status','Priority','Due date','Assignee']);
}

function filterTasks() {
  const list = currentFilter === 'review' ? reviewCache : assignedCache;
  renderTasks(list);
}

// ── Filter switch ─────────────────────────────────────────────

async function switchFilter(filter) {
  currentFilter = filter;
  document.getElementById('tabAssigned')?.classList.toggle('active', filter === 'assigned');
  document.getElementById('tabReview')?.classList.toggle('active',   filter === 'review');

  if (filter === 'review') {
    if (!reviewCache.length) {
      try {
        const data = await apiFetch(ENDPOINTS.reviewing());
        if (data) reviewCache = data;
      } catch { reviewCache = []; }
    }
    renderTasks(reviewCache);
  } else {
    renderTasks(assignedCache);
  }
}

// ── Sidebar ───────────────────────────────────────────────────

async function loadSidebarBoards() {
  const el = document.getElementById('sidebarBoards');
  if (!el) return;
  try {
    const data = await apiFetch(ENDPOINTS.boards());
    if (!data?.length) { el.innerHTML = Templates.sidebarEmpty(); return; }
    el.innerHTML = data.map((b, i) => Templates.sidebarBoard(b, i)).join('');
  } catch { /* leave empty */ }
}

// ── Load ──────────────────────────────────────────────────────

async function loadTasks() {
  try {
    const data = await apiFetch(ENDPOINTS.assignedToMe());
    if (data) assignedCache = data;
  } catch { assignedCache = []; }

  renderTasks(assignedCache);
  loadSidebarBoards();
}

document.addEventListener('DOMContentLoaded', loadTasks);
