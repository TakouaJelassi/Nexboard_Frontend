# NexBoard — Frontend

Vanilla JS frontend for the NexBoard Kanban application.  
No build step, no dependencies — pure HTML, CSS, and JavaScript.

## Structure

```
nexboard_frontend/
├── index.html              # Landing page
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html      # Overview, stats, recent tasks
│   ├── boards.html         # All boards
│   ├── board.html          # Kanban board (drag & drop)
│   ├── tasks.html          # My tasks / review tasks
│   ├── imprint.html
│   └── privacy.html
└── assets/
    ├── css/
    │   ├── style.css       # Entry point (imports all)
    │   ├── base.css        # Variables, reset, typography
    │   ├── components.css  # Buttons, inputs, cards, modals
    │   ├── layout.css      # Navbar, sidebar, grid, utilities
    │   ├── board.css       # Kanban columns, task cards
    │   └── pages.css       # Landing page styles
    ├── js/
    │   ├── config.js       # API base URL + ENDPOINTS
    │   ├── templates.js    # HTML template functions
    │   ├── auth.js         # Login, register, token helpers
    │   ├── main.js         # Shared utils (fetch, toast, modal, avatar)
    │   ├── dashboard.js
    │   ├── boards.js
    │   ├── board.js
    │   └── tasks.js
    ├── icons/              # SVG icons
    ├── fonts/              # Inter (self-hosted woff2)
    └── img/                # Logo, favicon
```

## Local Development

Open `index.html` directly in a browser, or use VS Code Live Server.

The API URL is set in `assets/js/config.js`:

```js
const API = 'http://127.0.0.1:8000/api';
```

Change this to your deployed backend URL before deploying the frontend.

## Deploy

Deploy as a **Static Site** on Render, GitHub Pages, or Netlify.  
Set the publish directory to `nexboard_frontend/`.

Backend repo: [nexboard_backend](../nexboard_backend/)
