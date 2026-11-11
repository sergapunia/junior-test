import { CHECKLIST_CURVE, checklistOf, DEMO_TODAY, departmentOf, HR } from './data.js'
import { addDays, daysBetween, formatDate, plural } from './format.js'

export const SCORE = {
  mentor: 30,
  blocker: 24,
  pulse: 22,
  checklistHigh: 20,
  checklistMid: 12,
  overdueHigh: 16,
  overdueMid: 10,
  silence: 18,
  act: 40,
  watch: 18,
  checklistFromDay: 14,
  mentorLateDay: 8,
  silenceFromDay: 21,
  silenceDays: 14,
  gapMid: 20,
  gapHigh: 35,
  overdueMidCount: 2,
  overdueHighCount: 4,
}

export const BANDS = {
  act: { label: 'Нужен разговор', hint: 'балл 40 и выше' },
  watch: { label: 'Наблюдать', hint: 'балл 18–39' },
  steady: { label: 'По плану', hint: 'ниже 18' },
}

export function expectedChecklistPct(days) {
  return CHECKLIST_CURVE.find((step) => days <= step.maxDay).pct
}

function bandOf(score) {
  if (score >= SCORE.act) return 'act'
  if (score >= SCORE.watch) return 'watch'
  return 'steady'
}

export function assess(person) {
  const days = daysBetween(person.hiredAt, DEMO_TODAY)
  const items = checklistOf(person.department)
  const total = items.length
  const done = person.checksDone
  const actual = total === 0 ? 100 : (done / total) * 100
  const expected = expectedChecklistPct(days)
  const gap = expected - actual
  const overdue = Array.isArray(person.overdue) ? person.overdue : []
  const signals = []

  if (days >= SCORE.mentorLateDay && !person.mentorWeek1Done) {
    signals.push({
      id: 'mentor_week1',
      weight: SCORE.mentor,
      title: 'Нет встречи с наставником на первой неделе',
      detail: `Срок был ${formatDate(addDays(person.hiredAt, 7))}. В выгрузке задача наставника не закрыта.`,
      taskTitle: `Встреча первой недели: ${person.name}`,
      assigneeKind: 'mentor',
    })
  }

  if (person.blocker) {
    signals.push({
      id: 'blocker',
      weight: SCORE.blocker,
      title: 'Открытый блокер адаптации',
      detail: person.blocker,
      taskTitle: `Снять блокер: ${person.name}`,
      assigneeKind: 'head',
    })
  }

  if (typeof person.pulse === 'number' && person.pulse <= 2 && !person.pulseTalk) {
    const quote = person.pulseNote ? `: «${person.pulseNote}»` : ''
    signals.push({
      id: 'pulse',
      weight: SCORE.pulse,
      title: 'Низкий пульс без разговора',
      detail: `Оценка ${person.pulse} из 5${quote}. Короткого разговора по ответу не было.`,
      taskTitle: `Разговор по пульсу: ${person.name}`,
      assigneeKind: 'head',
    })
  }

  if (days >= SCORE.checklistFromDay && gap >= SCORE.gapMid) {
    signals.push({
      id: 'checklist',
      weight: gap >= SCORE.gapHigh ? SCORE.checklistHigh : SCORE.checklistMid,
      title: 'Чек-лист отстаёт от срока',
      detail: `Закрыто ${done} из ${total} (${Math.round(actual)}%). К ${days}-му дню обычно около ${expected}%.`,
      taskTitle: `Догнать чек-лист: ${person.name}`,
      assigneeKind: 'mentor',
    })
  }

  if (overdue.length >= SCORE.overdueMidCount) {
    signals.push({
      id: 'overdue',
      weight: overdue.length >= SCORE.overdueHighCount ? SCORE.overdueHigh : SCORE.overdueMid,
      title: 'Просрочены задачи в Битрикс24',
      detail: `В выгрузке висят: ${overdue.join(', ')}.`,
      taskTitle: `Разобрать просрочки: ${person.name}`,
      assigneeKind: 'mentor',
    })
  }

  if (days >= SCORE.silenceFromDay && person.daysSinceManagerContact >= SCORE.silenceDays) {
    signals.push({
      id: 'silence',
      weight: SCORE.silence,
      title: 'Руководитель давно не выходил на связь',
      detail: `Последний контакт — ${plural(person.daysSinceManagerContact, ['день', 'дня', 'дней'])} назад. Человек в компании уже ${plural(days, ['день', 'дня', 'дней'])}.`,
      taskTitle: `Встреча руководителя: ${person.name}`,
      assigneeKind: 'head',
    })
  }

  signals.sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title, 'ru'))
  const score = Math.min(100, signals.reduce((sum, signal) => sum + signal.weight, 0))

  return {
    days,
    score,
    band: bandOf(score),
    signals,
    checklist: { done, total, actual: Math.round(actual), expected, gap },
  }
}

export function prevention(person) {
  const days = daysBetween(person.hiredAt, DEMO_TODAY)
  if (person.mentorWeek1Done || days >= SCORE.mentorLateDay) return null
  const due = addDays(person.hiredAt, 7)
  return {
    id: 'mentor_week1',
    title: 'Встреча первой недели ещё в сроке',
    detail: `Крайний день — ${formatDate(due)}.`,
    taskTitle: `Встреча первой недели: ${person.name}`,
    assigneeKind: 'mentor',
    due,
    daysLeft: 7 - days,
  }
}

export function closeSignal(person, signalId) {
  switch (signalId) {
    case 'mentor_week1':
      return { ...person, mentorWeek1Done: true }
    case 'blocker':
      return { ...person, blocker: null }
    case 'pulse':
      return { ...person, pulseTalk: true }
    case 'silence':
      return { ...person, daysSinceManagerContact: 0 }
    case 'overdue':
      return { ...person, overdue: [] }
    case 'checklist': {
      const days = daysBetween(person.hiredAt, DEMO_TODAY)
      const total = checklistOf(person.department).length
      const target = Math.ceil((expectedChecklistPct(days) / 100) * total)
      return { ...person, checksDone: Math.min(total, Math.max(person.checksDone, target)) }
    }
    default:
      return person
  }
}

export function assigneeOptions(person) {
  const department = departmentOf(person.department)
  const options = [
    { name: person.mentor, role: 'Наставник' },
    { name: department.head, role: 'Руководитель' },
    { name: HR.name, role: 'HR' },
  ]
  const seen = new Set()
  return options.filter((option) => {
    if (seen.has(option.name)) return false
    seen.add(option.name)
    return true
  })
}

export function preferredAssignee(person, signal, actByMentor) {
  const department = departmentOf(person.department)
  const overloaded = signal.assigneeKind === 'mentor' && (actByMentor[person.mentor] ?? 0) >= 2
  if (overloaded) return { name: department.head, role: 'Руководитель', overloaded: true }
  if (signal.assigneeKind === 'hr') return { name: HR.name, role: 'HR', overloaded: false }
  if (signal.assigneeKind === 'head') return { name: department.head, role: 'Руководитель', overloaded: false }
  return { name: person.mentor, role: 'Наставник', overloaded: false }
}
