import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isOverdue, isDueToday, isPendingApprovalTooLong, daysUntil, formatDate, getNextAction } from '../lib/utils'
import { CountCard } from '../components/ui/CountCard'
import { StatusPill } from '../components/ui/StatusPill'
import { useAppStore } from '../store/app'
import type { Content, ImportantDate, Settings } from '../types'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 700,
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      marginBottom: 12,
      marginTop: 0,
    }}>
      {children}
    </h2>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {children}
    </div>
  )
}

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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-tertiary)', fontSize: 14 }}>
      Carregando...
    </div>
  )

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
    <div style={{ display: 'flex', gap: 24, maxWidth: 1400 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Count cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 28 }}>
          <CountCard label="Atrasados" count={overdue.length} color="var(--terracotta)" />
          <CountCard label="Hoje" count={dueToday.length} color="#C48435" />
          <CountCard label="Aprovação" count={pendingApproval.length} color="#C4A020" />
          <CountCard label="Em produção" count={inProduction.length} color="var(--caramel)" />
          <CountCard label="Agendados" count={scheduled.length} color="#3A9E6F" />
          <CountCard label="Ideias" count={ideasCount} color="var(--text-tertiary)" />
        </div>

        {/* Actions needed */}
        <section style={{ marginBottom: 28 }}>
          <SectionTitle>Ações necessárias hoje</SectionTitle>
          {actionsNeeded.length === 0 ? (
            <Card style={{ padding: '16px 20px' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>
                Nenhuma ação urgente — tudo em dia ✓
              </p>
            </Card>
          ) : actionsNeeded.map((c) => (
            <Card key={c.id} style={{ padding: '12px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
              {isOverdue(c) && (
                <span style={{
                  background: 'var(--terracotta-lt)',
                  color: 'var(--terracotta)',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>
                  Atrasado
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {(c.client as any)?.name}
                </div>
              </div>
              <StatusPill status={c.status} />
              <span style={{ fontSize: 12, color: 'var(--caramel)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {getNextAction(c.status).label}
              </span>
            </Card>
          ))}
        </section>

        {/* Upcoming publications */}
        <section>
          <SectionTitle>Próximas publicações — 14 dias</SectionTitle>
          {upcoming14.length === 0 ? (
            <Card style={{ padding: '16px 20px' }}>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 14, margin: 0 }}>
                Nenhuma publicação nos próximos 14 dias.
              </p>
            </Card>
          ) : upcoming14.map((c) => {
            const days = daysUntil(c.publication_date!)
            const daysColor = days <= 2 ? 'var(--terracotta)' : days <= 6 ? '#C48435' : 'var(--text-secondary)'
            return (
              <Card key={c.id} style={{ padding: '10px 16px', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  minWidth: 44,
                  fontSize: 14,
                  fontWeight: 700,
                  color: daysColor,
                  fontFamily: 'var(--font-display)',
                }}>
                  {days === 0 ? 'Hoje' : `${days}d`}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)', minWidth: 90 }}>
                  {formatDate(c.publication_date!)}
                </span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.title}
                </span>
                <StatusPill status={c.status} />
              </Card>
            )
          })}
        </section>
      </div>

      {/* Right panels */}
      <div style={{ width: 272, flexShrink: 0 }}>
        {/* WIP control */}
        <Card style={{ padding: '16px 18px', marginBottom: 16 }}>
          <SectionTitle>Controle de WIP</SectionTitle>
          {[
            { label: 'Vídeos em produção', value: wipVideo, limit: wipLimit },
            { label: 'Total em produção', value: inProduction.length, limit: settings?.wip_production_limit ?? 3 },
            { label: 'Aguardando aprovação', value: pendingApproval.length, limit: settings?.wip_approval_limit ?? 3 },
          ].map(({ label, value, limit }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: value > limit ? 'var(--terracotta)' : 'var(--caramel)',
                }}>
                  {value}/{limit}
                </span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 4, height: 5 }}>
                <div style={{
                  width: `${Math.min(100, (value / limit) * 100)}%`,
                  height: '100%',
                  borderRadius: 4,
                  background: value > limit ? 'var(--terracotta)' : 'var(--caramel)',
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          ))}
        </Card>

        {/* Radar de Datas */}
        <Card style={{ padding: '16px 18px' }}>
          <SectionTitle>Radar de Datas</SectionTitle>
          {upcomingDates.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: 13, margin: 0 }}>Sem datas próximas.</p>
          ) : upcomingDates.slice(0, 6).map((d) => (
            <div key={d.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 10,
              paddingBottom: 10,
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {formatDate(d.date)}
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 8, flexShrink: 0 }}>
                <div style={{ fontWeight: 700, color: 'var(--caramel)', fontSize: 13 }}>
                  {daysUntil(d.date)}d
                </div>
                {d.should_create_content && (
                  <span style={{
                    fontSize: 9,
                    color: 'var(--terracotta)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Conteúdo
                  </span>
                )}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
