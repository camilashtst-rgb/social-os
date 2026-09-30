import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getNextAction } from '../../lib/utils'
import { StatusPill } from '../ui/StatusPill'
import { ContentChecklist } from './ContentChecklist'
import type { Content, ContentChecklist as ChecklistType, ContentHistory, ContentStatus } from '../../types'

interface Props { content: Content | null; onClose: () => void; onUpdate: () => void }

const btn = (loading: boolean, onClick: () => void, label: string, loadingLabel: string) => (
  <button onClick={onClick} disabled={loading} style={{
    background: loading ? 'var(--beige-md)' : 'var(--charcoal)', color: '#fff', border: 'none',
    borderRadius: 6, padding: '10px 16px', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', width: '100%', marginBottom: 12,
  }}>
    {loading ? loadingLabel : label}
  </button>
)

const copyBtn = (text: string, label: string) => (
  <button onClick={() => navigator.clipboard.writeText(text)} style={{
    background: 'none', border: '1px solid var(--caramel)', color: 'var(--caramel)',
    borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer', marginTop: 6,
  }}>
    {label}
  </button>
)

export function ContentDrawer({ content, onClose, onUpdate }: Props) {
  const [checklist, setChecklist] = useState<ChecklistType[]>([])
  const [history, setHistory] = useState<ContentHistory[]>([])
  const [tab, setTab] = useState<'detalhes' | 'ia' | 'checklist' | 'historico'>('detalhes')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  const [caption, setCaption] = useState('')
  const [loadingCaption, setLoadingCaption] = useState(false)

  const [youtube, setYoutube] = useState<any>(null)
  const [loadingYoutube, setLoadingYoutube] = useState(false)

  const [carousel, setCarousel] = useState<any>(null)
  const [loadingCarousel, setLoadingCarousel] = useState(false)

  useEffect(() => {
    if (!content) return
    setTitle(content.title)
    setNotes(content.notes ?? '')
    setCaption((content as any).caption ?? '')
    setYoutube((content as any).ai_youtube ? JSON.parse((content as any).ai_youtube) : null)
    setCarousel((content as any).ai_carousel ? JSON.parse((content as any).ai_carousel) : null)
    supabase.from('content_checklist').select('*').eq('content_id', content.id).then(({ data }) => setChecklist(data ?? []))
    supabase.from('content_history').select('*').eq('content_id', content.id).order('created_at', { ascending: false }).then(({ data }) => setHistory(data ?? []))
  }, [content])

  if (!content) return null

  async function save() {
    await supabase.from('contents').update({ title, notes }).eq('id', content!.id)
    onUpdate()
  }

  async function generateCaption() {
    setLoadingCaption(true)
    const { data } = await supabase.functions.invoke('ai-generate-caption', {
      body: { title: content!.title, format: content!.format, objective: content!.objective, pillar: content!.pillar, notes: notes, client_id: content!.client_id },
    })
    const result = data?.caption ?? ''
    setCaption(result)
    await supabase.from('contents').update({ caption: result } as any).eq('id', content!.id)
    setLoadingCaption(false)
  }

  async function generateYoutube() {
    setLoadingYoutube(true)
    const { data } = await supabase.functions.invoke('ai-generate-youtube', {
      body: { title: content!.title, objective: content!.objective, notes: notes, client_id: content!.client_id },
    })
    setYoutube(data)
    await supabase.from('contents').update({ ai_youtube: JSON.stringify(data) } as any).eq('id', content!.id)
    setLoadingYoutube(false)
  }

  async function generateCarousel() {
    setLoadingCarousel(true)
    const { data } = await supabase.functions.invoke('ai-generate-carousel', {
      body: { title: content!.title, objective: content!.objective, notes: notes, client_id: content!.client_id },
    })
    setCarousel(data)
    await supabase.from('contents').update({ ai_carousel: JSON.stringify(data) } as any).eq('id', content!.id)
    setLoadingCarousel(false)
  }

  async function changeStatus(newStatus: ContentStatus) {
    await supabase.from('contents').update({ status: newStatus }).eq('id', content!.id)
    onUpdate()
  }

  const STATUS_OPTIONS: ContentStatus[] = [
    'ideia','planejamento','roteiro','em_producao','em_revisao',
    'aguardando_aprovacao','ajustes_solicitados','aprovado','agendado','publicado','arquivado'
  ]

  const TABS = [
    { key: 'detalhes', label: 'Detalhes' },
    { key: 'ia', label: '✨ IA' },
    { key: 'checklist', label: 'Checklist' },
    { key: 'historico', label: 'Histórico' },
  ] as const

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 560, background: 'var(--white)', zIndex: 50, padding: 24, overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.1)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <StatusPill status={content.status} />
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--caramel)', fontWeight: 600 }}>
              Próximo: {getNextAction(content.status).label}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid var(--beige-lt)', paddingBottom: 12 }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: tab === t.key ? 'var(--caramel)' : 'none',
              color: tab === t.key ? '#fff' : 'var(--beige-md)',
              border: '1px solid var(--beige-lt)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer',
            }}>
              {t.label}
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
              <a href={content.drive_link} target="_blank" rel="noreferrer" style={{ color: 'var(--caramel)', fontSize: 13 }}>Abrir no Drive</a>
            )}
            <button onClick={save} style={{ marginTop: 16, background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 14, cursor: 'pointer', width: '100%' }}>Salvar</button>
          </div>
        )}

        {tab === 'ia' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instagram</div>
              {btn(loadingCaption, generateCaption, '✨ Gerar Legenda', 'Gerando...')}
              {caption && (
                <div>
                  <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={7} style={{ width: '100%', padding: '8px', border: '1px solid var(--caramel)', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
                  {copyBtn(caption, 'Copiar legenda')}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 24, borderTop: '1px solid var(--beige-lt)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Carrossel</div>
              {btn(loadingCarousel, generateCarousel, '✨ Gerar Carrossel', 'Gerando...')}
              {carousel && carousel.slides && (
                <div>
                  {carousel.slides.map((slide: any) => (
                    <div key={slide.numero} style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid var(--beige-lt)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--caramel)', marginBottom: 4 }}>SLIDE {slide.numero} — {(slide.tipo || '').toUpperCase()}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{slide.titulo}</div>
                      <div style={{ fontSize: 13, color: 'var(--charcoal)' }}>{slide.texto}</div>
                    </div>
                  ))}
                  {carousel.legenda && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', marginBottom: 4 }}>LEGENDA DO CARROSSEL</div>
                      <textarea value={carousel.legenda} readOnly rows={5} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                      {copyBtn(carousel.legenda, 'Copiar legenda')}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--beige-lt)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>YouTube</div>
              {btn(loadingYoutube, generateYoutube, '✨ Gerar Thumb + Descrição YouTube', 'Gerando...')}
              {youtube && youtube.thumbnails && (
                <div>
                  {youtube.thumbnails.map((t: any, i: number) => (
                    <div key={i} style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid var(--beige-lt)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--caramel)', marginBottom: 2 }}>OPÇÃO {i + 1}</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{t.titulo}</div>
                      <div style={{ fontSize: 13, color: 'var(--beige-md)', marginTop: 2 }}>{t.subtitulo}</div>
                    </div>
                  ))}
                  {youtube.descricao && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', marginBottom: 4 }}>DESCRIÇÃO YOUTUBE</div>
                      <textarea value={youtube.descricao} readOnly rows={6} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                      {copyBtn(youtube.descricao, 'Copiar descrição')}
                    </div>
                  )}
                </div>
              )}
            </div>
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
