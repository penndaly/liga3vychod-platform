import { ROLE_MAP } from '../../../data/roles'

export default function RoleBadge({ role }) {
  const cfg = ROLE_MAP[role] ?? { label: role, cls: 'bg-slate-200 text-slate-700' }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}
