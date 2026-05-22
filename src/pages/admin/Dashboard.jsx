import { useAuth } from '../../hooks/useAuth'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-yellow-400">Admin Dashboard</h1>
        <button
          onClick={logout}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
      <p className="text-slate-400">Signed in as {user?.email}</p>
    </div>
  )
}
