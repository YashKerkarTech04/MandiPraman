import { useEffect, useMemo, useState } from "react"
import { About } from "./components/About"
import { PostSheet } from "./components/PostSheet"
import { PriceBoard } from "./components/PriceBoard"
import { ReportList } from "./components/ReportList"
import { ApiError, type WriteResult } from "./api"
import { useCatalog, useMeta, usePrices, useReports, useVote } from "./hooks"
import { LANGS, useI18n, type ToastMsg } from "./i18n"
import { rememberVote, reporterId, votedKeys } from "./identity"

interface ToastState extends ToastMsg {
  href?: string
  tone?: "ok" | "bad"
}

export default function App() {
  const { t, name, lang, setLang } = useI18n()
  const catalog = useCatalog()
  const meta = useMeta()
  const prices = usePrices()
  const reports = useReports()
  const vote = useVote()

  const [crop, setCrop] = useState("")
  const [sheet, setSheet] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [voted, setVoted] = useState<string[]>(votedKeys)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(id)
  }, [toast])

  const allPrices = prices.data?.prices ?? []
  const cropsWithData = useMemo(() => {
    const seen = new Set(allPrices.map((p) => p.crop))
    return (catalog.data?.crops ?? []).filter((c) => seen.has(c.slug))
  }, [allPrices, catalog.data])

  // If the selected crop vanishes (all its reports expired), fall back to "all".
  useEffect(() => {
    if (crop && !cropsWithData.some((c) => c.slug === crop) && prices.isSuccess) setCrop("")
  }, [crop, cropsWithData, prices.isSuccess])

  const shownPrices = crop ? allPrices.filter((p) => p.crop === crop) : allPrices
  const shownReports = (reports.data?.reports ?? []).filter((r) => !crop || r.crop === crop)
  const anyDemo = (reports.data?.reports ?? []).some((r) => r.synthetic)
  const loading = catalog.isLoading || prices.isLoading
  const failed = catalog.isError || prices.isError

  function onVote(key: string, verdict: "confirm" | "dispute") {
    setPendingKey(key)
    vote.mutate(
      { key, verdict, voterId: reporterId() },
      {
        onSuccess: (r) => {
          setVoted(rememberVote(key))
          setToast({ key: "voted", href: r.explorerTx, tone: "ok" })
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 409) setVoted(rememberVote(key))
          setToast(
            err instanceof ApiError && err.status !== 0
              ? { text: err.message, tone: "bad" }
              : { key: "posting", tone: "bad" },
          )
        },
        onSettled: () => setPendingKey(null),
      },
    )
  }

  function onPosted(r: WriteResult) {
    setSheet(false)
    setToast({ key: "posted", href: r.explorerTx, tone: "ok" })
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label={t("appName")}>
            <span className="logo" aria-hidden="true">₹</span>
            <span>{t("appName")}</span>
          </a>
          <div className="lang" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button
                key={l.code}
                className={l.code === lang ? "lang-btn active" : "lang-btn"}
                onClick={() => setLang(l.code)}
                aria-pressed={l.code === lang}
                title={l.full}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <h1>{t("tagline")}</h1>
          {anyDemo && <p className="demo-banner">{t("demoBanner")}</p>}
        </section>

        {cropsWithData.length > 0 && (
          <nav className="chips" aria-label={t("crop")}>
            <button className={crop === "" ? "chip active" : "chip"} onClick={() => setCrop("")}>
              {t("allCrops")}
            </button>
            {cropsWithData.map((c) => (
              <button key={c.slug} className={crop === c.slug ? "chip active" : "chip"} onClick={() => setCrop(c.slug)}>
                {name(c)}
              </button>
            ))}
          </nav>
        )}

        {loading && <p className="status">{t("loading")}</p>}
        {failed && <p className="status bad" role="alert">{t("error")}</p>}

        {catalog.data && prices.data && <PriceBoard prices={shownPrices} catalog={catalog.data} />}

        {catalog.data && reports.data && (
          <section aria-labelledby="latest-h" className="latest">
            <h2 id="latest-h">{t("latestReports")}</h2>
            <ReportList
              reports={shownReports}
              catalog={catalog.data}
              voted={voted}
              pendingKey={pendingKey}
              ownId={reporterId()}
              onVote={onVote}
            />
          </section>
        )}

        <About meta={meta.data} />

        <footer className="footer">
          <p>{t("footer")}</p>
        </footer>
      </main>

      <button className="fab" onClick={() => setSheet(true)} disabled={!catalog.data}>
        <span aria-hidden="true">＋</span> {t("postPrice")}
      </button>

      {sheet && catalog.data && (
        <PostSheet
          catalog={catalog.data}
          defaultCrop={crop}
          onClose={() => setSheet(false)}
          onPosted={onPosted}
          onError={(msg) => setToast({ ...msg, tone: "bad" })}
        />
      )}

      {toast && (
        <div className={toast.tone === "bad" ? "toast bad" : "toast"} role="status">
          <span>{toast.key ? t(toast.key) : toast.text}</span>
          {toast.href && (
            <a href={toast.href} target="_blank" rel="noreferrer">
              {t("viewTx")} ↗
            </a>
          )}
        </div>
      )}
    </>
  )
}
