import type { Key, Lang } from "./i18n"

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 })
export const rupees = (n: number) => `₹${inr.format(Math.round(n))}`

export function timeAgo(ms: number, lang: Lang, t: (k: Key) => string): string {
  const diffSec = Math.round((ms - Date.now()) / 1000)
  const abs = Math.abs(diffSec)
  if (abs < 60) return t("now")
  const rtf = new Intl.RelativeTimeFormat(lang === "en" ? "en-IN" : lang === "hi" ? "hi-IN" : "mr-IN", { numeric: "auto" })
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute")
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour")
  return rtf.format(Math.round(diffSec / 86400), "day")
}

export function shortDuration(seconds: number, t: (k: Key) => string): string {
  if (seconds >= 86400) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    return `${d}${t("unitD")} ${h}${t("unitH")}`
  }
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}${t("unitH")} ${m}${t("unitM")}`
  }
  return `${Math.max(1, Math.floor(seconds / 60))}${t("unitM")}`
}

export const shortId = (id: string) => (id.length > 14 ? `${id.slice(0, 11)}…` : id)
