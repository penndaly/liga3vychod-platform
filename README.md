# Liga 3 Vychod Platform

React + Vite platform for Liga 3 Vychod football league management.

## Setup

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Firebase project credentials:
   ```bash
   cp .env.example .env
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at http://localhost:5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint source files |

## Firebase Setup

Create a Firebase project at https://console.firebase.google.com and enable:
- **Authentication** (Email/Password provider)
- **Firestore** database
- **Storage** bucket

Copy the project config values into your `.env` file.

## Routes

| Path | Description |
|------|-------------|
| `/` | Public-facing site (fixtures, standings, news) |
| `/admin/*` | Protected admin panel |
