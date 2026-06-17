/* ===========================
   NexBoard — boards.js
   =========================== */

let allBoards = [];

// ── Render ────────────────────────────────────────────────────

function renderBoardList(boards) {
  const grid = document.getElementById('boardsGrid');
  if (!grid) return;

  if (!boards.length) { grid.innerHTML = Templates.emptyBoards(); return; }

  grid.innerHTML = boards.map((b, i) => Templates.boardCard(b, i)).join('') + Templates.boardCardNew();
}

function filterBoards() {
  const q = document.getElementById('boardSearch')?.value.trim().toLowerCase() || '';
  const filtered = q ? allBoards.filter(b => b.title.toLowerCase().includes(q)) : allBoards;
  renderBoardList(filtered);
}

// ── Sidebar ───────────────────────────────────────────────────

function renderSidebarBoards(boards) {
  const el = document.getElementById('sidebarBoards');
  if (!el) return;
  if (!boards.length) { el.innerHTML = Templates.sidebarEmpty(); return; }
  el.innerHTML = boards.map((b, i) => Templates.sidebarBoard(b, i)).join('');
}

// ── Create Board ──────────────────────────────────────────────

async function createBoard() {
  const name = document.getElementById('newBoardName').value.trim();
  if (!name) { showToast('Please enter a board name', 'error'); return; }
  const desc = document.getElementById('newBoardDesc').value.trim();

  closeModal('newBoardModal');
  document.getElementById('newBoardName').value = '';
  document.getElementById('newBoardDesc').value = '';

  try {
    const created = await apiFetch(ENDPOINTS.boards(), {
      method: 'POST',
      body: JSON.stringify({ title: name, description: desc }),
    });
    if (created) {
      showToast(`Board "${name}" created!`, 'success');
      loadBoards();
    }
  } catch {
    showToast('Could not create board.', 'error');
  }
}

// ── Load ──────────────────────────────────────────────────────

async function loadBoards() {
  try {
    const data = await apiFetch(ENDPOINTS.boards());
    if (data) allBoards = data;
  } catch { allBoards = []; }

  renderBoardList(allBoards);
  renderSidebarBoards(allBoards);
}

document.addEventListener('DOMContentLoaded', loadBoards);
