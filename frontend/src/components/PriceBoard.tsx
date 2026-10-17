import { useMemo } from "react"
import type { Catalog, Price } from "../api"
import { rupees } from "../format"
import { useI18n } from "../i18n"

interface Props {
  prices: Price[]
  catalog: Catalog
}

export function PriceBoard({ prices, catalog }: Props) {
  const { t, name } = useI18n()

  const groups = useMemo(() => {
    const map = new Map<string, Price[]>()
    for (const p of prices) map.set(p.crop, [...(map.get(p.crop) ?? []), p])
    return [...map.entries()].map(([crop, rows]) => ({
      crop,
      rows: [...rows].sort((a, b) => b.medianPricePerQuintal - a.medianPricePerQuintal),
    }))
  }, [prices])

  if (groups.length === 0) return <p className="empty">{t("noPrices")}</p>

  return (
    <div className="board">
      {groups.map(({ crop, rows }) => {
        const max = rows[0].medianPricePerQuintal
        const lowest = rows[rows.length - 1].medianPricePerQuintal
        const spread = max - lowest
        return (
          <section className="card crop-card" key={crop} aria-label={name(catalog.crops.find((c) => c.slug === crop), crop)}>
            <header className="crop-head">
              <h3>{name(catalog.crops.find((c) => c.slug === crop), crop)}</h3>
              <span className="unit">{t("perQuintal")}</span>
            </header>
            <ul className="mandi-list">
              {rows.map((p, i) => {
                const isBest = i === 0 && rows.length > 1
                return (
                  <li key={p.mandi} className={isBest ? "mandi-row best" : "mandi-row"}>
                    <div className="mandi-top">
                      <span className="mandi-name">
                        {name(catalog.mandis.find((m) => m.slug === p.mandi), p.mandi)}
                        {isBest && <span className="badge best-badge">{t("bestPrice")}</span>}
                      </span>
                      <span className="price">{rupees(p.medianPricePerQuintal)}</span>
                    </div>
                    <div className="bar" aria-hidden="true">
                      <span style={{ width: `${Math.max(8, (p.medianPricePerQuintal / max) * 100)}%` }} />
                    </div>
                    <div className="mandi-meta">
                      <span>
                        {t("range")} {rupees(p.minPricePerQuintal)} – {rupees(p.maxPricePerQuintal)}
                      </span>
                      <span>
                        {t("reportsCount", { n: p.reportCount })}
                        {p.confirmedCount > 0 && <> · {t("confirmedCount", { n: p.confirmedCount })}</>}
                      </span>
                    </div>
                    {isBest && spread > 0 && <div className="gain">{t("moreThanLowest", { n: Math.round(spread).toLocaleString("en-IN") })}</div>}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
