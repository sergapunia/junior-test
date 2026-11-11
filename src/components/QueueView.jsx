import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { COMPANY, DEPARTMENTS, biggestLeak, departmentOf } from '../data.js'
import { duePhrase, joinNames, plural } from '../format.js'
import { BANDS, prevention } from '../risk.js'
import { BandPill } from './Band.jsx'

function PersonCard({ entry, tasks, open, onOpen, index }) {
  const { person, score, band, signals, days } = entry
  const hasTask = tasks.some((task) => task.personId === person.id && task.status === 'open')
  const escalated = tasks.some((task) => task.personId === person.id && task.outcome === 'escalated')

  return (
    <button
      type="button"
      className="card group rise"
      data-band={band}
      data-open={open ? 'true' : 'false'}
      style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}
      onClick={() => onOpen(person.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight">{person.name}</p>
          <p className="mt-0.5 text-sm text-muted">
            {person.position} · {person.place} · {days}-й день из 90
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-display text-2xl leading-none tabular-nums">{score}</p>
          <div className="mt-1.5 flex justify-end">
            <BandPill band={band} />
          </div>
        </div>
      </div>
      {signals.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm leading-snug">
          {signals.slice(0, 3).map((signal) => (
            <li key={signal.id}>{signal.title}</li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
        <span className="truncate text-muted">Наставник {person.mentor}</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-pine">
          Разобрать
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
      {(hasTask || escalated) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hasTask && (
            <span className="rounded-full bg-pine/10 px-2.5 py-1 text-xs font-semibold text-pine">Задача стоит</span>
          )}
          {escalated && (
            <span className="rounded-full bg-watch-soft px-2.5 py-1 text-xs font-semibold text-watch">Есть эскалация</span>
          )}
        </div>
      )}
    </button>
  )
}

function mentorPressure(visible) {
  const map = new Map()
  for (const entry of visible) {
    if (entry.band !== 'act') continue
    const names = map.get(entry.person.mentor) ?? []
    names.push(entry.person.name)
    map.set(entry.person.mentor, names)
  }
  return [...map.entries()].filter(([, names]) => names.length >= 2)
}

export function QueueView({ visible, everyone, role, tasks, openId, onOpen }) {
  const [watchOpen, setWatchOpen] = useState(false)
  const act = visible.filter((entry) => entry.band === 'act').sort((a, b) => b.score - a.score || a.days - b.days)
  const watch = visible.filter((entry) => entry.band === 'watch').sort((a, b) => b.score - a.score || a.days - b.days)
  const upcoming = visible
    .map((entry) => ({ entry, soon: prevention(entry.person) }))
    .filter((item) => item.soon)
    .sort((a, b) => a.soon.daysLeft - b.soon.daysLeft)
  const mentors = mentorPressure(visible)
  const department = departmentOf(role)
  const leak = biggestLeak()
  const early = role === 'hr' ? COMPANY.leftBefore90 : department.early
  const leavers = role === 'hr' ? COMPANY.leaversLast12Months : department.leavers
  const insight = role === 'hr'
    ? `Каждый третий ушедший не доработал до 90 дней: ${COMPANY.leftBefore90} из ${COMPANY.leaversLast12Months}. Больше всего — ${leak.label.toLocaleLowerCase('ru')} (${leak.early}).`
    : `В «${department.label}» ${department.early} из ${department.leavers} ушедших не доработали до 90 дней.`

  const kpis = [
    { id: 'now', kicker: 'Сейчас', value: String(visible.length), label: 'На испытательном' },
    { id: 'act', kicker: 'Сейчас', value: String(act.length), label: BANDS.act.label, tone: 'text-act' },
    { id: 'watch', kicker: 'Сейчас', value: String(watch.length), label: BANDS.watch.label, tone: 'text-watch' },
    { id: 'year', kicker: 'За год', value: String(early), suffix: `из ${leavers}`, label: 'Ушли раньше 90 дней' },
  ]

  const rows = DEPARTMENTS.map((item) => {
    const people = everyone.filter((entry) => entry.person.department === item.id)
    return { ...item, now: people.length, talk: people.filter((entry) => entry.band === 'act').length }
  })

  return (
    <div className="mt-6 space-y-6">
      <p className="rise max-w-3xl text-[15px] leading-relaxed" style={{ animationDelay: '40ms' }}>
        {insight}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <article key={kpi.id} className="panel rise p-4" style={{ animationDelay: `${80 + index * 40}ms` }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{kpi.kicker}</p>
            <p className={`mt-2 font-display text-3xl leading-none tabular-nums ${kpi.tone ?? ''}`}>
              {kpi.value}
              {kpi.suffix && <span className="ml-1 font-sans text-base font-semibold text-muted">{kpi.suffix}</span>}
            </p>
            <p className="mt-2 text-sm font-semibold">{kpi.label}</p>
          </article>
        ))}
      </div>

      {mentors.map(([mentor, names]) => (
        <aside key={mentor} className="panel px-4 py-3 text-sm leading-relaxed shadow-[inset_3px_0_0_var(--color-pine)]">
          {mentor} ведёт {names.length === 2 ? 'двоих' : plural(names.length, ['человек', 'человека', 'человек'])} из очереди: {joinNames(names)}.
        </aside>
      ))}

      <section className="space-y-3">
        <h2 className="font-display text-xl leading-tight">Нужен разговор</h2>
        {act.length === 0 ? (
          <div className="panel bg-steady-soft px-5 py-5">
            <p className="font-display text-lg leading-snug">Очередь пуста.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {act.map((entry, index) => (
              <PersonCard
                key={entry.person.id}
                entry={entry}
                tasks={tasks}
                open={openId === entry.person.id}
                onOpen={onOpen}
                index={index}
              />
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl leading-tight">Не сорвать</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map(({ entry, soon }) => (
              <button
                key={entry.person.id}
                type="button"
                className="card text-left"
                data-open={openId === entry.person.id ? 'true' : 'false'}
                onClick={() => onOpen(entry.person.id)}
              >
                <p className="font-semibold">{entry.person.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {entry.person.position} · {entry.person.place}
                </p>
                <p className="mt-2 text-sm font-medium text-steady">
                  Наставник {entry.person.mentor} · срок {duePhrase(soon.daysLeft)}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl leading-tight">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left"
            aria-expanded={watchOpen}
            onClick={() => setWatchOpen((value) => !value)}
          >
            Наблюдать · {watch.length}
            <ChevronDown className={`size-5 transition-transform duration-200 ${watchOpen ? 'rotate-180' : ''}`} />
          </button>
        </h2>
        {watchOpen && (
          watch.length === 0 ? (
            <p className="text-sm text-muted">В этом контуре таких нет.</p>
          ) : (
            <div className="grid gap-3">
              {watch.map((entry, index) => (
                <PersonCard
                  key={entry.person.id}
                  entry={entry}
                  tasks={tasks}
                  open={openId === entry.person.id}
                  onOpen={onOpen}
                  index={index}
                />
              ))}
            </div>
          )
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl leading-tight">Где не доживают до 90 дней</h2>
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Ранние уходы по подразделениям и текущая очередь</caption>
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Подразделение</th>
                <th className="px-4 py-3 font-semibold">Ушли до 90 дней</th>
                <th className="px-4 py-3 font-semibold">Сейчас</th>
                <th className="px-4 py-3 font-semibold">Нужен разговор</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const ratio = Math.round((row.early / row.leavers) * 100)
                const active = role === row.id
                return (
                  <tr key={row.id} className={active ? 'bg-pine/5' : undefined}>
                    <th className="px-4 py-3 font-semibold" scope="row">
                      {row.label}
                      {row.id === leak.id && (
                        <span className="ml-2 rounded-full bg-act-soft px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-act">
                          больше всего
                        </span>
                      )}
                    </th>
                    <td className="px-4 py-3">
                      <span className="tabular-nums">{row.early} из {row.leavers}</span>
                      <span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-line">
                        <span className="bar block h-full rounded-full bg-act-strong" style={{ width: `${ratio}%` }} />
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.now}</td>
                    <td className="px-4 py-3 tabular-nums">{row.talk}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
