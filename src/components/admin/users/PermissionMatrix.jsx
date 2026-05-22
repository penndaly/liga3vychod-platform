import { Check, Minus } from 'lucide-react'

const MATRIX = {
  CLUB_ADMIN: {
    Roster:   { read: true,  write: true,  delete: true,  publish: false },
    News:     { read: true,  write: true,  delete: false, publish: true  },
    Academy:  { read: true,  write: true,  delete: false, publish: false },
    Shop:     { read: true,  write: true,  delete: false, publish: false },
    Settings: { read: true,  write: false, delete: false, publish: false },
  },
}

const ACTIONS = [
  { key: 'read',    label: 'Čítať' },
  { key: 'write',   label: 'Písať' },
  { key: 'delete',  label: 'Mazať' },
  { key: 'publish', label: 'Publikovať' },
]

export default function PermissionMatrix({ role = 'CLUB_ADMIN' }) {
  const perms = MATRIX[role] ?? {}
  const resources = Object.keys(perms)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs border-b border-slate-100">
            <th className="text-left pb-3 font-bold pr-6">Zdroj</th>
            {ACTIONS.map((a) => (
              <th key={a.key} className="text-center pb-3 font-bold w-28">
                {a.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {resources.map((resource) => (
            <tr key={resource} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 font-medium text-slate-700 pr-6">{resource}</td>
              {ACTIONS.map((a) => (
                <td key={a.key} className="py-3 text-center">
                  {perms[resource][a.key] ? (
                    <Check size={14} className="inline text-green-600" strokeWidth={2.5} />
                  ) : (
                    <Minus size={14} className="inline text-slate-200" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
