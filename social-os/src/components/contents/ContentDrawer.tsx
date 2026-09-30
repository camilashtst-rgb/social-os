import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getNextAction } from '../../lib/utils'
import { StatusPill } from '../ui/StatusPill'
import { ContentChecklist } from './ContentChecklist'
import type { Content, ContentChecklist as ChecklistType, ContentHistory, ContentStatus } from '../../types'

interface Props { content: Content | null; onClose: () => void; onUpdate: () => void }

export function ContentDrawer({ content, onClose, onUpdate }: Props) {
  const [checklist, setChecklist] = useState<ChecklistType[]>([])
  const [history, setHistory] = useState<ContentHistory[]>([])
  const [tab, setTab] = useState<'detalhes' | 'checklist' | 'historico'>('detalhes')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!content) return
    setTitle(content.title)
    setNotes(content.notes ?? '')
    supabase.from('content_checklist').select('*').eq('content_id', content.id).then(({ data }) => setChecklist(data ?? []))
    supabase.from('content_history').select('*').eq('content_id', content.id).order('created_at', { ascending: false }).then(({ data }) => setHistory(data ?? []))
  }, [content])

  if (!content) return null

  async function save() {
    await supabase.from('contents').update({ title, notes }).eq('id', content!.id)
    onUpdate()
  }

  async function changeStatus(newStatus: ContentStatus) {
    await supabase.from('contents').update({ status: newStatus }).eq('id', content!.id)
    onUpdate()
  }

  const STATUS_OPTIONS: ContentStatus[] = [
    'ideia','planejamento','roteiro','em_producao','em_revisao',
    'aguardando_aprovacao','ajustes_solicitados','aprovado','agendado','publicado','arquivado'
  ]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 520,
        background: 'var(--white)', zIndex: 50, padding: 24, overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <StatusPill status={content.status} />
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--caramel)', fontWeight: 600 }}>
              Próximo: {getNextAction(content.status).label}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--beige-lt)', paddingBottom: 12 }}>
          {(['detalhes','checklist','historico'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? 'var(--caramel)' : 'none', color: tab === t ? '#fff' : 'var(--beige-md)',
              border: '1px solid var(--beige-lt)', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'detalhes' && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--beige-md)' }}>TÍTULO</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, marginTop: 4, marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }} />

            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--beige-md)' }}>STATUS</label>
            <select value={content.status} onChange={(e) => changeStatus(e.target.value as ContentStatus)} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, marginTop: 4, marginBottom: 12, fontSize: 14 }}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>

            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--beige-md)' }}>NOTAS</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, marginTop: 4, marginBottom: 12, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />

            {content.drive_link && (
              <a href={content.drive_link} target="_blank" rel="noreferrer" style={{ color: 'var(--caramel)', fontSize: 13 }}>
                Abrir arquivo no Drive
              </a>
            )}

            <button onClick={save} style={{ marginTop: 16, background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 14, cursor: 'pointer', width: '100%' }}>
              Salvar
            </button>
          </div>
        )}

        {tab === 'checklist' && (
          <ContentChecklist checklist={checklist} onUpdate={() => {
            supabase.from('content_checklist').select('*').eq('content_id', content.id).then(({ data }) => setChecklist(data ?? []))
          }} />
        )}

        {tab === 'historico' && (
          <div>
            {history.map((h) => (
              <div key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--beige-lt)', fontSize: 13 }}>
                <span style={{ color: 'var(--beige-md)' }}>{h.old_status ?? 'início'}</span>
                {' → '}
                <span style={{ fontWeight: 600 }}>{h.new_status}</span>
                <div style={{ fontSize: 11, color: 'var(--beige-md)', marginTop: 2 }}>
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
