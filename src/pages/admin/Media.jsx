import { Image } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

export default function Media() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Médiá</h1>
          <p className="text-sm text-slate-400 mt-0.5">Foto a video knižnica</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center">
          <Image size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-bold text-slate-400">Mediálna knižnica</p>
          <p className="text-xs text-slate-400 mt-1">Správa fotografií a videí z ligových zápasov.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
