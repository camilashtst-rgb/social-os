import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

export function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>({})
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSegment, setNewSegment] = useState('')

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
  }

  useEffect(() => { load() }, [])

  function selectClient(c: Client) {
    setSelected(c)
    setForm(c)
  }

  async function createClient(e: React.FormEvent) {
    e.preventDefault()
    if (!newName) return
    await supabase.from('clients').insert({ name: newName, segment: newSegment })
    setNewName(''); setNewSegment(''); setShowNewForm(false)
    load()
  }

  async function save() {
    if (!selected) return
    await supabase.from('clients').update({ ...form, updated_at: new Date().toISOString() }).eq('id', selected.id)
    load()
  }

  const field = (label: string, key: keyof Client, multiline = false) => (
    <div key={key} style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
      {multiline ? (
        <textarea value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
      ) : (
        <input value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ width: 260 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, margin: 0 }}>Clientes</h3>
          <button onClick={() => setShowNewForm(!showNewForm)} style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
            {showNewForm ? '✕' : '+ Novo'}
          </button>
        </div>
        {showNewForm && (
          <form onSubmit={createClient} style={{ marginBottom: 12 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do cliente *" required style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }} />
            <input value={newSegment} onChange={(e) => setNewSegment(e.target.value)} placeholder="Segmento" style={{ width: '100%', padding: '7px 10px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13, marginBottom: 6, boxSizing: 'border-box' }} />
            <button type="submit" style={{ width: '100%', background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px', fontSize: 13, cursor: 'pointer' }}>Criar</button>
          </form>
        )}
        {clients.map((c) => (
          <div key={c.id} onClick={() => selectClient(c)} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: selected?.id === c.id ? 'var(--caramel)' : 'var(--white)', color: selected?.id === c.id ? '#fff' : 'var(--charcoal)', border: '1px solid var(--beige-lt)', marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{c.segment}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ flex: 1, background: 'var(--white)', borderRadius: 8, border: '1px solid var(--beige-lt)', padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 20 }}>{selected.name}</h2>
          {field('Nome', 'name')}
          {field('Segmento', 'segment')}
          {field('Público-alvo', 'target_audience')}
          {field('Cidades / Regiões', 'cities')}
          {field('Posicionamento', 'positioning', true)}
          {field('Tom de voz', 'voice_tone')}
          {field('Objetivos', 'objectives', true)}
          {field('Serviços', 'services', true)}
          {field('Notas', 'notes', true)}
          <button onClick={save} style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>
            Salvar
          </button>
        </div>
      )}
    </div>
  )
}
