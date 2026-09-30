import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import type { Idea, ContentPriority } from '../types'

type ClientOption = { id: string; name: string }

export function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
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

  async function promote(_idea: Idea) {
    navigate('/conteudos')
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <form onSubmit={addIdea} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da ideia *" required style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }}>
          <option value="">Cliente *</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>+ Adicionar</button>
      </form>

      {ideas.map((idea) => (
        <div key={idea.id} style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{idea.title}</div>
            <div style={{ fontSize: 12, color: 'var(--beige-md)' }}>{(idea.client as any)?.name}</div>
          </div>
          <PriorityBadge priority={idea.priority} />
          <button onClick={() => promote(idea)} style={{ background: 'none', border: '1px solid var(--caramel)', color: 'var(--caramel)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
            Promover → Conteúdo
          </button>
        </div>
      ))}
    </div>
  )
}
