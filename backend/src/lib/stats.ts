export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// A report is excluded from the price median only when the community has clearly
// rejected it: at least 2 disputes AND more disputes than confirmations.
// New reports with no votes are trusted by default, so the board is useful from minute one.
export function isTrusted(confirmations: number, disputes: number): boolean {
  return !(disputes >= 2 && disputes > confirmations)
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
