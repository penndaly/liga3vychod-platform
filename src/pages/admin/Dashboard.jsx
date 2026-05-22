import AdminLayout from '../../components/admin/AdminLayout'
import StatsGrid from '../../components/admin/dashboard/StatsGrid'
import LiveMatches from '../../components/admin/dashboard/LiveMatches'
import DashboardStandings from '../../components/admin/dashboard/DashboardStandings'
import ClubHealthGrid from '../../components/admin/dashboard/ClubHealthGrid'

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">TIPOS III. Liga Východ — Sezóna 2025/26</p>
        </div>

        <StatsGrid />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <LiveMatches />
          <DashboardStandings />
        </div>

        <ClubHealthGrid />
      </div>
    </AdminLayout>
  )
}
