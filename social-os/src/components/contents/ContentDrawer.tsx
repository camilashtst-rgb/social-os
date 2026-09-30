import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getNextAction } from '../../lib/utils'
import { StatusPill } from '../ui/StatusPill'
import { ContentChecklist } from './ContentChecklist'
import type { Content, ContentChecklist as ChecklistType, ContentHistory, ContentStatus } from '../../types'

interface Props { content: Content | null; onClose: () => void; onUpdate: () => void }

function copyText(text: string) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
  } catch (e) {
    console.error('Erro ao copiar:', e)
  }
}

const CopyButton = ({ text, label }: { text: string; label: string }) => (
  <button onClick={(e) => {
    copyText(text)
    const btn = e.currentTarget as HTMLButtonElement
    const orig = btn.textContent
    btn.textContent = '✓ Copiado!'
    btn.style.background = '#E0F5EC'
    btn.style.color = '#1D7A4A'
    btn.style.borderColor = '#1D7A4A'
    setTimeout(() => {
      btn.textContent = orig
      btn.style.background = ''
      btn.style.color = ''
      btn.style.borderColor = ''
    }, 1500)
  }} style={{
    background: 'none',
    border: '1px solid var(--border-strong)',
    color: 'var(--text-secondary)',
    borderRadius: 6,
    padding: '5px 14px',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 6,
    transition: 'all 0.15s',
  }}>
    {label}
  </button>
)

const ActionButton = ({ loading, onClick, label, loadingLabel }: {
  loading: boolean; onClick: () => void; label: string; loadingLabel: string
}) => (
  <button onClick={onClick} disabled={loading} style={{
    background: loading ? 'var(--border)' : 'var(--caramel)',
    color: loading ? 'var(--text-tertiary)' : '#fff',
    border: 'none',
    borderRadius: 7,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    width: '100%',
    marginBottom: 12,
    letterSpacing: '-0.01em',
    transition: 'background 0.15s',
  }}>
    {loading ? loadingLabel : label}
  </button>
)

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: 7,
  marginTop: 4,
  marginBottom: 12,
  fontSize: 13,
  boxSizing: 'border-box',
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}

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

  async function deleteContent() {
    if (!window.confirm(`Apagar "${content!.title}"? Essa ação não pode ser desfeita.`)) return
    await supabase.from('content_checklist').delete().eq('content_id', content!.id)
    await supabase.from('content_history').delete().eq('content_id', content!.id)
    await supabase.from('contents').delete().eq('id', content!.id)
    onUpdate()
  }

  async function generateCaption() {
    setLoadingCaption(true)
    const { data } = await supabase.functions.invoke('ai-generate-caption', {
      body: { title: content!.title, format: content!.format, objective: content!.objective, pillar: content!.pillar, notes, client_id: content!.client_id },
    })
    const result = data?.caption ?? ''
    setCaption(result)
    await supabase.from('contents').update({ caption: result } as any).eq('id', content!.id)
    setLoadingCaption(false)
  }

  async function generateYoutube() {
    setLoadingYoutube(true)
    const { data } = await supabase.functions.invoke('ai-generate-youtube', {
      body: { title: content!.title, objective: content!.objective, notes, client_id: content!.client_id },
    })
    setYoutube(data)
    await supabase.from('contents').update({ ai_youtube: JSON.stringify(data) } as any).eq('id', content!.id)
    setLoadingYoutube(false)
  }

  async function generateCarousel() {
    setLoadingCarousel(true)
    const { data } = await supabase.functions.invoke('ai-generate-carousel', {
      body: { title: content!.title, objective: content!.objective, notes, client_id: content!.client_id },
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
    { key: 'ia', label: '✦ IA' },
    { key: 'checklist', label: 'Checklist' },
    { key: 'historico', label: 'Histórico' },
  ] as const

  const fieldLabel = (text: string) => (
    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {text}
    </label>
  )

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(28,26,24,0.35)', zIndex: 40, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 580,
        background: 'var(--bg)', zIndex: 50, padding: 0, overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', flex: 1, marginRight: 12, letterSpacing: '-0.01em' }}>
              {content.title}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={deleteContent} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', padding: '4px 10px', color: 'var(--terracotta)', fontWeight: 500 }}>
                Apagar
              </button>
              <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, cursor: 'pointer', padding: '4px 8px', color: 'var(--text-secondary)' }}>
                ✕
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusPill status={content.status} />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>→</span>
            <span style={{ fontSize: 12, color: 'var(--caramel)', fontWeight: 600 }}>
              {getNextAction(content.status).label}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 0, flexShrink: 0 }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              background: 'none',
              color: tab === t.key ? 'var(--caramel)' : 'var(--text-tertiary)',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--caramel)' : '2px solid transparent',
              padding: '12px 14px',
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color 0.1s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>

          {tab === 'detalhes' && (
            <div>
              {fieldLabel('Título')}
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />

              {fieldLabel('Status')}
              <select value={content.status} onChange={(e) => changeStatus(e.target.value as ContentStatus)} style={{ ...inputStyle }}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>

              {fieldLabel('Notas / Transcrição')}
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />

              {content.drive_link && (
                <a href={content.drive_link} target="_blank" rel="noreferrer" style={{ color: 'var(--caramel)', fontSize: 13, display: 'inline-block', marginBottom: 12 }}>
                  ↗ Abrir no Drive
                </a>
              )}

              <button onClick={save} style={{
                marginTop: 4,
                background: 'var(--caramel)',
                color: '#fff',
                border: 'none',
                borderRadius: 7,
                padding: '10px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}>
                Salvar
              </button>
            </div>
          )}

          {tab === 'ia' && (
            <div>
              {/* Instagram */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Instagram — Legenda
                </div>
                <ActionButton loading={loadingCaption} onClick={generateCaption} label="✦ Gerar Legenda" loadingLabel="Gerando..." />
                {caption && (
                  <div>
                    <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={7} style={{ ...inputStyle, border: '1px solid var(--caramel-md)', background: '#FFFCF9' }} />
                    <CopyButton text={caption} label="Copiar legenda" />
                  </div>
                )}
              </div>

              {/* Carrossel */}
              <div style={{ marginBottom: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Carrossel
                </div>
                <ActionButton loading={loadingCarousel} onClick={generateCarousel} label="✦ Gerar Carrossel" loadingLabel="Gerando..." />
                {carousel && carousel.slides && (
                  <div>
                    {carousel.slides.map((slide: any) => (
                      <div key={slide.numero} style={{
                        background: 'var(--surface)',
                        borderRadius: 8,
                        padding: '12px 14px',
                        marginBottom: 8,
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--caramel)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Slide {slide.numero} · {(slide.tipo || '').toUpperCase()}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{slide.titulo}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{slide.texto}</div>
                      </div>
                    ))}
                    {carousel.legenda && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          Legenda do Carrossel
                        </div>
                        <textarea value={carousel.legenda} readOnly rows={5} style={{ ...inputStyle, background: 'var(--surface)' }} />
                        <CopyButton text={carousel.legenda} label="Copiar legenda" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* YouTube */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  YouTube — Thumb + Descrição
                </div>
                <ActionButton loading={loadingYoutube} onClick={generateYoutube} label="✦ Gerar YouTube" loadingLabel="Gerando..." />
                {youtube && youtube.thumbnails && (
                  <div>
                    {youtube.thumbnails.map((t: any, i: number) => (
                      <div key={i} style={{
                        background: 'var(--surface)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        marginBottom: 8,
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--caramel)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Opção {i + 1}
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{t.titulo}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{t.subtitulo}</div>
                      </div>
                    ))}
                    {youtube.descricao && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          Descrição YouTube
                        </div>
                        <textarea value={youtube.descricao} readOnly rows={6} style={{ ...inputStyle, background: 'var(--surface)' }} />
                        <CopyButton text={youtube.descricao} label="Copiar descrição" />
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
              {history.length === 0 && (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Nenhum histórico ainda.</p>
              )}
              {history.map((h) => (
                <div key={h.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)' }}>{h.old_status ?? 'início'}</span>
                    {' → '}
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.new_status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {new Date(h.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
