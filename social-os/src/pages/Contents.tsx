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
