import { useState } from "react"
import type { Catalog, Report } from "../api"
import { rupees, shortDuration, shortId, timeAgo } from "../format"
import { useI18n } from "../i18n"

interface Props {
  reports: Report[]
  catalog: Catalog
  voted: string[]
  pendingKey: string | null
  ownId: string
  onVote: (key: string, verdict: "confirm" | "dispute") => void
}

const PAGE = 8

export function ReportList({ reports, catalog, voted, pendingKey, ownId, onVote }: Props) {
  const { t, name, lang } = useI18n()
  const [visible, setVisible] = useState(PAGE)

  if (reports.length === 0) return <p className="empty">{t("noPrices")}</p>

  return (
    <>
      <ul className="reports">
        {reports.slice(0, visible).map((r) => {
          const done = voted.includes(r.key)
          const own = r.reporter === ownId
          const busy = pendingKey === r.key
          return (
            <li key={r.key} className={r.trusted ? "card report" : "card report disputed"}>
              <div className="report-top">
                <div>
                  <div className="report-title">
                    {name(catalog.crops.find((c) => c.slug === r.crop), r.crop)}
                    <span className="at"> · </span>
                    {name(catalog.mandis.find((m) => m.slug === r.mandi), r.mandi)}
                  </div>
                  <div className="report-sub">
                    {r.variety && <span>{r.variety} · </span>}
                    {timeAgo(r.reportedAtMs, lang, t)} · {t("reporter")} {shortId(r.reporter)}
                    {r.synthetic && <span className="badge demo-badge">{t("demoTag")}</span>}
                  </div>
                </div>
                <div className="report-price">{rupees(r.pricePerQuintal)}</div>
              </div>

              {!r.trusted && <div className="note-bad">{t("disputed")}</div>}

              <div className="report-actions">
                <span className="votes" aria-label={`${r.confirmations} ✓, ${r.disputes} ✗`}>
                  <span className="up">✓ {r.confirmations}</span>
                  <span className="down">✗ {r.disputes}</span>
                  <span className="expiry">{t("expiresIn", { t: shortDuration(r.expiresInSeconds, t) })}</span>
                </span>
                {done ? (
                  <span className="thanks">{t("voted")}</span>
                ) : own ? null : (
                  <span className="vote-buttons">
                    <button className="btn small ok" disabled={busy} onClick={() => onVote(r.key, "confirm")}>
                      {t("confirm")}
                    </button>
                    <button className="btn small bad" disabled={busy} onClick={() => onVote(r.key, "dispute")}>
                      {t("dispute")}
                    </button>
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {visible < reports.length && (
        <button className="btn ghost wide" onClick={() => setVisible((v) => v + PAGE)}>
          {t("showMore")}
        </button>
      )}
    </>
  )
}
