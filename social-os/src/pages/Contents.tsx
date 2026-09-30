import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ContentRow } from '../components/contents/ContentRow'
import { ContentDrawer } from '../components/contents/ContentDrawer'
import type { Content } from '../types'

type ClientOption = { id: string; name: string }

const filterSelectStyle: React.CSSProperties = {
  padding: '7px 10px',
  border: '1px solid var(--border)',
  borderRadius: 7,
  fontSize: 13,
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  outline: 'none',
}

export function Contents() {
  const [contents, setContents] = useState<Content[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [selected, setSelected] = useState<Content | null>(null)
  const [filterClient, setFilterClient] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newClientId, setNewClientId] = useState('')
  const [newFormat, setNewFormat] = useState('reels')

  async function createContent(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle || !newClientId) return
    await supabase.from('contents').insert({ title: newTitle, client_id: newClientId, format: newFormat as any, status: 'ideia', priority: 'media' })
    setNewTitle(''); setNewClientId(''); setNewFormat('reels'); setShowForm(false)
    load()
  }

  async function load() {
    const { data } = await supabase.from('contents').select('*, client:clients(name, id)').order('created_at', { ascending: false })
    setContents(data ?? [])
  }

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
  }, [])

  const filtered = contents.filter((c) => {
    const matchClient = !filterClient || c.client_id === filterClient
    const matchStatus = !filterStatus || c.status === filterStatus
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase())
    return matchClient && matchStatus && matchSearch
  })

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: showForm ? 'var(--border)' : 'var(--caramel)',
            color: showForm ? 'var(--text-secondary)' : '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '7px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {showForm ? '✕ Cancelar' : '+ Novo Conteúdo'}
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-tertiary)', pointerEvents: 'none' }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar título..."
            style={{ ...filterSelectStyle, paddingLeft: 26, width: 180 }}
          />
        </div>

        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={filterSelectStyle}>
          <option value="">Todos os clientes</option>
          {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={filterSelectStyle}>
          <option value="">Todos os status</option>
          {['ideia','planejamento','roteiro','em_producao','em_revisao','aguardando_aprovacao','ajustes_solicitados','aprovado','agendado','publicado','arquivado'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      {/* New Content Form */}
      {showForm && (
        <form onSubmit={createContent} style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título do conteúdo *"
            required
            style={{ flex: 2, minWidth: 200, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }}
          />
          <select
            value={newClientId}
            onChange={(e) => setNewClientId(e.target.value)}
            required
            style={{ flex: 1, minWidth: 150, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }}
          >
            <option value="">Cliente *</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={newFormat}
            onChange={(e) => setNewFormat(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }}
          >
            {['reels','carrossel','feed','stories','video','outro'].map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <button type="submit" style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Criar
          </button>
        </form>
      )}

      {/* Table */}
      <div style={{
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Título','Cliente','Status','Prioridade','Publicação'].map((h) => (
                <th key={h} style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  background: 'var(--surface)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <ContentRow key={c.id} content={c} onClick={() => setSelected(c)} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
            Nenhum conteúdo encontrado.
          </div>
        )}
      </div>

      <ContentDrawer content={selected} onClose={() => setSelected(null)} onUpdate={() => { load(); setSelected(null) }} />
    </div>
  )
}
