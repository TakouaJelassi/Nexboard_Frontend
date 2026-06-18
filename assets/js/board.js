/* ===========================
   NexBoard — board.js
   =========================== */

const TO_BACKEND  = { todo: 'to-do', inprogress: 'in-progress', review: 'review', done: 'done' };
const TO_FRONTEND = { 'to-do': 'todo', 'in-progress': 'inprogress', review: 'review', done: 'done' };
const COLUMNS     = ['todo', 'inprogress', 'review', 'done'];
const STATUS_LABELS = { todo: 'To Do', inprogress: 'In Progress', review: 'Review', done: 'Done' };

let currentBoardId = null;
let draggedId      = null;
let currentTaskId  = null;
let boardMembers   = [];
let searchQuery    = '';
let activeFilters  = { priority: 'all', due: 'all' };

let tasks = [
  { id: 1, title: 'Design dark theme tokens',  description: 'CSS variables for all colors, spacing, radius',  status: 'done',        priority: 'high',   due_date: '2026-06-10', assignee: { fullname: 'TJ' } },
  { id: 2, title: 'Build Kanban board UI',      description: 'Drag-and-drop columns with task cards',          status: 'done',        priority: 'high',   due_date: '2026-06-12', assignee: { fullname: 'TJ' } },
  { id: 3, title: 'REST API integration',       description: 'Connect frontend to Django REST endpoints',      status: 'in-progress', priority: 'high',   due_date: '2026-06-18', assignee: { fullname: 'TJ' } },
  { id: 4, title: 'Auth token handling',        description: 'Store & refresh auth tokens securely',           status: 'in-progress', priority: 'medium', due_date: '2026-06-18', assignee: { fullname: 'TJ' } },
  { id: 5, title: 'Responsive mobile layout',  description: 'Sidebar collapse, stacked columns on mobile',   status: 'review',      priority: 'medium', due_date: '2026-06-20', assignee: { fullname: 'TJ' } },
  { id: 6, title: 'Write API documentation',   description: 'Swagger / OpenAPI docs via drf-spectacular',    status: 'to-do',       priority: 'low',    due_date: '2026-06-25', assignee: { fullname: 'TJ' } },
  { id: 7, title: 'Add task comments',         description: 'Comment thread on each task card',              status: 'to-do',       priority: 'medium', due_date: '2026-06-28', assignee: { fullname: 'TJ' } },
  { id: 8, title: 'Deploy to Render',          description: 'gunicorn + whitenoise production setup',        status: 'to-do',       priority: 'high',   due_date: '2026-06-30', assignee: { fullname: 'TJ' } },
];

// ── Helpers ───────────────────────────────────────────────────
const toFrontend = s => TO_FRONTEND[s] || s;
const toBackend  = s => TO_BACKEND[s]  || s;

function assigneeName(t) { return t.assignee?.fullname || t.assignee?.email?.split('@')[0] || 'TJ'; }

// ── Filter / Search ───────────────────────────────────────────
function filterTasks(list) {
  return list.filter(t => {
    if (searchQuery && !t.title?.toLowerCase().includes(searchQuery) && !t.description?.toLowerCase().includes(searchQuery)) return false;
    if (activeFilters.priority !== 'all' && t.priority !== activeFilters.priority) return false;
    if (activeFilters.due !== 'all') {
      const due = new Date(t.due_date), now = new Date(); now.setHours(0,0,0,0);
      const end = new Date(now); end.setDate(now.getDate() + 7);
      if (activeFilters.due === 'today' && due.toDateString() !== now.toDateString()) return false;
      if (activeFilters.due === 'week'  && (due < now || due > end)) return false;
      if (activeFilters.due === 'late'  && due >= now) return false;
    }
    return true;
  });
}

function searchTasks(value) { searchQuery = value.trim().toLowerCase(); renderBoard(); }

function setFilterChip(btn, group) {
  document.querySelectorAll(`#filter${group.charAt(0).toUpperCase()+group.slice(1)} .filter-chip`).forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}
function applyFilters() {
  activeFilters.priority = document.querySelector('#filterPriority .filter-chip.active')?.dataset.value || 'all';
  activeFilters.due      = document.querySelector('#filterDue .filter-chip.active')?.dataset.value      || 'all';
  closeModal('filterModal'); renderBoard();
}
function resetFilters() {
  activeFilters = { priority: 'all', due: 'all' };
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.filter-chip[data-value="all"]').forEach(c => c.classList.add('active'));
  closeModal('filterModal'); renderBoard();
}

// ── Mobile column tabs ────────────────────────────────────────
let activeCol = 'todo';

function switchColTab(col) {
  activeCol = col;
  document.querySelectorAll('.col-tab').forEach(t => t.classList.toggle('active', t.dataset.col === col));
  COLUMNS.forEach(c => {
    const el = document.getElementById(`col-${c}`);
    if (el) el.classList.toggle('col-active', c === col);
  });
}

// ── Render Board ──────────────────────────────────────────────
function renderBoard() {
  COLUMNS.forEach(col => {
    const colTasks  = filterTasks(tasks.filter(t => toFrontend(t.status) === col));
    const container = document.getElementById(`tasks-${col}`);
    const countEl   = document.getElementById(`count-${col}`);
    const tabCount  = document.getElementById(`tab-count-${col}`);
    if (!container || !countEl) return;
    countEl.textContent = colTasks.length;
    if (tabCount) tabCount.textContent = colTasks.length;
    container.innerHTML = colTasks.map(t => Templates.taskCard(t, assigneeName(t))).join('');
  });
}

// ── Drag & Drop ───────────────────────────────────────────────
function onDragStart(e, id) { draggedId = id; e.dataTransfer.effectAllowed = 'move'; setTimeout(() => e.target.style.opacity = '0.4', 0); }
function onDragEnd(e)       { e.target.style.opacity = '1'; draggedId = null; document.querySelectorAll('.column').forEach(c => c.style.background = ''); }
function onDragOver(e)      { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.style.background = '#7c3aed08'; }
function onDrop(e, col) {
  e.preventDefault(); e.currentTarget.style.background = '';
  if (!draggedId) return;
  const task = tasks.find(t => t.id === draggedId);
  if (task && toFrontend(task.status) !== col) {
    task.status = toBackend(col); renderBoard(); showToast('Task moved', 'success');
    apiFetch(ENDPOINTS.task(task.id), { method: 'PATCH', body: JSON.stringify({ status: toBackend(col) }) }).catch(() => {});
  }
}

// ── Member Selects ────────────────────────────────────────────
function memberOptions(label) {
  return `<option value="">${label}</option>` + boardMembers.map(m => `<option value="${m.id}">${m.fullname || m.email}</option>`).join('');
}
function populateMemberSelects() {
  const a = document.getElementById('taskAssignee'), r = document.getElementById('taskReviewer');
  if (a) a.innerHTML = memberOptions('Unassigned');
  if (r) r.innerHTML = memberOptions('None');
}
function quickAdd(col) { document.getElementById('taskStatus').value = col; populateMemberSelects(); openModal('newTaskModal'); }

// ── Create Task ───────────────────────────────────────────────
function createTask() {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { showToast('Please enter a task title', 'error'); return; }
  const col         = document.getElementById('taskStatus').value;
  const due_date    = document.getElementById('taskDue').value || new Date().toISOString().split('T')[0];
  const priority    = document.getElementById('taskPriority').value;
  const description = document.getElementById('taskDesc').value.trim();
  const assignee_id = document.getElementById('taskAssignee')?.value || null;
  const reviewer_id = document.getElementById('taskReviewer')?.value || null;

  const local = { id: Date.now(), title, description, status: toBackend(col), priority, due_date,
    assignee: getUser() ? { fullname: getUser().fullname || 'Me' } : { fullname: 'TJ' } };
  tasks.unshift(local); renderBoard(); closeModal('newTaskModal');
  ['taskTitle','taskDesc','taskDue'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  showToast('Task created!', 'success');

  if (currentBoardId) {
    apiFetch(ENDPOINTS.tasks(), { method: 'POST', body: JSON.stringify({
      board: currentBoardId, title, description, status: toBackend(col), priority, due_date,
      ...(assignee_id ? { assignee_id: Number(assignee_id) } : {}),
      ...(reviewer_id ? { reviewer_id: Number(reviewer_id) } : {}),
    }) }).then(data => { if (data) { const i = tasks.findIndex(t => t.id === local.id); if (i !== -1) tasks[i] = data; renderBoard(); } }).catch(() => {});
  }
}

// ── Task Detail ───────────────────────────────────────────────
function openTaskDetail(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  currentTaskId = id;
  const fs = toFrontend(t.status);
  const memberOpts = type => boardMembers.map(m =>
    `<option value="${m.id}" ${t[type]?.id === m.id ? 'selected' : ''}>${m.fullname || m.email}</option>`).join('');

  document.getElementById('detailTitle').textContent = t.title;
  document.getElementById('detailBody').innerHTML =
    Templates.taskDetailBody(t, fs, STATUS_LABELS, COLUMNS, memberOpts);

  const footer = document.querySelector('#taskDetailModal .modal-footer');
  if (footer) footer.innerHTML = `
    <button class="btn btn-secondary btn-danger" onclick="deleteCurrentTask()">Delete</button>
    <button class="btn btn-secondary" onclick="closeModal('taskDetailModal')">Cancel</button>
    <button class="btn btn-primary" onclick="saveTaskDetail(${id})">Save</button>`;
  openModal('taskDetailModal');
  if (!isGuest()) loadComments(id);
}

async function saveTaskDetail(id) {
  const priority    = document.getElementById('detailPriority')?.value;
  const due_date    = document.getElementById('detailDue')?.value || null;
  const assignee_id = document.getElementById('detailAssignee')?.value;
  const reviewer_id = document.getElementById('detailReviewer')?.value;
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.priority = priority; task.due_date = due_date;
    task.assignee = assignee_id ? boardMembers.find(m => m.id === Number(assignee_id)) || null : null;
    task.reviewer = reviewer_id ? boardMembers.find(m => m.id === Number(reviewer_id)) || null : null;
  }
  closeModal('taskDetailModal'); renderBoard(); showToast('Task updated', 'success');
  try {
    await apiFetch(ENDPOINTS.task(id), { method: 'PATCH', body: JSON.stringify({
      priority, due_date,
      assignee_id: assignee_id ? Number(assignee_id) : 0,
      reviewer_id: reviewer_id ? Number(reviewer_id) : 0,
    }) });
  } catch { showToast('Could not save changes', 'error'); }
}

function moveTask(id, col) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = toBackend(col); renderBoard(); closeModal('taskDetailModal');
  showToast('Task moved to ' + STATUS_LABELS[col], 'success');
  apiFetch(ENDPOINTS.task(id), { method: 'PATCH', body: JSON.stringify({ status: toBackend(col) }) }).catch(() => {});
}

async function deleteCurrentTask() {
  if (!currentTaskId) return;
  const ok = await showConfirm('Delete this task? This cannot be undone.', 'Delete', true);
  if (!ok) return;
  tasks = tasks.filter(t => t.id !== currentTaskId);
  renderBoard(); closeModal('taskDetailModal'); showToast('Task deleted', 'info');
  apiFetch(ENDPOINTS.task(currentTaskId), { method: 'DELETE' }).catch(() => {});
  currentTaskId = null;
}

// ── Member Avatars ────────────────────────────────────────────
function renderMemberAvatars() {
  const el = document.getElementById('memberAvatars');
  if (!el) return;
  const members = boardMembers.length ? boardMembers : (getUser() ? [{ fullname: getUser().fullname }] : []);
  const visible  = members.slice(0, 5), overflow = members.length - visible.length;
  el.innerHTML = visible.map((m, i) => Templates.avatar(m.fullname || m.email, i, 30)).join('')
    + (overflow > 0 ? Templates.avatarOverflow(overflow, 30) : '');
}

function updateOpenCount() {
  const el = document.getElementById('boardOpenCount');
  if (!el) return;
  const open = tasks.filter(t => toFrontend(t.status) !== 'done').length;
  el.textContent = `${open} open`;
  el.classList.toggle('hidden', open === 0);
}

// ── Edit Board ────────────────────────────────────────────────
function openEditBoardModal() {
  const title = document.getElementById('boardTitle')?.textContent || '';
  const desc  = document.getElementById('boardDesc')?.textContent  || '';
  document.getElementById('editBoardName').value = title;
  document.getElementById('editBoardDesc').value = desc;
  const color = tasks.length ? null : null;
  const currentColor = document.querySelector('input[name="editBoardColor"]');
  if (currentColor) {
    const match = document.querySelector(`input[name="editBoardColor"][value="${window._boardColor || '#7c3aed'}"]`);
    if (match) match.checked = true;
  }
  openModal('editBoardModal');
}

async function deleteBoard() {
  const ok = await showConfirm('Delete this board and all its tasks? This cannot be undone.', 'Delete', true);
  if (!ok) return;
  closeModal('editBoardModal');
  try {
    await apiFetch(ENDPOINTS.board(currentBoardId), { method: 'DELETE' });
    showToast('Board deleted', 'info');
    window.location.href = 'boards.html';
  } catch {
    showToast('Could not delete board', 'error');
  }
}

async function saveEditBoard() {
  const title = document.getElementById('editBoardName').value.trim();
  if (!title) { showToast('Please enter a board name', 'error'); return; }
  const desc  = document.getElementById('editBoardDesc').value.trim();
  const color = document.querySelector('input[name="editBoardColor"]:checked')?.value || '#7c3aed';

  closeModal('editBoardModal');
  try {
    await apiFetch(ENDPOINTS.board(currentBoardId), {
      method: 'PATCH',
      body: JSON.stringify({ title, description: desc, color }),
    });
    document.getElementById('boardTitle').textContent = title;
    document.getElementById('boardDesc').textContent  = desc;
    window._boardColor = color;
    showToast('Board updated', 'success');
    loadSidebarBoards(currentBoardId);
  } catch {
    showToast('Could not update board', 'error');
  }
}

// ── Members Modal ─────────────────────────────────────────────
async function openMembersModal() {
  openModal('inviteModal');
  const list = document.getElementById('membersList');
  if (!list) return;
  list.innerHTML = '<p class="text-muted-sm">Loading…</p>';
  let members = [], ownerId = null;
  try {
    if (currentBoardId) {
      const data = await apiFetch(ENDPOINTS.board(currentBoardId));
      members = data?.members || []; ownerId = data?.owner_id || null;
    }
  } catch { /* show empty */ }
  const currentUserId = getUser()?.id || null;
  list.innerHTML = members.length
    ? members.map((m, i) => Templates.memberItem(m, i, ownerId, currentUserId)).join('')
    : Templates.emptyTasks('No members found.');
}

async function inviteMember() {
  const input = document.getElementById('inviteEmail');
  const email = input?.value.trim();
  if (!email)                                       { setInviteError('Please enter an email address.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))  { setInviteError('Please enter a valid email address.'); return; }
  if (boardMembers.some(m => m.email === email))    { setInviteError('This person is already a member.'); return; }
  let user;
  try   { user = await apiFetch(ENDPOINTS.emailCheck(email)); }
  catch { setInviteError('This email address is not registered.'); return; }
  try {
    await apiFetch(ENDPOINTS.board(currentBoardId), { method: 'PATCH',
      body: JSON.stringify({ members: [...boardMembers.map(m => m.id), user.id] }) });
    boardMembers.push(user); input.value = '';
    setInviteError(''); renderMemberAvatars(); openMembersModal();
    showToast(`${user.fullname || email} added to board!`, 'success');
  } catch { setInviteError('Could not add member. Please try again.'); }
}

function setInviteError(msg) {
  const el = document.getElementById('inviteEmailError');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('hidden', !msg);
}

function hideInviteError() { setInviteError(''); }

async function removeMember(memberId) {
  const ok = await showConfirm('Remove this member from the board?', 'Remove', true);
  if (!ok) return;
  const remaining = boardMembers.filter(m => m.id !== memberId).map(m => m.id);
  try {
    await apiFetch(ENDPOINTS.board(currentBoardId), {
      method: 'PATCH',
      body: JSON.stringify({ members: remaining }),
    });
    boardMembers = boardMembers.filter(m => m.id !== memberId);
    renderMemberAvatars();
    openMembersModal();
    showToast('Member removed', 'info');
  } catch {
    showToast('Could not remove member', 'error');
  }
}

// ── Comments ──────────────────────────────────────────────────
async function loadComments(taskId) {
  const list = document.getElementById('commentsList');
  if (!list) return;
  try {
    const data = await apiFetch(ENDPOINTS.comments(taskId));
    const currentUserId = getUser()?.id || null;
    list.innerHTML = data?.length
      ? data.map(c => Templates.commentItem(c, currentUserId)).join('')
      : '<p class="text-muted-sm">No comments yet.</p>';
  } catch {
    list.innerHTML = '<p class="text-muted-sm">Could not load comments.</p>';
  }
}

async function postComment(taskId) {
  const input = document.getElementById('commentInput');
  const text  = input?.value.trim();
  if (!text) return;
  input.value = '';
  try {
    await apiFetch(ENDPOINTS.comments(taskId), {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    loadComments(taskId);
  } catch {
    showToast('Could not post comment', 'error');
  }
}

async function deleteComment(commentId) {
  const taskId = currentTaskId;
  try {
    await apiFetch(ENDPOINTS.comment(taskId, commentId), { method: 'DELETE' });
    loadComments(taskId);
  } catch {
    showToast('Could not delete comment', 'error');
  }
}

// ── Load & Init ───────────────────────────────────────────────
async function loadTasks() {
  if (isGuest()) { renderBoard(); switchColTab(activeCol); return; }
  tasks = [];
  if (currentBoardId) {
    try {
      const data = await apiFetch(ENDPOINTS.board(currentBoardId));
      if (data?.tasks)   tasks        = data.tasks;
      if (data?.members) boardMembers = data.members;
      if (data?.title)   { const el = document.getElementById('boardTitle'); if (el) el.textContent = data.title; }
      if (data?.description) { const el = document.getElementById('boardDesc'); if (el) el.textContent = data.description; }
      if (data?.color)   window._boardColor = data.color;
    } catch { /* leave empty */ }
  }
  renderMemberAvatars(); renderBoard(); updateOpenCount();
  switchColTab(activeCol);
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  currentBoardId = params.get('id') ? Number(params.get('id')) : null;

  loadTasks().then(() => {
    const taskId = params.get('task_id');
    if (taskId) { const t = tasks.find(t => t.id === Number(taskId)); if (t) openTaskDetail(t.id); }
  });
  loadSidebarBoards(currentBoardId);
});
