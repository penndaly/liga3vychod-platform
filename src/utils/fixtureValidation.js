import { VALID_CLUB_NAMES } from '../config/clubs-config'

const RE_DATE = /^\d{4}-\d{2}-\d{2}$/
const RE_TIME = /^\d{2}:\d{2}$/

function daysBetween(dateA, dateB) {
  return Math.abs(new Date(dateA) - new Date(dateB)) / 86400000
}

export function validateFixtures(rows) {
  const errors   = []   // blocking
  const warnings = []   // non-blocking

  // First pass: per-row field validation
  rows.forEach((row, idx) => {
    const lineNum = idx + 2 // 1-indexed + header row

    const { round, home_team, away_team, date, time } = row

    if (!round || String(round).trim() === '') {
      errors.push({ line: lineNum, field: 'round', msg: 'Stĺpec "round" je povinný' })
    } else {
      const r = Number(round)
      if (!Number.isInteger(r) || r < 1 || r > 46) {
        errors.push({ line: lineNum, field: 'round', msg: `Kolo "${round}" musí byť celé číslo 1–46` })
      }
    }

    if (!date || String(date).trim() === '') {
      errors.push({ line: lineNum, field: 'date', msg: 'Stĺpec "date" je povinný' })
    } else if (!RE_DATE.test(String(date).trim())) {
      errors.push({ line: lineNum, field: 'date', msg: `Dátum "${date}" musí byť vo formáte YYYY-MM-DD` })
    }

    if (!time || String(time).trim() === '') {
      errors.push({ line: lineNum, field: 'time', msg: 'Stĺpec "time" je povinný' })
    } else if (!RE_TIME.test(String(time).trim())) {
      errors.push({ line: lineNum, field: 'time', msg: `Čas "${time}" musí byť vo formáte HH:MM` })
    }

    if (!home_team || String(home_team).trim() === '') {
      errors.push({ line: lineNum, field: 'home_team', msg: 'Stĺpec "home_team" je povinný' })
    } else if (!VALID_CLUB_NAMES.has(String(home_team).trim())) {
      errors.push({ line: lineNum, field: 'home_team', msg: `Tím domácich "${home_team}" sa nenašiel v zozname klubov` })
    }

    if (!away_team || String(away_team).trim() === '') {
      errors.push({ line: lineNum, field: 'away_team', msg: 'Stĺpec "away_team" je povinný' })
    } else if (!VALID_CLUB_NAMES.has(String(away_team).trim())) {
      errors.push({ line: lineNum, field: 'away_team', msg: `Tím hostí "${away_team}" sa nenašiel v zozname klubov` })
    }

    if (
      home_team && away_team &&
      String(home_team).trim() === String(away_team).trim()
    ) {
      errors.push({ line: lineNum, field: 'teams', msg: 'Domáci a hostia nemôžu byť rovnaký tím' })
    }
  })

  // Second pass: cross-row schedule conflict detection
  // Only run if no critical per-row errors already (to avoid false positives)
  const clean = rows.filter((row, idx) => {
    const lineNum = idx + 2
    return !errors.some((e) => e.line === lineNum)
  })

  // Conflict: same team playing twice on the same date
  const teamDates = {}
  clean.forEach((row, idx) => {
    const lineNum = rows.indexOf(row) + 2
    const date  = String(row.date).trim()
    const home  = String(row.home_team).trim()
    const away  = String(row.away_team).trim()
    const key = (team) => `${team}__${date}`

    if (teamDates[key(home)]) {
      errors.push({ line: lineNum, field: 'schedule', msg: `${home} má dva zápasy dňa ${date}` })
    } else {
      teamDates[key(home)] = lineNum
    }

    if (teamDates[key(away)]) {
      errors.push({ line: lineNum, field: 'schedule', msg: `${away} má dva zápasy dňa ${date}` })
    } else {
      teamDates[key(away)] = lineNum
    }
  })

  // Warning: heavy schedule — team has 4+ matches within any 8-day window
  const teamFixtureDates = {}
  clean.forEach((row) => {
    const date = String(row.date).trim()
    for (const team of [String(row.home_team).trim(), String(row.away_team).trim()]) {
      if (!teamFixtureDates[team]) teamFixtureDates[team] = []
      teamFixtureDates[team].push(date)
    }
  })

  Object.entries(teamFixtureDates).forEach(([team, dates]) => {
    const sorted = [...new Set(dates)].sort()
    for (let i = 0; i <= sorted.length - 4; i++) {
      if (daysBetween(sorted[i], sorted[i + 3]) <= 8) {
        warnings.push({
          team,
          msg: `${team} má 4+ zápasy v rozmedzí 8 dní (${sorted[i]} – ${sorted[i + 3]})`,
        })
        break // one warning per team is enough
      }
    }
  })

  // Build valid fixture objects (Firestore-ready)
  const valid = rows
    .filter((row, idx) => {
      const lineNum = idx + 2
      return !errors.some((e) => e.line === lineNum)
    })
    .map((row) => ({
      round:      Number(row.round),
      home:       String(row.home_team).trim(),
      away:       String(row.away_team).trim(),
      date:       String(row.date).trim(),
      time:       String(row.time).trim(),
      venue:      row.venue ? String(row.venue).trim() : '',
      competition: row.competition ? String(row.competition).trim() : '',
      status:     'scheduled',
      homeGoals:  null,
      awayGoals:  null,
    }))

  return { valid, errors, warnings }
}
