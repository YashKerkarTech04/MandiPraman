// A random pseudonymous id kept in this browser. No name, phone or account: it only stops
// people voting on their own report or voting twice. Not Sybil-resistant (see arkiv/schema.md).

const ID_KEY = "mandi_reporter_id"
const VOTED_KEY = "mandi_voted"

let memoryId: string | null = null
let memoryVoted: string[] = []

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("")
}

export function reporterId(): string {
  if (memoryId) return memoryId
  try {
    const saved = localStorage.getItem(ID_KEY)
    if (saved) {
      memoryId = saved
      return saved
    }
  } catch {
    /* storage blocked */
  }
  const id = `farmer_${randomHex(8)}`
  memoryId = id
  try {
    localStorage.setItem(ID_KEY, id)
  } catch {
    /* keep in memory only */
  }
  return id
}

export function votedKeys(): string[] {
  try {
    const raw = localStorage.getItem(VOTED_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    /* fall through */
  }
  return memoryVoted
}

export function rememberVote(key: string): string[] {
  const next = Array.from(new Set([...votedKeys(), key])).slice(-300)
  memoryVoted = next
  try {
    localStorage.setItem(VOTED_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
  return next
}
