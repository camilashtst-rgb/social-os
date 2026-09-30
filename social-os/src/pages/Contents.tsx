import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ContentRow } from '../components/contents/ContentRow'
import { ContentDrawer } from '../components/contents/ContentDrawer'
import type { Content } from '../types'

type ClientOption = { id: string; name: string }

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
      {/* New Content Form */}
      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer', marginBottom: showForm ? 12 : 0 }}>
          {showForm ? '✕ Cancelar' : '+ Novo Conteúdo'}
        </button>
        {showForm && (
          <form onSubmit={createContent} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: 16 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título do conteúdo *" required style={{ flex: 2, minWidth: 200, padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
            <select value={newClientId} onChange={(e) => setNewClientId(e.target.value)} required style={{ flex: 1, minWidth: 150, padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }}>
              <option value="">Cliente *</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={newFormat} onChange={(e) => setNewFormat(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }}>
              {['reels','carrossel','feed','stories','video','outro'].map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <button type="submit" style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 14, cursor: 'pointer' }}>Criar</button>
          </form>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar título..." style={{ padding: '6px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13 }} />
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={{ padding: '6px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13 }}>
          <option value="">Todos os clientes</option>
          {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '6px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13 }}>
          <option value="">Todos os status</option>
          {['ideia','planejamento','roteiro','em_producao','em_revisao','aguardando_aprovacao','ajustes_solicitados','aprovado','agendado','publicado','arquivado'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--beige-lt)' }}>
              {['Título','Cliente','Status','Prioridade','Publicação'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
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
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--beige-md)', fontSize: 14 }}>Nenhum conteúdo encontrado.</div>
        )}
      </div>

      <ContentDrawer content={selected} onClose={() => setSelected(null)} onUpdate={() => { load(); setSelected(null) }} />
    </div>
  )
}
