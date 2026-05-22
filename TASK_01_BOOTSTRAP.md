# Task: Bootstrap Liga3vychod Platform

## Status: COMPLETE

## Requirements
1. React 18+ with Vite
2. React Router v6 for routing
3. Tailwind CSS with custom config matching design tokens:
   - Primary: slate-950 `#020617`
   - Surface: slate-900 `#0f172a`
   - Card: slate-800 `#1e293b`
   - Accent: green-600 `#16a34a` (active states)
   - Highlight: yellow-400 `#facc15` (borders/badges)
4. Firebase SDK (Firestore, Auth, Storage)

## Project Structure
```
src/
├── components/
│   ├── admin/
│   ├── public/
│   └── shared/
├── pages/
│   ├── admin/
│   │   └── Dashboard.jsx
│   └── public/
│       └── Home.jsx
├── services/
│   ├── firebase.js       — Firebase app init, exports auth/db/storage
│   └── api.js            — Firestore CRUD helpers
├── hooks/
│   └── useAuth.js        — AuthProvider + useAuth hook
├── utils/
│   └── validation.js
├── App.jsx               — Router with ProtectedRoute for /admin/*
├── main.jsx
└── index.css
```

## Files Created
- `package.json` — all dependencies pinned per spec
- `vite.config.js`
- `tailwind.config.js` — extended with design tokens
- `postcss.config.js`
- `index.html`
- `.env.example` — Firebase env var placeholders
- `.gitignore`
- `README.md`

## Next Steps
- Copy `.env.example` → `.env` and fill in Firebase credentials
- Run `npm install && npm run dev`
- Implement public pages (fixtures, standings, news)
- Implement admin pages (match management, team management)
