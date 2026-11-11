import { useState } from 'react'
import { departmentOf } from '../data.js'
import { normalizeSearch } from '../format.js'
import { BANDS } from '../risk.js'
import { BandPill } from './Band.jsx'
import { ScoreRing } from './ScoreRing.jsx'

const ORDER = { act: 0, watch: 1, steady: 2 }

export function RosterView({ visible, openId, onOpen }) {
  const [query, setQuery] = useState('')
  const [band, setBand] = useState('all')
  const needle = normalizeSearch(query)
  const searched = visible.filter((entry) => {
    if (!needle) return true
    const person = entry.person
    const department = departmentOf(person.department)
    const blob = normalizeSearch([person.name, person.position, person.place, person.mentor, department.label].join(' '))
    return blob.includes(needle)
  })
  const chips = [
    { id: 'all', label: 'Все', count: searched.length },
    { id: 'act', label: BANDS.act.label, count: searched.filter((entry) => entry.band === 'act').length },
    { id: 'watch', label: BANDS.watch.label, count: searched.filter((entry) => entry.band === 'watch').length },
    { id: 'steady', label: BANDS.steady.label, count: searched.filter((entry) => entry.band === 'steady').length },
  ]
  const rows = searched
    .filter((entry) => band === 'all' || entry.band === band)
    .sort((a, b) => ORDER[a.band] - ORDER[b.band] || b.score - a.score || a.days - b.days)

  return (
    <div className="mt-6 space-y-4">
      <label className="block" htmlFor="roster-search">
        <span className="sr-only">Поиск</span>
        <input
          id="roster-search"
          className="field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Имя, магазин, наставник"
          autoComplete="off"
        />
      </label>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={band === chip.id}
            onClick={() => setBand(chip.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
              band === chip.id ? 'bg-pine text-white' : 'bg-cream text-ink shadow-[0_0_0_1px_var(--color-line)]'
            }`}
          >
            {chip.label} · {chip.count}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="panel px-4 py-5 text-sm text-muted">Никого не нашли.</p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((entry) => {
            const department = departmentOf(entry.person.department)
            return (
              <li key={entry.person.id}>
                <button
                  type="button"
                  className="card flex items-center gap-3"
                  data-band={entry.band}
                  data-open={openId === entry.person.id ? 'true' : 'false'}
                  onClick={() => onOpen(entry.person.id)}
                >
                  <ScoreRing score={entry.score} band={entry.band} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate font-semibold">{entry.person.name}</span>
                      <BandPill band={entry.band} />
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted">
                      {entry.person.position} · {department.label} · {entry.days}-й день
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
