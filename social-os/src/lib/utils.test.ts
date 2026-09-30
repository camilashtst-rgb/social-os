import { describe, it, expect } from 'vitest'
import { isOverdue, isDueToday, daysUntil } from './utils'
import type { Content } from '../types'

const base: Content = {
  id: '1', client_id: 'c1', idea_id: null,
  title: 'Test', format: 'reels', objective: null,
  category: null, pillar: null, headline: null,
  caption: null, script: null, briefing: null,
  publication_date: null, production_deadline: null,
  approval_deadline: null, status: 'planejamento',
  priority: 'media', responsible: null, drive_link: null,
  notes: null, entry_date: null, production_start_date: null,
  approval_sent_date: null, approved_date: null, published_date: null,
  created_at: '', updated_at: '',
}

describe('isOverdue', () => {
  it('returns true when production_deadline is past and status is early', () => {
    const content = { ...base, production_deadline: '2020-01-01', status: 'planejamento' as const }
    expect(isOverdue(content)).toBe(true)
  })

  it('returns false when status is past em_revisao', () => {
    const content = { ...base, production_deadline: '2020-01-01', status: 'aprovado' as const }
    expect(isOverdue(content)).toBe(false)
  })

  it('returns false when production_deadline is today (isDueToday handles this)', () => {
    const today = new Date().toLocaleDateString('en-CA')
    const content = { ...base, production_deadline: today, status: 'planejamento' as const }
    expect(isOverdue(content)).toBe(false)
  })
})

describe('isDueToday', () => {
  it('returns true when production_deadline is today', () => {
    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
    const content = { ...base, production_deadline: today }
    expect(isDueToday(content)).toBe(true)
  })

  it('returns false when deadline is tomorrow', () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const tomorrow = d.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
    const content = { ...base, production_deadline: tomorrow }
    expect(isDueToday(content)).toBe(false)
  })
})

describe('daysUntil', () => {
  it('returns positive number for future date', () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    const future = d.toLocaleDateString('en-CA') // YYYY-MM-DD in local time
    expect(daysUntil(future)).toBeGreaterThan(0)
  })
})
