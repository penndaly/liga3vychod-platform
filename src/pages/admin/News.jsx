import { Newspaper, Plus } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

export default function News() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Novinky</h1>
            <p className="text-sm text-slate-400 mt-0.5">Správa ligových noviniek a článkov</p>
          </div>
          <button className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
            <Plus size={16} /> Nový článok
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center">
          <Newspaper size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-400">Správa noviniek</p>
          <p className="text-xs text-slate-400 mt-1">Vytváranie a publikovanie článkov pre celú ligu aj jednotlivé kluby.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
