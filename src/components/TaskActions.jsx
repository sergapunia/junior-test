import { useState } from 'react'

export function TaskActions({ task, onComplete }) {
  const [mode, setMode] = useState(null)
  const [note, setNote] = useState('')

  if (task.status === 'done') {
    return (
      <p className="text-sm text-muted">
        {task.outcome === 'escalated' ? 'Эскалация' : 'Шаг выполнен'}
        {task.note ? ` · ${task.note}` : ''}
      </p>
    )
  }

  if (!mode) {
    return (
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={() => setMode('done_step')}>
          Шаг выполнен
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setMode('escalated')}>
          Эскалировать
        </button>
      </div>
    )
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        onComplete(task, mode, note.trim())
      }}
    >
      <label className="block text-sm font-semibold" htmlFor={`note-${task.id}`}>
        {mode === 'done_step' ? 'Что сделали' : 'Кому и зачем передали'}
      </label>
      <input
        id={`note-${task.id}`}
        className="field"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Комментарий"
        maxLength={180}
      />
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary">
          Подтвердить
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setMode(null)}>
          Отмена
        </button>
      </div>
    </form>
  )
}
