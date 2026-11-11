import { formatFull } from '../format.js'
import { DEMO_TODAY } from '../data.js'
import { TaskActions } from './TaskActions.jsx'

function TaskCard({ task, entry, onOpen, onComplete }) {
  const overdue = task.status === 'open' && task.due < DEMO_TODAY
  return (
    <article className="panel space-y-3 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug">{task.title}</h3>
        {overdue && <span className="rounded-full bg-act-soft px-2.5 py-1 text-xs font-semibold text-act">Срок прошёл</span>}
      </div>
      <p className="text-sm text-muted">
        <button type="button" className="font-semibold text-pine underline-offset-2 hover:underline" onClick={() => onOpen(task.personId)}>
          {entry.person.name}
        </button>
        {' · '}
        {task.assigneeRole.toLowerCase()} {task.assignee}
        {' · срок '}
        {formatFull(task.due)}
      </p>
      <TaskActions task={task} onComplete={onComplete} />
    </article>
  )
}

export function TasksView({ tasks, byId, onOpen, onComplete }) {
  const known = tasks.filter((task) => byId[task.personId])
  const open = known.filter((task) => task.status === 'open').sort((a, b) => a.due.localeCompare(b.due))
  const done = known.filter((task) => task.status === 'done').sort((a, b) => b.closedAt.localeCompare(a.closedAt))

  return (
    <div className="mt-6 space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-xl">Открытые · {open.length}</h2>
        {open.length === 0 ? (
          <p className="panel px-4 py-5 text-sm text-muted">Открытых задач нет.</p>
        ) : (
          <div className="grid gap-3">
            {open.map((task) => (
              <TaskCard key={task.id} task={task} entry={byId[task.personId]} onOpen={onOpen} onComplete={onComplete} />
            ))}
          </div>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-xl">Закрытые · {done.length}</h2>
        {done.length === 0 ? (
          <p className="text-sm text-muted">Закрытых задач нет.</p>
        ) : (
          <div className="grid gap-3">
            {done.map((task) => (
              <TaskCard key={task.id} task={task} entry={byId[task.personId]} onOpen={onOpen} onComplete={onComplete} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
