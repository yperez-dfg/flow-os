import { fromSnake, toSnake } from '../supabase'

test('fromSnake converts snake_case to camelCase', () => {
  const result = fromSnake<{ meetingDate: string }>({ meeting_date: '2026-06-01' })
  expect(result.meetingDate).toBe('2026-06-01')
})

test('toSnake converts camelCase to snake_case', () => {
  const result = toSnake({ meetingDate: '2026-06-01', doneBool: true })
  expect(result.meeting_date).toBe('2026-06-01')
  expect(result.done_bool).toBe(true)
})

test('fromSnake handles flat objects without underscores', () => {
  const result = fromSnake<{ name: string }>({ name: 'Yandel' })
  expect(result.name).toBe('Yandel')
})

test('toSnake handles already snake_case keys', () => {
  const result = toSnake({ name: 'test', stage: 'Won' })
  expect(result.name).toBe('test')
  expect(result.stage).toBe('Won')
})
