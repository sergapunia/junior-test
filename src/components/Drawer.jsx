import { useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { DEMO_TODAY, checklistOf, departmentOf } from '../data.js'
import { addDays, duePhrase, formatDate, formatFull, plural } from '../format.js'
import { assigneeOptions, preferredAssignee, prevention } from '../risk.js'
import { BandPill } from './Band.jsx'
import { ScoreRing } from './ScoreRing.jsx'
import { TaskActions } from './TaskActions.jsx'

export function Drawer({ entry, tasks, actByMentor, onClose, onCreate, onComplete }) {
  const person = entry.person
  const department = departmentOf(person.department)
  const items = checklistOf(person.department)
  const titleId = useId()
  const closeRef = useRef(null)
  const top = entry.signals[0] ?? null
  const upcoming = prevention(person)
  const signal = top ?? upcoming
  const signalKey = signal ? `${person.id}:${signal.id}` : 'none'
  const preferred = signal ? preferredAssignee(person, signal, actByMentor) : null
  const options = assigneeOptions(person)
  const [formKey, setFormKey] = useState(signalKey)
  const [title, setTitle] = useState(signal?.taskTitle ?? '')
  const [assignee, setAssignee] = useState(preferred?.name ?? '')
  const [due, setDue] = useState(addDays(DEMO_TODAY, 2))
  const [error, setError] = useState('')

  if (formKey !== signalKey) {
    setFormKey(signalKey)
    setTitle(signal?.taskTitle ?? '')
    setAssignee(preferred?.name ?? '')
    setDue(addDays(DEMO_TODAY, 2))
    setError('')
  }

  const openTask = signal
    ? tasks.find((task) => task.status === 'open' && task.personId === person.id && task.signalId === signal.id)
    : null
  const history = tasks.filter((task) => task.personId === person.id && task !== openTask)

  useEffect(() => {
    closeRef.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const mentorLine = person.mentorWeek1Done
    ? 'Встреча первой недели была'
    : entry.days >= 8
      ? 'Встреча первой недели не закрыта'
      : `Срок встречи ${duePhrase(7 - entry.days)}`

  const contactLine = person.daysSinceManagerContact === 0
    ? 'Контакт сегодня'
    : `Контакт ${plural(person.daysSinceManagerContact, ['день', 'дня', 'дней'])} назад`

  function submit(event) {
    event.preventDefault()
    const nextTitle = title.trim()
    if (!nextTitle) {
      setError('Нужно название задачи.')
      return
    }
    if (due < DEMO_TODAY) {
      setError('Срок не раньше 11 ноября.')
      return
    }
    const chosen = options.find((option) => option.name === assignee) ?? options[0]
    onCreate({
      personId: person.id,
      signalId: signal.id,
      title: nextTitle,
      assignee: chosen.name,
      assigneeRole: chosen.role,
      due,
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center lg:justify-end">
      <div className="backdrop absolute inset-0 bg-[rgba(28,25,21,0.46)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="drawer-panel relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-cream shadow-2xl lg:h-dvh lg:max-h-none lg:max-w-[460px] lg:rounded-none"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line lg:hidden" />
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              {department.label} · {person.place}
            </p>
            <h2 id={titleId} className="mt-1 font-display text-2xl leading-tight">{person.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {person.position} · принят {formatDate(person.hiredAt)} · {person.bitrixId}
            </p>
          </div>
          <button ref={closeRef} type="button" className="rounded-full p-2 hover:bg-white" onClick={onClose} aria-label="Закрыть">
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
          <div className="flex items-center gap-4">
            <ScoreRing score={entry.score} band={entry.band} />
            <div>
              <BandPill band={entry.band} />
              <p className="mt-2 text-sm leading-relaxed">
                {entry.days}-й день из 90. Испытательный до {formatDate(addDays(person.hiredAt, 90))}, осталось {plural(Math.max(0, 90 - entry.days), ['день', 'дня', 'дней'])}.
              </p>
            </div>
          </div>

          <div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="bar h-full rounded-full bg-pine" style={{ width: `${Math.min(100, (entry.days / 90) * 100)}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-muted">
              <span>0</span>
              <span>7</span>
              <span>30</span>
              <span>60</span>
              <span>90</span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_0_0_1px_var(--color-line)]">
              <dt className="text-xs text-muted">Наставник</dt>
              <dd className="mt-1 font-semibold">{person.mentor}</dd>
              <dd className="text-xs text-muted">{mentorLine}</dd>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_0_0_1px_var(--color-line)]">
              <dt className="text-xs text-muted">Пульс</dt>
              <dd className="mt-1 flex items-center gap-1" aria-label={person.pulse == null ? 'Нет ответа' : `Пульс ${person.pulse} из 5`}>
                {[1, 2, 3, 4, 5].map((dot) => (
                  <span key={dot} className={`size-2 rounded-full ${person.pulse != null && dot <= person.pulse ? 'bg-pine' : 'bg-line'}`} />
                ))}
              </dd>
              <dd className="text-xs text-muted">{person.pulse == null ? 'Нет ответа' : `${person.pulse} из 5`}</dd>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_0_0_1px_var(--color-line)]">
              <dt className="text-xs text-muted">Руководитель</dt>
              <dd className="mt-1 font-semibold">{department.head}</dd>
              <dd className="text-xs text-muted">{contactLine}</dd>
            </div>
            <div className="rounded-2xl bg-white px-3 py-3 shadow-[0_0_0_1px_var(--color-line)]">
              <dt className="text-xs text-muted">Просрочки</dt>
              <dd className="mt-1 font-semibold tabular-nums">{person.overdue.length}</dd>
              <dd className="text-xs text-muted">{person.overdue.length ? 'в выгрузке задач' : 'нет'}</dd>
            </div>
          </dl>

          <details className="rounded-2xl bg-white px-3 py-3 shadow-[0_0_0_1px_var(--color-line)]">
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
              Чек-лист · {entry.checklist.done} из {entry.checklist.total}
              <span className="text-xs font-medium text-muted">{entry.checklist.actual}% при обычных {entry.checklist.expected}%</span>
            </summary>
            <ul className="mt-3 space-y-1.5 text-sm">
              {items.map((item, index) => {
                const ready = index < person.checksDone
                return (
                  <li key={item} className={ready ? 'text-ink' : 'text-muted'}>
                    <span className="mr-2 inline-block w-4">{ready ? '✓' : '·'}</span>
                    {item}
                  </li>
                )
              })}
            </ul>
          </details>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Что попало в балл</h3>
            {entry.signals.length === 0 ? (
              <p className="text-sm leading-relaxed">
                Срывов нет. Задачу ставить не из чего — и это нормальный исход, не пустой экран.
              </p>
            ) : (
              <ol className="space-y-2">
                {entry.signals.map((item) => (
                  <li key={item.id} className="rounded-2xl bg-white px-3 py-3 shadow-[0_0_0_1px_var(--color-line)]">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">{item.title}</p>
                      <span className="shrink-0 text-xs tabular-nums text-muted">+{item.weight}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
                  </li>
                ))}
              </ol>
            )}
            {!top && upcoming && (
              <div className="rounded-2xl bg-steady-soft px-3 py-3 text-sm leading-relaxed">
                <p className="font-semibold">{upcoming.title}</p>
                <p className="mt-1">{upcoming.detail}</p>
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Задачи по человеку</h3>
              <ul className="space-y-2 text-sm">
                {history.map((task) => (
                  <li key={task.id} className="rounded-2xl bg-white px-3 py-3 shadow-[0_0_0_1px_var(--color-line)]">
                    <p className="font-semibold">{task.title}</p>
                    <p className="mt-1 text-muted">
                      {task.assignee} · {formatFull(task.due)} · {task.status === 'open' ? 'открыта' : task.outcome === 'escalated' ? 'эскалация' : 'шаг выполнен'}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {signal && (
            <div className="rounded-2xl bg-white px-3 py-4 shadow-[0_0_0_1px_var(--color-line)]">
              {openTask ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Уже стоит: {openTask.title}</p>
                  <TaskActions task={openTask} onComplete={onComplete} />
                </div>
              ) : (
                <form className="space-y-3" onSubmit={submit}>
                  <p className="text-sm font-semibold">{top ? 'Поставить задачу' : 'Поставить встречу'}</p>
                  <label className="block text-xs font-semibold text-muted" htmlFor="task-title">
                    Название
                    <input id="task-title" className="field mt-1" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} />
                  </label>
                  <label className="block text-xs font-semibold text-muted" htmlFor="task-owner">
                    Исполнитель
                    <select id="task-owner" className="field mt-1" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                      {options.map((option) => (
                        <option key={option.name} value={option.name}>
                          {option.name} · {option.role === 'HR' ? 'HR' : option.role.toLocaleLowerCase('ru')}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-muted" htmlFor="task-due">
                    Срок · {formatFull(due)}
                    <input id="task-due" className="field mt-1" type="date" min={DEMO_TODAY} value={due} onChange={(event) => setDue(event.target.value)} />
                  </label>
                  {error && <p className="text-sm font-medium text-act">{error}</p>}
                  <button type="submit" className="btn btn-primary w-full">Поставить задачу</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
