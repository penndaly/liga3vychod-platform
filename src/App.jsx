import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'

import Home from './pages/public/Home'
import ClubProfile from './pages/public/ClubProfile'
import PlayerProfile from './pages/public/PlayerProfile'
import FixturesPage from './pages/public/Fixtures'
import StandingsPage from './pages/public/Standings'
import NewsPage from './pages/public/News'
import ArticlePage from './pages/public/Article'
import StatsPage from './pages/public/Stats'

import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Fixtures from './pages/admin/Fixtures'
import Standings from './pages/admin/Standings'
import Clubs from './pages/admin/Clubs'
import ClubDetail from './pages/admin/ClubDetail'
import News from './pages/admin/News'
import Media from './pages/admin/Media'
import MediaAlbum from './pages/admin/MediaAlbum'
import Users from './pages/admin/Users'
import Branding from './pages/admin/Branding'
import Sponsors from './pages/admin/Sponsors'
import Awards from './pages/admin/Awards'
import Disciplinary from './pages/admin/Disciplinary'
import Referees from './pages/admin/Referees'
import Settings from './pages/admin/Settings'
import ClubDashboard from './pages/admin/ClubDashboard'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/admin/login" replace />
}

function Guard({ Page }) {
  return <ProtectedRoute><Page /></ProtectedRoute>
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin"             element={<Guard Page={Dashboard}    />} />
        <Route path="/admin/fixtures"    element={<Guard Page={Fixtures}     />} />
        <Route path="/admin/standings"   element={<Guard Page={Standings}    />} />
        <Route path="/admin/clubs"       element={<Guard Page={Clubs}        />} />
        <Route path="/admin/clubs/:clubId" element={<Guard Page={ClubDetail}  />} />
        <Route path="/admin/news"        element={<Guard Page={News}         />} />
        <Route path="/admin/media"           element={<Guard Page={Media}       />} />
        <Route path="/admin/media/:albumId"  element={<Guard Page={MediaAlbum}  />} />
        <Route path="/admin/users"       element={<Guard Page={Users}        />} />
        <Route path="/admin/branding"    element={<Guard Page={Branding}     />} />
        <Route path="/admin/sponsors"    element={<Guard Page={Sponsors}     />} />
        <Route path="/admin/awards"      element={<Guard Page={Awards}       />} />
        <Route path="/admin/disciplinary" element={<Guard Page={Disciplinary}/>} />
        <Route path="/admin/referees"    element={<Guard Page={Referees}     />} />
        <Route path="/admin/settings"    element={<Guard Page={Settings}     />} />
        <Route path="/admin/club/:clubSlug" element={<Guard Page={ClubDashboard} />} />

        <Route path="/vysledky" element={<FixturesPage />} />
        <Route path="/tabulka" element={<StandingsPage />} />
        <Route path="/novinky" element={<NewsPage />} />
        <Route path="/novinky/:slug" element={<ArticlePage />} />
        <Route path="/statistiky" element={<StatsPage />} />

        <Route path="/kluby" element={<Navigate to="/" replace />} />
        <Route path="/kluby/:clubId" element={<ClubProfile />} />
        <Route path="/kluby/:clubId/hrac/:playerId" element={<PlayerProfile />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
