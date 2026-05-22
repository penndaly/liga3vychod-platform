import AdminTopBar from './AdminTopBar'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout({ children }) {
  return (
    <div className="h-screen flex flex-col">
      <AdminTopBar />
      <div className="flex flex-1 overflow-hidden bg-slate-100">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
