import { Users, Plus } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

const ROLES = ['Superadmin', 'Liga Admin', 'Club Admin', 'Club Editor', 'Referee', 'Viewer']

export default function UsersPage() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">Používatelia & Oprávnenia</h1>
            <p className="text-sm text-slate-400 mt-0.5">Správa prístupu — 6 úrovní oprávnení</p>
          </div>
          <button className="flex items-center gap-2 bg-yellow-400 text-slate-950 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-yellow-300 transition-colors">
            <Plus size={16} /> Pozvať používateľa
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ROLES.map((role) => (
            <div key={role} className="bg-white rounded-xl border border-slate-100 p-4">
              <p className="text-sm font-bold text-slate-900">{role}</p>
              <p className="text-xs text-slate-400 mt-1">0 používateľov</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center">
          <Users size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-400">Správa používateľov</p>
          <p className="text-xs text-slate-400 mt-1">Pridávanie a správa prístupu pre adminov, editorov a rozhodcov.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
