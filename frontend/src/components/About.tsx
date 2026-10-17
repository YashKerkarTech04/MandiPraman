import type { Meta } from "../api"
import { useI18n } from "../i18n"

export function About({ meta }: { meta?: Meta }) {
  const { t } = useI18n()
  const steps = [
    { n: 1, title: t("step1Title"), body: t("step1Body") },
    { n: 2, title: t("step2Title"), body: t("step2Body") },
    { n: 3, title: t("step3Title"), body: t("step3Body", { h: meta?.reportTtlHours ?? 72 }) },
  ]
  return (
    <section className="about" aria-labelledby="about-h">
      <h2 id="about-h">{t("howItWorks")}</h2>
      <ol>
        {steps.map((s) => (
          <li key={s.n}>
            <span className="step-n" aria-hidden="true">{s.n}</span>
            <div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="relayer">
        {t("relayerNote")}{" "}
        {meta && (
          <a href={meta.explorerAddress} target="_blank" rel="noreferrer">
            {t("verify")} ↗
          </a>
        )}
      </p>
    </section>
  )
}
