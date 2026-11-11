import { DEMO_TODAY, DEPARTMENTS, PEOPLE, freshPeople } from './data.js'

const KEY = 'pervye90-demo-v1'

function validRole(role) {
  return role === 'hr' || DEPARTMENTS.some((item) => item.id === role)
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || data.version !== 1 || !Array.isArray(data.people) || !Array.isArray(data.tasks)) return null
    const sameRoster = data.people.map((person) => person.id).join() === PEOPLE.map((person) => person.id).join()
    if (!sameRoster) return null
    return {
      people: data.people.map((person) => ({
        ...person,
        overdue: Array.isArray(person.overdue) ? person.overdue : [],
      })),
      tasks: data.tasks.filter((task) => task && task.id && task.personId),
      role: validRole(data.role) ? data.role : 'hr',
    }
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, savedOn: DEMO_TODAY, ...state }))
  } catch {
    // Демо остаётся рабочим, даже если браузер не даёт записать срез.
  }
}

export function initialState() {
  return loadState() ?? { people: freshPeople(), tasks: [], role: 'hr' }
}
