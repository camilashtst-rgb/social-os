import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import type { Idea, ContentPriority } from '../types'

type ClientOption = { id: string; name: string }

const FORMAT_LABELS: Record<string, string> = {
  reels: 'Reels', carrossel: 'Carrossel', feed: 'Feed', stories: 'Stories', video: 'Vídeo', outro: 'Outro',
}

export function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const [trendResult, setTrendResult] = useState<any>(null)
  const [loadingTrends, setLoadingTrends] = useState(false)
  const [trendClientId, setTrendClientId] = useState('')
  const navigate = useNavigate()

  async function load() {
    const { data } = await supabase.from('ideas').select('*, client:clients(name)').order('created_at', { ascending: false })
    setIdeas(data ?? [])
  }

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
  }, [])

  async function addIdea(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !clientId) return
    await supabase.from('ideas').insert({ title, client_id: clientId, priority: 'media' as ContentPriority })
    setTitle(''); setClientId('')
    load()
  }

  async function addIdeaFromTrend(titulo: string) {
    if (!trendClientId) return
    await supabase.from('ideas').insert({ title: titulo, client_id: trendClientId, priority: 'media' as ContentPriority })
    load()
  }

  async function searchTrends() {
    if (!trendClientId) return
    setLoadingTrends(true)
    setTrendResult(null)
    const { data } = await supabase.functions.invoke('ai-viral-research', {
      body: { client_id: trendClientId },
    })
    setTrendResult(data)
    setLoadingTrends(false)
  }

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid var(--border)',
    borderRadius: 7,
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    color: 'var(--text-primary)',
    background: 'var(--bg)',
    outline: 'none',
  }

  return (
    <div style={{ maxWidth: 860 }}>

      {/* Add idea form */}
      <form onSubmit={addIdea} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da ideia *"
          required
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} required style={inputStyle}>
          <option value="">Cliente *</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" style={{
          background: 'var(--caramel)', color: '#fff', border: 'none',
          borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          + Adicionar
        </button>
      </form>

      {/* Trends with AI */}
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px 18px',
        marginBottom: 24,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Tendências do segmento com IA
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <select
            value={trendClientId}
            onChange={(e) => { setTrendClientId(e.target.value); setTrendResult(null) }}
            style={{ ...inputStyle, flex: 1 }}
          >
            <option value="">Selecione o cliente</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            onClick={searchTrends}
            disabled={loadingTrends || !trendClientId}
            style={{
              background: loadingTrends || !trendClientId ? 'var(--border)' : 'var(--text-primary)',
              color: loadingTrends || !trendClientId ? 'var(--text-tertiary)' : '#fff',
              border: 'none', borderRadius: 7, padding: '8px 18px',
              fontSize: 13, fontWeight: 600,
              cursor: loadingTrends || !trendClientId ? 'not-allowed' : 'pointer',
            }}
          >
            {loadingTrends ? 'Buscando...' : '✦ Buscar tendências'}
          </button>
        </div>

        {trendClientId && !trendResult && !loadingTrends && (
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
            A IA vai buscar tendências e gerar ideias específicas do segmento deste cliente.
          </div>
        )}

        {trendResult && (
          <div style={{ marginTop: 16 }}>
            {/* Header do resultado */}
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              Ideias geradas para <strong>{trendResult.client_name}</strong> · segmento: <strong>{trendResult.segment}</strong>
            </div>

            {/* Ideias geradas */}
            {trendResult.ideas && trendResult.ideas.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {trendResult.ideas.map((idea: any, i: number) => (
                  <div key={i} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    marginBottom: 8,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                        {idea.titulo}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{idea.angulo}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {idea.formato && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 7px',
                          borderRadius: 4, background: 'var(--caramel-lt)', color: 'var(--caramel)',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                          {FORMAT_LABELS[idea.formato] ?? idea.formato}
                        </span>
                      )}
                      <button
                        onClick={() => addIdeaFromTrend(idea.titulo)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--caramel)',
                          color: 'var(--caramel)',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        + Salvar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Referências externas */}
            {trendResult.references && trendResult.references.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Fontes consultadas
                </div>
                {trendResult.references.map((r: any, i: number) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{
                    display: 'block', padding: '6px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: 12, color: 'var(--caramel)',
                    textDecoration: 'none',
                  }}>
                    ↗ {r.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ideas list */}
      {ideas.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14,
          background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10 }}>
          Nenhuma ideia ainda. Adicione uma acima ou use a pesquisa de tendências.
        </div>
      ) : ideas.map((idea) => (
        <div key={idea.id} style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {idea.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
              {(idea.client as any)?.name}
            </div>
          </div>
          <PriorityBadge priority={idea.priority} />
          <button
            onClick={() => navigate('/conteudos')}
            style={{
              background: 'none',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Promover → Conteúdo
          </button>
        </div>
      ))}
    </div>
  )
}
