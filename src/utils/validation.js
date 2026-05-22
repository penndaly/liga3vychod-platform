export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function isPositiveNumber(value) {
  return typeof value === 'number' && value > 0
}

export function validateMatchScore(home, away) {
  return Number.isInteger(home) && Number.isInteger(away) && home >= 0 && away >= 0
}
