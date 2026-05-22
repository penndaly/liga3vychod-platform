import { Trophy } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

export default function Standings() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Tabuľka</h1>
          <p className="text-sm text-slate-400 mt-0.5">Správa ligových tabuliek a zón postupu/zostupu</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center">
          <Trophy size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-400">Správa tabuľky</p>
          <p className="text-xs text-slate-400 mt-1">Prehliadka a manuálne úpravy ligového poradia.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
