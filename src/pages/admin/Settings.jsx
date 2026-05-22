import { Settings as SettingsIcon } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

const SECTIONS = [
  { label: 'Sezóna',       desc: 'Nastavenie aktuálnej sezóny, dátumov a kôl' },
  { label: 'Liga',          desc: 'Názov ligy, logo, kontaktné informácie' },
  { label: 'Pravidlá',      desc: 'Systém bodovania, počet postupujúcich/zostupujúcich' },
  { label: 'Notifikácie',   desc: 'E-mail a push notifikácie pre správcov' },
  { label: 'Zálohovanie',   desc: 'Export dát a zálohy databázy' },
]

export default function Settings() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Nastavenia</h1>
          <p className="text-sm text-slate-400 mt-0.5">Konfigurácia sezóny a systému</p>
        </div>
        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between hover:border-slate-200 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
              </div>
              <SettingsIcon size={16} className="text-slate-300 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
