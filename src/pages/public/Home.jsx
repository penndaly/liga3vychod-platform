import Navbar from '../../components/public/Navbar'
import Hero from '../../components/public/Hero'
import MatchesSection from '../../components/public/MatchesSection'
import StandingsSection from '../../components/public/StandingsSection'
import NewsSection from '../../components/public/NewsSection'
import TopScorers from '../../components/public/TopScorers'
import ClubGrid from '../../components/public/ClubGrid'
import Footer from '../../components/public/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Hero />
      <MatchesSection />
      <StandingsSection />
      <NewsSection />
      <TopScorers />
      <ClubGrid />
      <Footer />
    </div>
  )
}
