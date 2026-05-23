import { Link, useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border-t-4 border-red-600 p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <ShieldOff size={28} className="text-red-600" />
          </div>
        </div>
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide mb-2">
          Prístup zamietnutý
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          Nemáte oprávnenie na prístup k tejto stránke klubu.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-slate-700 transition-colors"
          >
            Späť
          </button>
          <Link
            to="/admin"
            className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
