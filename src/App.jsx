import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ListChecks, MessageCircle, RotateCcw, Users } from 'lucide-react'
import { DEMO_TODAY, DEPARTMENTS, HR, freshPeople } from './data.js'
import { cx, readRoute } from './format.js'
import { assess, closeSignal } from './risk.js'
import { initialState, saveState } from './storage.js'
import { Drawer } from './components/Drawer.jsx'
import { QueueView } from './components/QueueView.jsx'
import { RosterView } from './components/RosterView.jsx'
import { RulesView } from './components/RulesView.jsx'
import { TasksView } from './components/TasksView.jsx'

const NAV = [
  { id: 'queue', label: 'Очередь', icon: MessageCircle },
  { id: 'roster', label: 'Все новички', icon: Users },
  { id: 'tasks', label: 'Задачи', icon: ListChecks },
  { id: 'rules', label: 'Как считаем', icon: BookOpen },
]

const PAGE = {
  queue: 'Кого разобрать на этой неделе',
  roster: 'Все на испытательном',
  tasks: 'Задачи по новичкам',
  rules: 'Как устроен балл',
}

export default function App() {
  const stored = useState(initialState)[0]
  const [people, setPeople] = useState(stored.people)
  const [tasks, setTasks] = useState(stored.tasks)
  const [role, setRole] = useState(stored.role)
  const [route, setRoute] = useState(readRoute)
  const [toast, setToast] = useState(null)
  const lastFocus = useRef(null)

  const assessed = useMemo(() => people.map((person) => ({ person, ...assess(person) })), [people])
  const visible = role === 'hr' ? assessed : assessed.filter((entry) => entry.person.department === role)
  const byId = useMemo(() => Object.fromEntries(assessed.map((entry) => [entry.person.id, entry])), [assessed])
  const visibleTasks = tasks.filter((task) => visible.some((entry) => entry.person.id === task.personId))
  const openCount = visibleTasks.filter((task) => task.status === 'open').length
  const actCount = visible.filter((entry) => entry.band === 'act').length
  const actByMentor = useMemo(() => {
    const map = {}
    for (const entry of assessed) {
      if (entry.band !== 'act') continue
      map[entry.person.mentor] = (map[entry.person.mentor] ?? 0) + 1
    }
    return map
  }, [assessed])

  const selected = route.personId ? byId[route.personId] ?? null : null
  const viewer = role === 'hr'
    ? { name: HR.name, hint: 'HR' }
    : { name: DEPARTMENTS.find((item) => item.id === role).head, hint: DEPARTMENTS.find((item) => item.id === role).label }

  useEffect(() => {
    saveState({ people, tasks, role })
  }, [people, tasks, role])

  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }, [route.view])

  useEffect(() => {
    document.title = `${PAGE[route.view]} — Первые 90`
  }, [route.view])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(timer)
  }, [toast])

  const go = useCallback((view, personId = null) => {
    const hash = personId ? `#${view}/${personId}` : `#${view}`
    if (window.location.hash !== hash) window.location.hash = hash
    setRoute({ view, personId })
  }, [])

  const openPerson = useCallback((id) => {
    lastFocus.current = document.activeElement
    go(readRoute().view, id)
  }, [go])

  const closePerson = useCallback(() => {
    go(readRoute().view, null)
    requestAnimationFrame(() => {
      if (lastFocus.current instanceof HTMLElement) lastFocus.current.focus()
    })
  }, [go])

  function changeRole(next) {
    setRole(next)
    if (!selected) return
    if (next !== 'hr' && selected.person.department !== next) go(route.view, null)
  }

  function notify(text) {
    setToast({ id: Date.now(), text })
  }

  function createTask(draft) {
    const exists = tasks.some((task) => task.status === 'open' && task.personId === draft.personId && task.signalId === draft.signalId)
    if (exists) {
      notify('Такая задача уже стоит.')
      return
    }
    setTasks((current) => [
      {
        id: `t${Date.now()}`,
        ...draft,
        createdAt: DEMO_TODAY,
        status: 'open',
        outcome: null,
        note: '',
        closedAt: null,
      },
      ...current,
    ])
    notify(`Задача поставлена: ${draft.assignee}.`)
  }

  function completeTask(task, outcome, note) {
    setTasks((current) => current.map((item) => (
      item.id === task.id ? { ...item, status: 'done', outcome, note, closedAt: DEMO_TODAY } : item
    )))
    if (outcome === 'escalated') {
      notify('Эскалация записана. Балл не изменился — сигнал на месте.')
      return
    }
    const person = people.find((item) => item.id === task.personId)
    const before = assess(person)
    const next = closeSignal(person, task.signalId)
    const after = assess(next)
    setPeople((current) => current.map((item) => (item.id === person.id ? next : item)))
    const leftQueue = before.band === 'act' && after.band !== 'act'
    notify(leftQueue
      ? `${person.name} больше не в очереди на эту неделю. Балл ${before.score} → ${after.score}.`
      : `${person.name}: балл ${before.score} → ${after.score}.`)
  }

  function resetDemo() {
    setPeople(freshPeople())
    setTasks([])
    setRole('hr')
    go('queue', null)
    notify('Демо возвращено к срезу 11 ноября.')
  }

  function badge(id) {
    if (id === 'queue') return actCount
    if (id === 'tasks') return openCount
    if (id === 'roster') return visible.length
    return null
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-pine px-4 py-6 text-[#f6f3ec] lg:flex">
        <button type="button" className="px-2 text-left" onClick={() => go('queue')}>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-lime">НОВИЧОК</p>
          <p className="mt-1 font-display text-[1.7rem] leading-none">Первые 90</p>
          <p className="mt-2 text-sm text-[#d5ddd8]">Адаптация в «Форварде»</p>
        </button>
        <nav className="mt-8 grid gap-1" aria-label="Разделы">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = route.view === item.id
            const count = badge(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={cx(
                  'flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold',
                  active ? 'bg-lime text-pine' : 'text-white/90 hover:bg-white/10',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {count != null && <span className="tabular-nums">{count}</span>}
              </button>
            )
          })}
        </nav>
        <div className="mt-8">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d5ddd8]">Смотрю как</p>
          <div className="mt-2 grid gap-1">
            <RoleButton active={role === 'hr'} label={HR.label} name={`${HR.name}, HR`} onClick={() => changeRole('hr')} />
            {DEPARTMENTS.map((item) => (
              <RoleButton
                key={item.id}
                active={role === item.id}
                label={item.label}
                name={item.head}
                onClick={() => changeRole(item.id)}
              />
            ))}
          </div>
        </div>
        <div className="mt-auto pt-6">
          <button type="button" className="inline-flex items-center gap-2 px-2 text-sm font-semibold text-white" onClick={resetDemo}>
            <RotateCcw className="size-4" />
            Сбросить демо
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-md lg:hidden">
          <div className="px-4 pt-3">
            <button type="button" className="text-left" onClick={() => go('queue')}>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-pine">НОВИЧОК</p>
              <p className="font-display text-lg leading-none">Первые 90</p>
            </button>
            <label className="mt-3 block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Смотрю как</span>
              <select className="field" value={role} onChange={(event) => changeRole(event.target.value)}>
                <option value="hr">{HR.name} · HR, все</option>
                {DEPARTMENTS.map((item) => (
                  <option key={item.id} value={item.id}>{item.head} · {item.label}</option>
                ))}
              </select>
            </label>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pt-3 pb-3" aria-label="Разделы">
            {NAV.map((item) => {
              const active = route.view === item.id
              const count = badge(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={cx(
                    'shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold',
                    active ? 'bg-pine text-white' : 'bg-cream text-ink shadow-[0_0_0_1px_var(--color-line)]',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}{count != null ? ` · ${count}` : ''}
                </button>
              )
            })}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <header className="rise">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {viewer.name} · {viewer.hint}
            </p>
            <h1 className="mt-2 max-w-3xl font-display text-[1.85rem] leading-[1.15] text-balance sm:text-4xl">
              {PAGE[route.view]}
            </h1>
          </header>

          {route.view === 'queue' && (
            <QueueView visible={visible} everyone={assessed} role={role} tasks={tasks} openId={route.personId} onOpen={openPerson} />
          )}
          {route.view === 'roster' && (
            <RosterView visible={visible} openId={route.personId} onOpen={openPerson} />
          )}
          {route.view === 'tasks' && (
            <TasksView tasks={visibleTasks} byId={byId} onOpen={openPerson} onComplete={completeTask} />
          )}
          {route.view === 'rules' && <RulesView onReset={resetDemo} />}

        </main>
      </div>

      {selected && (
        <Drawer
          entry={selected}
          tasks={tasks}
          actByMentor={actByMentor}
          onClose={closePerson}
          onCreate={createTask}
          onComplete={completeTask}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
          <p role="status" className="rise max-w-xl rounded-2xl bg-pine px-4 py-3 text-sm leading-relaxed text-white shadow-lg">
            {toast.text}
          </p>
        </div>
      )}
    </div>
  )
}

function RoleButton({ active, label, name, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'rounded-xl px-3 py-2 text-left',
        active ? 'bg-white/15 text-white ring-1 ring-white/30' : 'text-white/90 hover:bg-white/10',
      )}
      aria-pressed={active}
    >
      <span className="block text-sm font-semibold text-white">{label}</span>
      <span className={cx('block text-xs', active ? 'text-white/80' : 'text-white/60')}>{name}</span>
    </button>
  )
}
