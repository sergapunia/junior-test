import { CHECKLIST_CURVE, COMPANY } from '../data.js'
import { BANDS, SCORE } from '../risk.js'

const RULES = [
  ['Нет встречи наставника с 8-го дня', SCORE.mentor],
  ['Открытый блокер: доступ, форма, CRM', SCORE.blocker],
  ['Пульс 1–2 без разговора', SCORE.pulse],
  ['Чек-лист отстаёт на 35+ пунктов, с 14-го дня', SCORE.checklistHigh],
  ['Чек-лист отстаёт на 20–34 пункта, с 14-го дня', SCORE.checklistMid],
  ['4 и больше просроченных задач', SCORE.overdueHigh],
  ['2–3 просроченные задачи', SCORE.overdueMid],
  ['Руководитель молчит 14+ дней, с 21-го дня в компании', SCORE.silence],
]

export function RulesView({ onReset }) {
  return (
    <div className="mt-6 max-w-3xl space-y-8 text-sm leading-relaxed">
      <section className="space-y-2">
        <h2 className="font-display text-xl">Для кого</h2>
        <p>
          Для HR и руководителей склада, розницы, опта и офиса. В демо «{COMPANY.name}»: около {COMPANY.headcount} человек,
          за год {COMPANY.leftBefore90} из {COMPANY.leaversLast12Months} ушедших не доработали до 90 дней.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Сигналы</h2>
        <div className="panel overflow-hidden">
          <table className="w-full text-left">
            <caption className="sr-only">Баллы за сигналы</caption>
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Сигнал</th>
                <th className="px-4 py-3 font-semibold">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map(([label, weight]) => (
                <tr key={label} className="border-t border-line">
                  <td className="px-4 py-3">{label}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold">+{weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {BANDS.act.label}: от {SCORE.act}. {BANDS.watch.label}: от {SCORE.watch}. {BANDS.steady.label}: ниже {SCORE.watch}. Потолок — 100.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Чек-лист</h2>
        <ul className="panel divide-y divide-line">
          {CHECKLIST_CURVE.map((step) => (
            <li key={step.label} className="flex items-center justify-between px-4 py-2.5">
              <span>{step.label}</span>
              <span className="tabular-nums font-semibold">{step.pct}%</span>
            </li>
          ))}
        </ul>
      </section>

      <button type="button" className="btn btn-ghost" onClick={onReset}>
        Сбросить демо
      </button>
    </div>
  )
}
