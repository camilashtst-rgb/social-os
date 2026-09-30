import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isOverdue, isDueToday, isPendingApprovalTooLong, getNextAction } from '../lib/utils'
import { StatusPill } from '../components/ui/StatusPill'
import type { Content } from '../types'

export function MyDay() {
  const [contents, setContents] = useState<Content[]>([])
  const [briefing, setBriefing] = useState('')
  const [loadingBriefing, setLoadingBriefing] = useState(false)

  async function generateBriefing() {
    setLoadingBriefing(true)
    const { data } = await supabase.functions.invoke('ai-daily-briefing', { body: {} })
    setBriefing(data?.briefing ?? '')
    setLoadingBriefing(false)
  }

  useEffect(() => {
    supabase.from('contents').select('*, client:clients(name)').then(({ data }) => setContents(data ?? []))
  }, [])

  const sections = [
    { emoji: '🔴', label: 'Atrasados', items: contents.filter(isOverdue) },
    { emoji: '🟠', label: 'Fazer hoje', items: contents.filter((c) => isDueToday(c) && !isOverdue(c)) },
    { emoji: '🔵', label: 'Em produção', items: contents.filter((c) => c.status === 'em_producao') },
    { emoji: '🟡', label: 'Aguardando retorno', items: contents.filter(isPendingApprovalTooLong) },
    { emoji: '🟢', label: 'Publicado hoje', items: contents.filter((c) => c.status === 'publicado' && c.published_date?.startsWith(new Date().toLocaleDateString('en-CA'))) },
  ]

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <button onClick={generateBriefing} disabled={loadingBriefing} style={{ background: loadingBriefing ? 'var(--beige-md)' : 'var(--charcoal)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, cursor: loadingBriefing ? 'not-allowed' : 'pointer' }}>
          {loadingBriefing ? 'Gerando briefing...' : '✨ Gerar Briefing do Dia'}
        </button>
        {briefing && (
          <div style={{ marginTop: 16, background: 'var(--white)', border: '1px solid var(--caramel)', borderRadius: 8, padding: 20, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {briefing}
          </div>
        )}
      </div>

      {sections.map(({ emoji, label, items }) => (
        <section key={label} style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 10 }}>{emoji} {label}</h2>
          {items.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--beige-md)' }}>Nenhum item.</p>
          ) : items.map((c) => (
            <div key={c.id} style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--beige-md)', marginTop: 2 }}>{(c.client as any)?.name}</div>
              </div>
              <StatusPill status={c.status} />
              <span style={{ fontSize: 12, color: 'var(--caramel)' }}>{getNextAction(c.status).label}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
