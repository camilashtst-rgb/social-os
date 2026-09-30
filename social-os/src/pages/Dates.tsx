import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { daysUntil, formatDate } from '../lib/utils'
import { useAppStore } from '../store/app'
import type { ImportantDate } from '../types'

export function Dates() {
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [region, setRegion] = useState('')
  const [category, setCategory] = useState('')
  const [shouldCreate, setShouldCreate] = useState(false)
  const settings = useAppStore((s) => s.settings)

  async function load() {
    const { data } = await supabase.from('important_dates').select('*').order('date')
    setDates(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !date) return
    await supabase.from('important_dates').insert({ name, date, region: region || null, category: category || null, should_create_content: shouldCreate })
    setName(''); setDate(''); setRegion(''); setCategory(''); setShouldCreate(false)
    load()
  }

  const alertDays = settings?.alert_planning_days ?? 30
  const upcoming = dates.filter((d) => daysUntil(d.date) >= 0)

  return (
    <div style={{ maxWidth: 800 }}>
      <form onSubmit={add} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da data *" required style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Região" style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14, width: 120 }} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14, width: 120 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={shouldCreate} onChange={(e) => setShouldCreate(e.target.checked)} />
          Gerar conteúdo
        </label>
        <button type="submit" style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>+ Adicionar</button>
      </form>

      {upcoming.map((d) => {
        const days = daysUntil(d.date)
        const isAlert = days <= alertDays && d.should_create_content
        return (
          <div key={d.id} style={{ background: 'var(--white)', border: `1px solid ${isAlert ? 'var(--terracotta)' : 'var(--beige-lt)'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--caramel)', minWidth: 60 }}>
              {days}d
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: 'var(--beige-md)' }}>{formatDate(d.date)} {d.region ? `· ${d.region}` : ''} {d.category ? `· ${d.category}` : ''}</div>
            </div>
            {d.should_create_content && (
              <span style={{ fontSize: 11, fontWeight: 700, color: isAlert ? 'var(--terracotta)' : 'var(--caramel)', border: `1px solid currentColor`, borderRadius: 4, padding: '2px 6px' }}>
                CONTEÚDO
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
