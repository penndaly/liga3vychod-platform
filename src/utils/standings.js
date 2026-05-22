import { CLUBS } from '../data/placeholder'

// Position → zone classification for Liga 3 Východ (14-team division)
export const ZONES = {
  1: 'promotion',   // automatic promotion
  2: 'promotion',   // automatic promotion
  13: 'playoff',    // relegation playoff
  14: 'relegation', // automatic relegation
}

export function computeStandings(fixtures = [], deductions = []) {
  // Seed all known clubs so every team appears even with 0 matches played
  const teams = {}
  CLUBS.forEach(({ name }) => {
    teams[name] = { club: name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [], deduction: 0 }
  })

  // Any club that appears in fixtures but not in the seed list still gets a row
  fixtures.forEach((m) => {
    if (m.home && !teams[m.home]) teams[m.home] = { club: m.home, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [], deduction: 0 }
    if (m.away && !teams[m.away]) teams[m.away] = { club: m.away, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [], deduction: 0 }
  })

  // Process completed matches in round order so form guide is chronological
  fixtures
    .filter((m) => m.status === 'completed' && m.homeGoals != null && m.awayGoals != null)
    .sort((a, b) => (a.round ?? 0) - (b.round ?? 0))
    .forEach((m) => {
      const home = teams[m.home]
      const away = teams[m.away]
      if (!home || !away) return

      const hg = m.homeGoals
      const ag = m.awayGoals

      home.p++; away.p++
      home.gf += hg; home.ga += ag
      away.gf += ag; away.ga += hg

      if (hg > ag) {
        home.w++; home.pts += 3; away.l++
        home.form.push('W'); away.form.push('L')
      } else if (hg < ag) {
        away.w++; away.pts += 3; home.l++
        home.form.push('L'); away.form.push('W')
      } else {
        home.d++; home.pts++; away.d++; away.pts++
        home.form.push('D'); away.form.push('D')
      }
    })

  // Apply deductions (positive value = penalty; negative = bonus)
  deductions.forEach((d) => {
    if (teams[d.club]) teams[d.club].deduction += d.points
  })

  return Object.values(teams)
    .map((t) => ({
      ...t,
      gd: t.gf - t.ga,
      finalPts: t.pts - t.deduction,
      form: t.form.slice(-5),
    }))
    .sort((a, b) => {
      if (b.finalPts !== a.finalPts) return b.finalPts - a.finalPts
      if (b.gd !== a.gd) return b.gd - a.gd
      if (b.gf !== a.gf) return b.gf - a.gf
      return a.club.localeCompare(b.club)
    })
    .map((t, i) => ({ ...t, pos: i + 1 }))
}
