import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isOverdue, isDueToday, isPendingApprovalTooLong, daysUntil, formatDate, getNextAction } from '../lib/utils'
import { CountCard } from '../components/ui/CountCard'
import { StatusPill } from '../components/ui/StatusPill'
import { useAppStore } from '../store/app'
import type { Content, ImportantDate, Settings } from '../types'

export function Home() {
  const [contents, setContents] = useState<Content[]>([])
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [ideasCount, setIdeasCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { settings, setSettings, setNotificationCount } = useAppStore()

  useEffect(() => {
    async function load() {
      try {
        const [{ data: c }, { data: d }, { data: s }, { count: ideasTotal }] = await Promise.all([
          supabase.from('contents').select('*, client:clients(name)').order('publication_date'),
          supabase.from('important_dates').select('*').order('date'),
          supabase.from('settings').select('*').limit(1).maybeSingle(),
          supabase.from('ideas').select('id', { count: 'exact', head: true }),
        ])
        setContents(c ?? [])
        setDates(d ?? [])
        if (s) setSettings(s as Settings)
        setIdeasCount(ideasTotal ?? 0)

        const overdue = (c ?? []).filter(isOverdue).length
        const pending = (c ?? []).filter((item) => isPendingApprovalTooLong(item, s?.alert_approval_days ?? 2)).length
        setNotificationCount(overdue + pending)
      } catch (err) {
        console.error('Home load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: 40, color: 'var(--beige-md)' }}>Carregando...</div>

  const overdue = contents.filter(isOverdue)
  const dueToday = contents.filter(isDueToday)
  const pendingApproval = contents.filter((c) => c.status === 'aguardando_aprovacao')
  const inProduction = contents.filter((c) => c.status === 'em_producao')
  const scheduled = contents.filter((c) => c.status === 'agendado')
  const wipVideo = inProduction.filter((c) => c.format === 'reels' || c.format === 'video').length
  const wipLimit = settings?.wip_video_limit ?? 2
  const upcoming14 = contents.filter((c) => c.publication_date && daysUntil(c.publication_date) <= 14 && daysUntil(c.publication_date) >= 0)
  const upcomingDates = dates.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 60)
  const actionsNeeded = [...overdue, ...dueToday.filter((c) => !overdue.includes(c))]

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 1 }}>
        {/* Count cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 24 }}>
          <CountCard label="Atrasados" count={overdue.length} color="var(--terracotta)" />
          <CountCard label="Fazer hoje" count={dueToday.length} color="#C48435" />
          <CountCard label="Aprovação" count={pendingApproval.length} color="#C4A835" />
          <CountCard label="Em produção" count={inProduction.length} color="var(--caramel)" />
          <CountCard label="Agendados" count={scheduled.length} color="#3A9E8F" />
          <CountCard label="Ideias" count={ideasCount} color="var(--beige-md)" />
        </div>

        {/* Actions needed */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 12 }}>Ações necessárias hoje</h2>
          {actionsNeeded.length === 0 ? (
            <p style={{ color: 'var(--beige-md)', fontSize: 14 }}>Nenhuma ação urgente.</p>
          ) : actionsNeeded.map((c) => (
            <div key={c.id} style={{
              background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8,
              padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {isOverdue(c) && <span style={{ color: 'var(--terracotta)', fontSize: 12, fontWeight: 700 }}>ATRASADO</span>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--beige-md)' }}>{(c.client as any)?.name}</div>
              </div>
              <StatusPill status={c.status} />
              <span style={{ fontSize: 12, color: 'var(--caramel)' }}>{getNextAction(c.status).label}</span>
            </div>
          ))}
        </section>

        {/* Upcoming publications */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 12 }}>Próximas publicações — 14 dias</h2>
          {upcoming14.length === 0 ? (
            <p style={{ color: 'var(--beige-md)', fontSize: 14 }}>Nenhuma publicação nos próximos 14 dias.</p>
          ) : upcoming14.map((c) => {
            const days = daysUntil(c.publication_date!)
            const daysColor = days <= 2 ? 'var(--terracotta)' : days <= 6 ? '#C48435' : 'var(--charcoal)'
            return (
              <div key={c.id} style={{
                background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8,
                padding: '10px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 13, color: daysColor, fontWeight: 600, minWidth: 60 }}>
                  {days === 0 ? 'Hoje' : `${days}d`}
                </span>
                <span style={{ fontSize: 13, color: 'var(--beige-md)', minWidth: 100 }}>
                  {formatDate(c.publication_date!)}
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>{c.title}</span>
                <StatusPill status={c.status} />
              </div>
            )
          })}
        </section>
      </div>

      {/* Right panels */}
      <div style={{ width: 280, flexShrink: 0 }}>
        {/* WIP control */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>Controle de WIP</h3>
          {[
            { label: 'Vídeos em produção', value: wipVideo, limit: wipLimit },
            { label: 'Total em produção', value: inProduction.length, limit: settings?.wip_production_limit ?? 3 },
            { label: 'Aguardando aprovação', value: pendingApproval.length, limit: settings?.wip_approval_limit ?? 3 },
          ].map(({ label, value, limit }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{label}</span>
                <span style={{ color: value > limit ? 'var(--terracotta)' : 'var(--caramel)', fontWeight: 600 }}>
                  {value}/{limit}
                </span>
              </div>
              <div style={{ background: 'var(--beige-lt)', borderRadius: 4, height: 6 }}>
                <div style={{
                  width: `${Math.min(100, (value / limit) * 100)}%`, height: '100%', borderRadius: 4,
                  background: value > limit ? 'var(--terracotta)' : 'var(--caramel)',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Radar de Datas */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>Radar de Datas</h3>
          {upcomingDates.length === 0 ? (
            <p style={{ color: 'var(--beige-md)', fontSize: 13 }}>Sem datas próximas.</p>
          ) : upcomingDates.slice(0, 6).map((d) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: 'var(--beige-md)' }}>{formatDate(d.date)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--caramel)' }}>{daysUntil(d.date)}d</div>
                {d.should_create_content && (
                  <span style={{ fontSize: 10, color: 'var(--terracotta)', fontWeight: 600 }}>CONTEÚDO</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
