import { COMPANY, DEPARTMENTS, PEOPLE, checklistOf } from '../src/data.js'
import { daysBetween } from '../src/format.js'
import { DEMO_TODAY } from '../src/data.js'
import { assess, closeSignal, expectedChecklistPct, prevention } from '../src/risk.js'

function fail(message) {
  console.error(message)
  process.exitCode = 1
}

const early = DEPARTMENTS.reduce((sum, item) => sum + item.early, 0)
const leavers = DEPARTMENTS.reduce((sum, item) => sum + item.leavers, 0)
if (early !== COMPANY.leftBefore90) fail(`early ${early} != ${COMPANY.leftBefore90}`)
if (leavers !== COMPANY.leaversLast12Months) fail(`leavers ${leavers} != ${COMPANY.leaversLast12Months}`)
if (COMPANY.leftBefore90 * 3 !== COMPANY.leaversLast12Months) fail('ушедшие до 90 дней — не ровно треть')
if (PEOPLE.length !== 18) fail(`people ${PEOPLE.length}`)

const ids = new Set()
for (const person of PEOPLE) {
  if (ids.has(person.id)) fail(`duplicate ${person.id}`)
  ids.add(person.id)
  const days = daysBetween(person.hiredAt, DEMO_TODAY)
  if (days < 0 || days > 90) fail(`days ${person.id} ${days}`)
  const total = checklistOf(person.department).length
  if (person.checksDone < 0 || person.checksDone > total) fail(`checks ${person.id}`)
}

if (expectedChecklistPct(14) !== 30) fail('curve 14')
if (expectedChecklistPct(15) !== 45) fail('curve 15')
if (expectedChecklistPct(90) !== 95) fail('curve 90')

const rows = PEOPLE.map((person) => ({ person, ...assess(person) }))
for (const row of [...rows].sort((a, b) => b.score - a.score || a.days - b.days)) {
  console.log(`${row.band}\t${String(row.score).padStart(3)}\t${row.person.department}\t${String(row.days).padStart(2)}д\t${row.person.name}\t${row.signals.map((signal) => signal.id).join('+') || '—'}`)
}

const act = rows.filter((row) => row.band === 'act')
const byDept = Object.fromEntries(DEPARTMENTS.map((item) => [
  item.id,
  act.filter((row) => row.person.department === item.id).length,
]))
const warehouse = byDept.warehouse
if (warehouse < 3) fail(`warehouse act ${warehouse}`)
for (const [id, count] of Object.entries(byDept)) {
  if (id !== 'warehouse' && count > warehouse) fail(`dept ${id} has more act than warehouse`)
}
if (act.length < 5) fail(`act ${act.length}`)

const leader = [...rows].sort((a, b) => b.score - a.score || a.days - b.days)[0]
if (leader.person.department !== 'warehouse') fail(`leader is ${leader.person.name}`)
const pavel = rows.find((row) => row.person.id === 'pavel')
if (!pavel.signals.some((signal) => signal.id === 'mentor_week1')) fail('pavel mentor')
if (!pavel.signals.some((signal) => signal.id === 'blocker')) fail('pavel blocker')
const fixed = assess(closeSignal(pavel.person, 'mentor_week1'))
if (fixed.score >= pavel.score) fail('score did not drop')
if (fixed.signals.some((signal) => signal.id === 'mentor_week1')) fail('mentor signal stayed')
if (pavel.band === 'act' && fixed.band === 'act') fail('pavel stayed in the weekly queue')

const upcoming = PEOPLE.filter((person) => prevention(person)).map((person) => person.id).sort()
if (upcoming.join() !== 'ilya,yana') fail(`upcoming ${upcoming.join()}`)

if (process.exitCode) process.exit(process.exitCode)
console.log('check ok')
