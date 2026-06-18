/* ===========================
   NexBoard — templates.js
   Pure HTML template functions — no DOM access, no side effects
   Loaded after config.js, before page JS
   =========================== */

// ── Constants ─────────────────────────────────────────────────
const BOARD_COLORS = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444'];

const AVATAR_COLORS = [
  ['#7c3aed','#5b21b6'], ['#06b6d4','#0e7490'], ['#10b981','#047857'],
  ['#f59e0b','#b45309'], ['#ef4444','#b91c1c'], ['#8b5cf6','#6d28d9'],
  ['#ec4899','#be185d'], ['#14b8a6','#0f766e'],
];

const STATUS_BADGE = {
  todo:          '<span class="status-tag status-todo">To Do</span>',
  'to-do':       '<span class="status-tag status-todo">To Do</span>',
  inprogress:    '<span class="status-tag status-inprogress">In Progress</span>',
  'in-progress': '<span class="status-tag status-inprogress">In Progress</span>',
  review:        '<span class="status-tag status-review">Review</span>',
  done:          '<span class="status-tag status-done">Done</span>',
};

const PRIORITY_BADGE = {
  high:   '<span class="priority-tag priority-high">High</span>',
  medium: '<span class="priority-tag priority-medium">Medium</span>',
  low:    '<span class="priority-tag priority-low">Low</span>',
};

// ── Helpers ───────────────────────────────────────────────────
function initials(name = '') {
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function avatarStyle(index) {
  const [bg, border] = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return `background:linear-gradient(135deg,${bg},${border});`;
}

// ── Templates ─────────────────────────────────────────────────
const Templates = {

  // ── Shared: Sidebar board link ──────────────────────────────
  sidebarBoard: (b, i, activeId = null) => {
    const color  = b.color || BOARD_COLORS[i % BOARD_COLORS.length];
    const active = activeId && b.id == activeId ? ' active' : '';
    return `
      <a href="board.html?id=${b.id}" class="sidebar-item${active}">
        <span class="sidebar-board-dot" style="background:${color};"></span>
        ${b.title}
      </a>`;
  },

  sidebarEmpty: () =>
    `<span class="sidebar-empty-hint">No boards yet</span>`,

  // ── Shared: Avatar ──────────────────────────────────────────
  avatar: (name, index, size = 30, extraStyle = '') =>
    `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px;${avatarStyle(index)}${extraStyle}" title="${name}">${initials(name)}</div>`,

  avatarOverflow: (count, size = 30) =>
    `<div class="avatar avatar-overflow" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px;">+${count}</div>`,

  // ── Board card (dashboard + boards pages) ───────────────────
  boardCard: (b, index) => {
    const color = b.color || BOARD_COLORS[index % BOARD_COLORS.length];
    const total = b.ticket_count ?? b.total ?? 0;
    const todo  = b.tasks_to_do_count ?? b.todo ?? 0;
    const done  = Math.max(0, total - todo);
    const pct   = total > 0 ? Math.round(done / total * 100) : 0;
    const desc  = b.description || '';
    const members = b.member_count ?? b.members ?? 1;
    return `
      <div class="board-card" onclick="window.location.href='board.html?id=${b.id}'">
        <div class="board-card-accent" style="background:${color};"></div>
        <div class="board-card-meta">
          <span class="board-color-dot" style="background:${color};"></span>
          <span class="badge badge-done badge-xs">${done}/${total} done</span>
        </div>
        <h3 class="board-card-title">${b.title}</h3>
        ${desc ? `<p class="board-card-desc">${desc}</p>` : ''}
        <div class="board-card-stats">
          <span class="board-stat">
            <img src="../assets/icons/clipboard.svg" width="12" height="12" class="icon-muted" alt="" />
            ${total} task${total !== 1 ? 's' : ''}
          </span>
          <span class="board-stat">
            <img src="../assets/icons/users.svg" width="12" height="12" class="icon-muted" alt="" />
            ${members} member${members !== 1 ? 's' : ''}
          </span>
        </div>
        <div class="board-card-progress">
          <div class="board-card-progress-bar" style="width:${pct}%;background:${color};"></div>
        </div>
      </div>`;
  },

  boardCardNew: () => `
    <div class="board-new-card" onclick="openModal('newBoardModal')">
      <div class="board-new-icon">＋</div>
      <span>New Board</span>
    </div>`,

  emptyBoards: () => `
    <div class="empty-state">
      <img src="../assets/icons/board.svg" width="48" height="48" class="icon-muted empty-state-icon" alt="" />
      <p class="empty-state-title">No boards yet</p>
      <p class="empty-state-desc">Create your first board to get started.</p>
      <button class="btn btn-primary" onclick="openModal('newBoardModal')">
        <img src="../assets/icons/plus.svg" class="btn-icon" alt="" />
        New Board
      </button>
    </div>`,

  // ── Task table row (dashboard + tasks pages) ────────────────
  taskRow: (t, showAssignee = true) => `
    <tr onclick="window.location.href='board.html?id=${t.board}&task_id=${t.id}'" class="task-row-link">
      <td class="task-title-cell">${t.title}</td>
      <td>${STATUS_BADGE[t.status] || t.status}</td>
      <td>${PRIORITY_BADGE[t.priority] || t.priority}</td>
      <td class="task-due-cell">${formatDate(t.due_date)}</td>
      ${showAssignee ? `<td class="task-due-cell">${t.assignee?.fullname || '—'}</td>` : ''}
    </tr>`,

  taskTable: (tasks, cols = ['Title','Status','Priority','Due','Assignee']) => `
    <table class="tasks-table">
      <thead>
        <tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${tasks.map(t => Templates.taskRow(t, cols.length > 4)).join('')}
      </tbody>
    </table>`,

  emptyTasks: (msg = 'No tasks found.') => `
    <div class="empty-state empty-state-sm">
      <p class="empty-state-title">${msg}</p>
    </div>`,

  // ── Kanban task card (board page) ───────────────────────────
  taskCard: (t, assigneeName = '') => `
    <div class="task-card" draggable="true" data-id="${t.id}"
      ondragstart="onDragStart(event,${t.id})" ondragend="onDragEnd(event)"
      onclick="openTaskDetail(${t.id})">
      <div class="task-card-header">
        <span class="task-title">${t.title}</span>
        <span class="task-priority priority-${t.priority}">${t.priority}</span>
      </div>
      ${t.description ? `<p class="task-desc">${t.description}</p>` : ''}
      <div class="task-footer">
        <span class="task-due">
          <img src="../assets/icons/calendar.svg" width="11" height="11" class="icon-muted" alt="" />
          ${formatDate(t.due_date)}
        </span>
        ${assigneeName ? Templates.avatar(assigneeName, 0, 24) : ''}
      </div>
    </div>`,

  // ── Task detail modal body (board page) ─────────────────────
  taskDetailBody: (t, frontendStatus, statusLabels, columns, memberOptsHTML) => `
    <div class="task-detail-status">
      <span class="badge badge-${frontendStatus === 'done' ? 'done' : frontendStatus === 'inprogress' ? 'doing' : 'todo'}">
        ${statusLabels[frontendStatus]}
      </span>
    </div>
    ${t.description ? `<p class="task-detail-desc">${t.description}</p>` : ''}
    <hr class="divider" />
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Priority</label>
        <select class="form-input" id="detailPriority">
          ${['low','medium','high'].map(p =>
            `<option value="${p}" ${t.priority === p ? 'selected' : ''}>${p[0].toUpperCase() + p.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Due date</label>
        <input class="form-input" type="date" id="detailDue" value="${t.due_date || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Assign to</label>
        <select class="form-input" id="detailAssignee">
          <option value="">Unassigned</option>${memberOptsHTML('assignee')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Reviewer</label>
        <select class="form-input" id="detailReviewer">
          <option value="">None</option>${memberOptsHTML('reviewer')}
        </select>
      </div>
    </div>
    <hr class="divider" />
    <div class="form-group">
      <label class="form-label">Move to</label>
      <div class="chip-group">
        ${columns.map(c => `
          <button onclick="moveTask(${t.id},'${c}')"
            class="btn btn-secondary btn-sm ${frontendStatus === c ? 'btn-active-col' : ''}">
            ${statusLabels[c]}
          </button>`).join('')}
      </div>
    </div>
    <hr class="divider" />
    <div class="form-group">
      <label class="form-label">Comments</label>
      <div id="commentsList" class="comments-list"><p class="text-muted-sm">Loading…</p></div>
      <div class="comment-input-row">
        <input class="form-input input-flex" type="text" id="commentInput" placeholder="Write a comment…" onkeydown="if(event.key==='Enter')postComment(${t.id})" />
        <button class="btn btn-primary btn-sm" onclick="postComment(${t.id})">Send</button>
      </div>
    </div>`,

  // ── Member list item (board members modal) ──────────────────
  memberItem: (m, i, ownerId, currentUserId) => `
    <div class="member-item">
      ${Templates.avatar(m.fullname || m.email, i, 34)}
      <div class="member-info">
        <div class="member-name">${m.fullname || '—'}</div>
        <div class="member-email">${m.email}</div>
      </div>
      ${m.id === ownerId
        ? '<span class="member-role">Owner</span>'
        : `<span class="member-role">Member</span>${currentUserId === ownerId
            ? `<button class="btn-icon-danger" title="Remove member" onclick="removeMember(${m.id})">✕</button>`
            : ''}`}
    </div>`,

  // ── Comment item ─────────────────────────────────────────────
  commentItem: (c, currentUserId) => `
    <div class="comment-item" data-id="${c.id}">
      ${Templates.avatar(c.author || '?', 0, 28)}
      <div class="comment-body">
        <div class="comment-meta">
          <span class="comment-author">${c.author || 'Unknown'}</span>
          <span class="comment-time">${new Date(c.created_at).toLocaleDateString()}</span>
        </div>
        <p class="comment-text">${c.content}</p>
      </div>
      ${c.is_author
        ? `<button class="btn-icon-danger comment-del" title="Delete comment" onclick="deleteComment(${c.id})">✕</button>`
        : ''}
    </div>`,

};
