import { useEffect, useMemo, useState, type FormEvent } from "react"
import { ApiError, type Catalog, type WriteResult } from "../api"
import { usePostReport } from "../hooks"
import { STATE_NAMES, useI18n, type ToastMsg } from "../i18n"
import { reporterId } from "../identity"

interface Props {
  catalog: Catalog
  defaultCrop: string
  onClose: () => void
  onPosted: (r: WriteResult) => void
  onError: (message: ToastMsg) => void
}

export function PostSheet({ catalog, defaultCrop, onClose, onPosted, onError }: Props) {
  const { t, name, lang } = useI18n()
  const post = usePostReport()
  const [crop, setCrop] = useState(defaultCrop)
  const [mandi, setMandi] = useState("")
  const [price, setPrice] = useState("")
  const [variety, setVariety] = useState("")
  const [fieldError, setFieldError] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !post.isPending && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, post.isPending])

  const mandisByState = useMemo(() => {
    const map = new Map<string, typeof catalog.mandis>()
    for (const m of catalog.mandis) map.set(m.state, [...(map.get(m.state) ?? []), m])
    return [...map.entries()]
  }, [catalog])

  async function submit(e: FormEvent) {
    e.preventDefault()
    const value = Number(price)
    if (!crop || !mandi) return setFieldError(!crop ? t("selectCrop") : t("selectMandi"))
    if (!Number.isFinite(value) || value < 50 || value > 500_000) return setFieldError(t("priceError"))
    setFieldError("")
    try {
      const result = await post.mutateAsync({
        crop,
        mandi,
        pricePerQuintal: value,
        variety: variety.trim(),
        reporterId: reporterId(),
      })
      onPosted(result)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) onError({ key: "tooFast" })
      else if (err instanceof ApiError && err.status === 400 && err.details?.length) onError({ text: err.details.join(", ") })
      else onError({ key: "posting" })
    }
  }

  return (
    <div className="overlay" onClick={() => !post.isPending && onClose()}>
      <form noValidate className="sheet" role="dialog" aria-modal="true" aria-label={t("postPrice")} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="sheet-grip" aria-hidden="true" />
        <h2>{t("postPrice")}</h2>

        <label>
          {t("crop")}
          <select value={crop} onChange={(e) => setCrop(e.target.value)} required>
            <option value="">{t("selectCrop")}</option>
            {catalog.crops.map((c) => (
              <option key={c.slug} value={c.slug}>
                {name(c)}
              </option>
            ))}
          </select>
        </label>

        <label>
          {t("mandi")}
          <select value={mandi} onChange={(e) => setMandi(e.target.value)} required>
            <option value="">{t("selectMandi")}</option>
            {mandisByState.map(([state, list]) => (
              <optgroup key={state} label={STATE_NAMES[state]?.[lang] ?? state}>
                {list.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {name(m)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          {t("price")}
          <input
            type="number"
            inputMode="numeric"
            min={50}
            max={500000}
            step="any"
            placeholder="1800"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>

        <label>
          {t("variety")}
          <input type="text" maxLength={60} value={variety} onChange={(e) => setVariety(e.target.value)} />
        </label>

        {fieldError && <p className="form-error" role="alert">{fieldError}</p>}

        <div className="sheet-actions">
          <button type="button" className="btn ghost" onClick={onClose} disabled={post.isPending}>
            {t("cancel")}
          </button>
          <button type="submit" className="btn primary" disabled={post.isPending}>
            {post.isPending ? t("submitting") : t("submit")}
          </button>
        </div>
      </form>
    </div>
  )
}
