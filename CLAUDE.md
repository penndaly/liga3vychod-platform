# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server at http://localhost:5173 (or next available port)
npm run build      # production build to dist/
npm run preview    # preview production build
npm run lint       # ESLint over src/
```

No test runner is configured yet.

Before running, copy `.env.example` → `.env` and fill in Firebase credentials.

## Architecture

This is a React 18 + Vite SPA for managing Liga 3 Vychod (Slovak regional football league).

**Provider hierarchy** (`main.jsx`):
```
BrowserRouter → AuthProvider → App
```
`AuthProvider` (in `src/hooks/useAuth.jsx`) must wrap the app because `App.jsx` consumes `useAuth()` inside `ProtectedRoute`. Adding new global providers goes in `main.jsx` inside `BrowserRouter`.

**Route split:**
- `/` — public-facing site (fixtures, standings, news) → `src/pages/public/`
- `/admin/*` — protected admin panel → `src/pages/admin/`, guarded by `ProtectedRoute` which redirects unauthenticated users to `/`

**Firebase layer** (`src/services/`):
- `firebase.js` — initialises the Firebase app and exports `auth`, `db`, `storage` singletons
- `api.js` — thin generic Firestore helpers (`fetchCollection`, `fetchDocument`, `createDocument`, `updateDocument`, `deleteDocument`). All writes automatically stamp `createdAt`/`updatedAt` via `serverTimestamp()`. Use these instead of calling the Firestore SDK directly in components.

**Auth** (`src/hooks/useAuth.jsx`):
Exposes `{ user, loading, login, logout }`. `loading` is `true` until Firebase resolves the initial auth state — `ProtectedRoute` returns `null` during this window to avoid a flash redirect.

## Design tokens

| Token | Class | Hex |
|-------|-------|-----|
| Background | `bg-slate-950` | `#020617` |
| Surface | `bg-slate-900` | `#0f172a` |
| Card | `bg-slate-800` | `#1e293b` |
| Active/success | `text-green-600` / `bg-green-600` | `#16a34a` |
| Badges/borders/highlights | `text-yellow-400` / `border-yellow-400` | `#facc15` |

These are extended in `tailwind.config.js` — the dark slate palette is the base, yellow-400 for highlights, green-600 for active states only.

## File conventions

- Files containing JSX must use the `.jsx` extension (not `.js`) — esbuild will fail to parse JSX in `.js` files.
- All Firebase env vars are prefixed `VITE_FIREBASE_` so Vite exposes them via `import.meta.env`.
