import { Shield, Plus } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { CLUBS } from '../../data/placeholder'

export default function Clubs() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Kluby</h1>
            <p className="text-sm text-slate-400 mt-0.5">{CLUBS.length} klubov — Sezóna 2025/26</p>
          </div>
          <button className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
            <Plus size={16} /> Pridať klub
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CLUBS.map((club) => (
            <div
              key={club.id}
              className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-slate-500">{club.short}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{club.name}</p>
                  <span className="text-xs bg-yellow-50 text-yellow-600 border border-yellow-200 font-bold px-1.5 py-0.5 rounded">
                    Čakajúci
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield size={11} />
                <span>Profil nevyplnený</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
