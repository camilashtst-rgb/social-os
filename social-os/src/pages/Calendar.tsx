import { useEffect, useState } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { getStatusColor } from '../lib/utils'
import { ContentDrawer } from '../components/contents/ContentDrawer'
import type { Content } from '../types'

export function Calendar() {
  const [month, setMonth] = useState(new Date())
  const [contents, setContents] = useState<Content[]>([])
  const [selected, setSelected] = useState<Content | null>(null)

  async function load() {
    const { data } = await supabase.from('contents').select('*, client:clients(name)').not('publication_date', 'is', null)
    setContents(data ?? [])
  }

  useEffect(() => { load() }, [])

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = startOfMonth(month).getDay()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <button onClick={() => setMonth(subMonths(month, 1))} style={{ background: 'none', border: '1px solid var(--beige-lt)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>‹</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: 0, textTransform: 'capitalize' }}>
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button onClick={() => setMonth(addMonths(month, 1))} style={{ background: 'none', border: '1px solid var(--beige-lt)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', padding: '4px 0' }}>{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const dayContents = contents.filter((c) => c.publication_date && isSameDay(new Date(c.publication_date + 'T00:00:00'), day))
          return (
            <div key={day.toISOString()} style={{ minHeight: 80, background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 6, padding: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--beige-md)', marginBottom: 4 }}>{format(day, 'd')}</div>
              {dayContents.map((c) => (
                <div key={c.id} onClick={() => setSelected(c)} style={{ background: getStatusColor(c.status) + '22', border: `1px solid ${getStatusColor(c.status)}`, borderRadius: 4, padding: '2px 4px', fontSize: 10, cursor: 'pointer', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {c.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <ContentDrawer content={selected} onClose={() => setSelected(null)} onUpdate={() => { load(); setSelected(null) }} />
    </div>
  )
}
