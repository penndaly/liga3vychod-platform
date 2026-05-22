import { Target } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { TOP_SCORERS } from '../../data/placeholder'

export default function Awards() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Ocenenia & Štatistiky</h1>
          <p className="text-sm text-slate-400 mt-0.5">Najlepší strelci, asistenti a karty</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Najlepší strelci</h2>
          <div className="space-y-2">
            {TOP_SCORERS.map((s) => (
              <div key={s.rank} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <span className={`w-6 text-sm font-black ${s.rank === 1 ? 'text-yellow-500' : 'text-slate-400'}`}>{s.rank}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.club}</p>
                </div>
                <span className="text-lg font-black text-slate-900">{s.goals}</span>
                <span className="text-xs text-slate-400">gólov</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Asistenti', 'Žlté karty', 'Červené karty'].map((category) => (
            <div key={category} className="bg-white rounded-xl border border-slate-100 p-12 text-center">
              <Target size={28} className="mx-auto text-slate-200 mb-2" />
              <p className="text-sm font-bold text-slate-400">{category}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
