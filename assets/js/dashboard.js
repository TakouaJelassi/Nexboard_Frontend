/* ===========================
   NexBoard — dashboard.js
   =========================== */

let currentTaskFilter = 'assigned'; // 'assigned' | 'review'
let allTasksCache     = [];
let reviewTasksCache  = [];

const DEMO_BOARDS = [
  { id: 1, title: 'Frontend Redesign',   description: 'Complete UI overhaul — dark theme, new components, mobile-first layout', color: '#7c3aed', tasks: 8,  done: 5, members: 3 },
  { id: 2, title: 'API Development',     description: 'REST API with Django REST Framework — auth, boards, tasks, comments',     color: '#06b6d4', tasks: 12, done: 9, members: 2 },
  { id: 3, title: 'Portfolio Project',   description: 'NexBoard full-stack showcase — ready for employer demo',                  color: '#10b981', tasks: 6,  done: 6, members: 1 },
];

const DEMO_TASKS = [
  { id: 1, title: 'Design onboarding flow',  status: 'inprogress', priority: 'high',   due_date: '2026-06-20', board: 1 },
  { id: 2, title: 'Write API docs',          status: 'todo',       priority: 'medium', due_date: '2026-06-25', board: 2 },
  { id: 3, title: 'Auth token refresh',      status: 'inprogress', priority: 'high',   due_date: '2026-06-18', board: 2 },
  { id: 4, title: 'Dashboard layout',        status: 'review',     priority: 'medium', due_date: '2026-06-22', board: 1 },
  { id: 5, title: 'User registration',       status: 'done',       priority: 'low',    due_date: '2026-06-10', board: 3 },
  { id: 6, title: 'Kanban drag & drop',      status: 'done',       priority: 'high',   due_date: '2026-06-12', board: 1 },
  { id: 7, title: 'Add dark mode toggle',    status: 'todo',       priority: 'low',    due_date: '2026-06-30', board: 1 },
  { id: 8, title: 'REST API setup',          status: 'done',       priority: 'medium', due_date: '2026-06-08', board: 2 },
];

// ── Chart ────────────────────────────────────────────────────────

let chartInstance = null;

const STATUS_CONFIG = {
  todo:       { label: 'To Do',       color: '#7c3aed' },
  'to-do':    { label: 'To Do',       color: '#7c3aed' },
  inprogress: { label: 'In Progress', color: '#06b6d4' },
  'in-progress': { label: 'In Progress', color: '#06b6d4' },
  review:     { label: 'Review',      color: '#f59e0b' },
  done:       { label: 'Done',        color: '#10b981' },
};

function drawStatusChart(tasks) {
  const canvas = document.getElementById('statusChart');
  if (!canvas) return;

  const counts = {
    todo:       tasks.filter(t => t.status === 'todo'       || t.status === 'to-do').length,
    inprogress: tasks.filter(t => t.status === 'inprogress' || t.status === 'in-progress').length,
    review:     tasks.filter(t => t.status === 'review').length,
    done:       tasks.filter(t => t.status === 'done').length,
  };

  const labels = ['To Do', 'In Progress', 'Review', 'Done'];
  const data   = [counts.todo, counts.inprogress, counts.review, counts.done];
  const colors = ['#7c3aed', '#06b6d4', '#f59e0b', '#10b981'];
  const total  = data.reduce((a, b) => a + b, 0) || 1;

  if (chartInstance) { chartInstance.destroy(); }

  chartInstance = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: '#0d0d1a',
        borderWidth: 3,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} (${Math.round(ctx.raw / total * 100)}%)`,
          },
          backgroundColor: '#1a1a2e',
          titleColor: '#e2e8f0',
          bodyColor: '#8892a4',
          borderColor: '#2a2a3e',
          borderWidth: 1,
          padding: 10,
        },
      },
    },
  });

  // Custom legend
  const legend = document.getElementById('chartLegend');
  if (legend) {
    legend.innerHTML = labels.map((l, i) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${colors[i]};"></span>
        <span class="legend-label">${l}</span>
        <span class="legend-count">${data[i]}</span>
      </div>
    `).join('');
  }
}

// ── Tasks Table ──────────────────────────────────────────────────

function renderRecentTasks(tasks) {
  const el = document.getElementById('recentTasksList');
  if (!el) return;

  const recent = tasks.slice(0, 6);

  if (!recent.length) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No tasks yet.</p>';
    return;
  }

  el.innerHTML = Templates.taskTable(recent, ['Title','Status','Priority','Due']);
}

// ── Task Filter Toggle ────────────────────────────────────────

async function switchTaskFilter(filter) {
  currentTaskFilter = filter;

  document.getElementById('tabAssigned')?.classList.toggle('active', filter === 'assigned');
  document.getElementById('tabReview')?.classList.toggle('active',   filter === 'review');

  if (isGuest()) {
    // Guest: always use demo data
    if (filter === 'review') {
      renderRecentTasks(DEMO_TASKS.filter(t => t.status === 'review'));
    } else {
      renderRecentTasks(DEMO_TASKS);
    }
    return;
  }

  // Real user
  if (filter === 'review') {
    if (!reviewTasksCache.length) {
      try {
        const data = await apiFetch(ENDPOINTS.reviewing());
        if (data && data.length) reviewTasksCache = data;
      } catch { /* network error */ }
    }
    if (reviewTasksCache.length) renderRecentTasks(reviewTasksCache);
    else renderEmptyTasks();
  } else {
    if (allTasksCache.length) renderRecentTasks(allTasksCache);
    else renderEmptyTasks();
  }
}

// ── Boards Grid ──────────────────────────────────────────────────

function renderBoards(boards) {
  const grid = document.getElementById('boardsGrid');
  if (!grid) return;

  grid.innerHTML = boards.map((b, i) => Templates.boardCard(b, i)).join('') + Templates.boardCardNew();
}

// ── Sidebar Boards ────────────────────────────────────────────────

function renderSidebarBoards(boards, activeBoardId = null) {
  const el = document.getElementById('sidebarBoards');
  if (!el) return;

  if (!boards.length) { el.innerHTML = Templates.sidebarEmpty(); return; }

  el.innerHTML = boards.map((b, i) => Templates.sidebarBoard(b, i, activeBoardId)).join('');
}

// ── Empty States ──────────────────────────────────────────────────

function renderEmptyBoards() {
  const grid = document.getElementById('boardsGrid');
  if (!grid) return;
  grid.innerHTML = Templates.emptyBoards();
}

function renderEmptyTasks() {
  const el = document.getElementById('recentTasksList');
  if (!el) return;
  el.innerHTML = Templates.emptyTasks('No tasks yet. Open a board and add your first task.');
}

// ── Load Data ────────────────────────────────────────────────────

let liveBoards = [];

async function loadDashboard() {
  const guest = isGuest();

  let boards = guest ? DEMO_BOARDS : [];
  let tasks  = guest ? DEMO_TASKS  : [];

  if (!guest) {
    try {
      const [apiBoards, apiTasks] = await Promise.all([
        apiFetch(ENDPOINTS.boards()),
        apiFetch(ENDPOINTS.assignedToMe()),
      ]);
      if (apiBoards) {
        const userId = getUser()?.user_id;
        // "My Boards" = boards where I am the owner
        boards = userId ? apiBoards.filter(b => b.owner_id == userId) : apiBoards;
      }
      if (apiTasks) tasks = apiTasks;
    } catch { /* network error — show empty state */ }
  }

  liveBoards    = boards;
  allTasksCache = tasks;

  if (boards.length) renderBoards(boards);
  else               renderEmptyBoards();

  renderSidebarBoards(boards);

  drawStatusChart(tasks);

  if (tasks.length) renderRecentTasks(tasks);
  else              renderEmptyTasks();

  // stat counters
  const done        = tasks.filter(t => t.status === 'done').length;
  const open        = tasks.filter(t => t.status !== 'done').length;
  const now         = new Date();
  const inWeek      = new Date(now); inWeek.setDate(now.getDate() + 7);
  const dueThisWeek = tasks.filter(t => { const d = new Date(t.due_date); return d >= now && d <= inWeek; }).length;

  if (document.getElementById('statBoards')) document.getElementById('statBoards').textContent = boards.length;
  if (document.getElementById('statDone'))   document.getElementById('statDone').textContent   = done;
  if (document.getElementById('statTasks'))  document.getElementById('statTasks').textContent  = open;
  if (document.getElementById('statDue'))    document.getElementById('statDue').textContent    = dueThisWeek;
}

async function createBoard() {
  const name = document.getElementById('newBoardName').value.trim();
  if (!name) { showToast('Please enter a board name', 'error'); return; }
  const desc  = document.getElementById('newBoardDesc').value.trim();
  const color = document.querySelector('input[name="boardColor"]:checked')?.value || '#7c3aed';

  closeModal('newBoardModal');
  document.getElementById('newBoardName').value = '';
  document.getElementById('newBoardDesc').value = '';

  if (isGuest()) {
    const newBoard = { id: Date.now(), title: name, description: desc || 'No description', color, tasks: 0, done: 0, members: 1 };
    liveBoards.unshift(newBoard);
    renderBoards(liveBoards);
    showToast(`Board "${name}" created!`, 'success');
    return;
  }

  try {
    const created = await apiFetch(ENDPOINTS.boards(), {
      method: 'POST',
      body: JSON.stringify({ title: name, description: desc }),
    });
    if (created) {
      showToast(`Board "${name}" created!`, 'success');
      loadDashboard(); // reload to get fresh data from server
    }
  } catch {
    showToast('Could not create board. Please try again.', 'error');
  }
}

function searchDashboard(value) {
  const q = value.trim().toLowerCase();

  // Filter boards
  const filteredBoards = q ? liveBoards.filter(b => b.title?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)) : liveBoards;
  if (filteredBoards.length) renderBoards(filteredBoards);
  else renderEmptyBoards();

  // Filter tasks table
  const taskList = currentTaskFilter === 'review' ? reviewTasksCache : allTasksCache;
  const filteredTasks = q ? taskList.filter(t => t.title?.toLowerCase().includes(q)) : taskList;
  if (filteredTasks.length) renderRecentTasks(filteredTasks);
  else renderEmptyTasks();
}

document.addEventListener('DOMContentLoaded', loadDashboard);
