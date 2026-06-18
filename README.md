<div align="center">

<img src="assets/img/logo.svg" alt="NexBoard" width="200" />

The frontend for NexBoard — a full-stack Kanban board application.

[![License: MIT](https://img.shields.io/badge/License-MIT-7c3aed.svg)](LICENSE)

**[Live Demo](https://nexboard-frontend.onrender.com)** &nbsp;·&nbsp; **[API Docs](https://nexboard-backend-ld7s.onrender.com/api/docs/)**

> The backend runs on Render's free tier and may take ~30s to wake up on first visit.

</div>

---

## Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Language | Vanilla JavaScript (ES6+)   |
| Markup   | HTML5                       |
| Styles   | CSS3 (modular, no framework)|
| Auth     | Token-based (DRF backend)   |
| Fonts    | Inter (self-hosted)         |

---

## Structure

```
nexboard_frontend/
├── index.html              # Landing page
├── pages/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── boards.html
│   ├── board.html
│   ├── tasks.html
│   ├── imprint.html
│   └── privacy.html
└── assets/
    ├── css/
    │   ├── reset.css
    │   ├── variables.css
    │   ├── layout.css
    │   ├── components.css
    │   └── animations.css
    ├── js/
    │   ├── config.js       # API endpoints
    │   ├── templates.js    # HTML template functions
    │   ├── auth.js         # Login / register
    │   ├── main.js         # Shared utilities
    │   ├── dashboard.js
    │   ├── boards.js
    │   ├── board.js
    │   └── tasks.js
    ├── icons/              # SVG icons
    └── fonts/              # Inter (self-hosted)
```

---

## Local Setup

No build step required. Open `index.html` directly in a browser,  
or serve with VS Code Live Server / any static file server.

Make sure the backend is running at `http://127.0.0.1:8000/api/`  
(see the [backend repository](https://nexboard-backend-ld7s.onrender.com/api/docs/) for API docs).

Before deploying, update the API URL in [`assets/js/config.js`](assets/js/config.js):

```js
const API = 'https://your-backend.onrender.com/api';
```

---

## Deploy

Point any static hosting (GitHub Pages, Render Static Site, Netlify) to this folder.  
No build command needed — everything is plain HTML/CSS/JS.

---

## License

MIT License — see the [LICENSE](LICENSE) file for details.

## Contact

Takoua Jelassi — [takoua.jelassi@gmail.com](mailto:takoua.jelassi@gmail.com)
