import { useEffect, useState } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths, isToday, isBefore, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { ContentDrawer } from '../components/contents/ContentDrawer'
import type { Content, ImportantDate } from '../types'

type ClientOption = { id: string; name: string }

const STATUS_COLORS: Record<string, string> = {
  ideia: '#8B7EC8', planejamento: '#6B9FD4', roteiro: '#5BBFAD',
  em_producao: '#E8973A', em_revisao: '#D4845A', aguardando_aprovacao: '#C4A020',
  ajustes_solicitados: '#C05050', aprovado: '#3A9E6F', agendado: '#5A8FE0',
  publicado: '#2D7D55', arquivado: '#9E9590',
}

export function Calendar() {
  const [month, setMonth] = useState(new Date())
  const [contents, setContents] = useState<Content[]>([])
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [filterClient, setFilterClient] = useState('')
  const [selected, setSelected] = useState<Content | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  async function load() {
    const [{ data: c }, { data: d }, { data: cl }] = await Promise.all([
      supabase.from('contents').select('*, client:clients(name, id)').not('publication_date', 'is', null),
      supabase.from('important_dates').select('*'),
      supabase.from('clients').select('id, name').order('name'),
    ])
    setContents(c ?? [])
    setImportantDates(d ?? [])
    setClients(cl ?? [])
  }

  useEffect(() => { load() }, [])

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = startOfMonth(month).getDay()

  const filteredContents = filterClient
    ? contents.filter((c) => c.client_id === filterClient)
    : contents

  // Conteúdos do mês visível para o painel lateral
  const monthContents = filteredContents.filter((c) => {
    if (!c.publication_date) return false
    const d = new Date(c.publication_date + 'T00:00:00')
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
  }).sort((a, b) => (a.publication_date ?? '').localeCompare(b.publication_date ?? ''))

  // Datas importantes do mês
  const monthDates = importantDates.filter((d) => {
    const dt = new Date(d.date + 'T00:00:00')
    return dt.getMonth() === month.getMonth() && dt.getFullYear() === month.getFullYear()
  })

  // Alertas: datas que precisam de conteúdo mas não têm nada agendado nos 7 dias anteriores
  const alerts = importantDates.filter((d) => {
    if (!d.should_create_content) return false
    const dt = new Date(d.date + 'T00:00:00')
    const today = new Date()
    if (isBefore(dt, today)) return false
    const windowStart = addDays(dt, -7)
    const hasContent = filteredContents.some((c) => {
      if (!c.publication_date) return false
      const cd = new Date(c.publication_date + 'T00:00:00')
      return cd >= windowStart && cd <= dt
    })
    return !hasContent
  })

  function getDayContents(day: Date) {
    return filteredContents.filter((c) => c.publication_date && isSameDay(new Date(c.publication_date + 'T00:00:00'), day))
  }

  function getDayImportantDates(day: Date) {
    return importantDates.filter((d) => isSameDay(new Date(d.date + 'T00:00:00'), day))
  }

  function isDayAlert(day: Date) {
    return alerts.some((a) => isSameDay(new Date(a.date + 'T00:00:00'), day))
  }

  const today = new Date()

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Main calendar */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <button onClick={() => setMonth(subMonths(month, 1))} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)' }}>‹</button>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, margin: 0, textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
            {format(month, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <button onClick={() => setMonth(addMonths(month, 1))} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 16, color: 'var(--text-secondary)' }}>›</button>
          <button onClick={() => setMonth(new Date())} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: 'var(--text-tertiary)' }}>Hoje</button>

          <div style={{ flex: 1 }} />

          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', outline: 'none' }}
          >
            <option value="">Todos os clientes</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Alerts bar */}
        {alerts.length > 0 && (
          <div style={{ background: '#FEF0E0', border: '1px solid #E8973A', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#C06A10' }}>
            <strong>⚠ {alerts.length} data{alerts.length > 1 ? 's' : ''} sem conteúdo agendado:</strong>{' '}
            {alerts.slice(0, 3).map((a) => a.name).join(', ')}
            {alerts.length > 3 && ` +${alerts.length - 3}`}
          </div>
        )}

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 3 }}>
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d) => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map((day) => {
            const dayContents = getDayContents(day)
            const dayDates = getDayImportantDates(day)
            const isAlert = isDayAlert(day)
            const isTodayDay = isToday(day)
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                style={{
                  minHeight: 80,
                  background: isSelected ? 'var(--caramel-lt)' : isTodayDay ? '#F5F0FF' : 'var(--bg)',
                  border: `1px solid ${isSelected ? 'var(--caramel-md)' : isTodayDay ? '#8B7EC8' : isAlert ? '#E8973A44' : 'var(--border)'}`,
                  borderRadius: 7,
                  padding: '5px 6px',
                  cursor: 'pointer',
                  transition: 'border-color 0.1s, background 0.1s',
                }}
              >
                <div style={{
                  fontSize: 12,
                  fontWeight: isTodayDay ? 700 : 400,
                  color: isTodayDay ? '#8B7EC8' : 'var(--text-secondary)',
                  marginBottom: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span>{format(day, 'd')}</span>
                  {isAlert && <span title="Data importante sem conteúdo" style={{ fontSize: 10, color: '#E8973A' }}>⚠</span>}
                </div>

                {/* Important dates dots */}
                {dayDates.map((d) => (
                  <div key={d.id} style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: 3,
                    marginBottom: 2,
                    background: d.should_create_content ? '#FEF0E0' : '#F0F4F8',
                    color: d.should_create_content ? '#C06A10' : '#4A6B8A',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {d.name}
                  </div>
                ))}

                {/* Content items */}
                {dayContents.map((c) => {
                  const color = STATUS_COLORS[c.status] ?? 'var(--caramel)'
                  return (
                    <div
                      key={c.id}
                      onClick={(e) => { e.stopPropagation(); setSelected(c) }}
                      style={{
                        background: color + '18',
                        border: `1px solid ${color}44`,
                        borderLeft: `3px solid ${color}`,
                        borderRadius: 4,
                        padding: '2px 5px',
                        fontSize: 10,
                        fontWeight: 500,
                        cursor: 'pointer',
                        marginBottom: 2,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        color: 'var(--text-primary)',
                      }}
                      title={`${c.title} — ${(c.client as any)?.name}`}
                    >
                      {c.title}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#FEF0E0', border: '1px solid #E8973A' }} /> Data com conteúdo
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#F0F4F8', border: '1px solid #6B9FD4' }} /> Data informativa
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: '#E8973A' }}>⚠</span> Data sem conteúdo agendado
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#F5F0FF', border: '1px solid #8B7EC8' }} /> Hoje
          </span>
        </div>
      </div>

      {/* Side panel */}
      <div style={{ width: 260, flexShrink: 0 }}>
        {/* Alerts / Missing content */}
        {alerts.length > 0 && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C06A10', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              ⚠ Faltam conteúdos
            </div>
            {alerts.map((a) => {
              const dt = new Date(a.date + 'T00:00:00')
              const diff = Math.round((dt.getTime() - today.getTime()) / 86400000)
              return (
                <div key={a.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: diff <= 7 ? '#C06A10' : 'var(--text-tertiary)', marginTop: 2 }}>
                    {format(dt, "d 'de' MMM", { locale: ptBR })} · {diff}d
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* This month contents */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            {format(month, 'MMMM', { locale: ptBR })} · {monthContents.length} publicações
          </div>
          {monthContents.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>Nenhuma publicação neste mês.</p>
          ) : monthContents.map((c) => {
            const dt = new Date(c.publication_date! + 'T00:00:00')
            const color = STATUS_COLORS[c.status] ?? 'var(--caramel)'
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28, marginTop: 1 }}>
                    {format(dt, 'd/M')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                      {(c.client as any)?.name}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Important dates this month */}
        {monthDates.length > 0 && (
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', marginTop: 12, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Datas do mês
            </div>
            {monthDates.map((d) => (
              <div key={d.id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</div>
                  {d.should_create_content && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#C06A10', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#FEF0E0', padding: '2px 5px', borderRadius: 3 }}>
                      Conteúdo
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                  {format(new Date(d.date + 'T00:00:00'), "d 'de' MMM", { locale: ptBR })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ContentDrawer content={selected} onClose={() => setSelected(null)} onUpdate={() => { load(); setSelected(null) }} />
    </div>
  )
}
