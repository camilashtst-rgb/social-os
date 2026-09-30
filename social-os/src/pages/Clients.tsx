import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

type Tab = 'dados' | 'avatar' | 'brain' | 'carta'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: 7,
  fontSize: 13,
  boxSizing: 'border-box',
  fontFamily: 'var(--font-body)',
  color: 'var(--text-primary)',
  background: 'var(--bg)',
  outline: 'none',
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>({})
  const [tab, setTab] = useState<Tab>('dados')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSegment, setNewSegment] = useState('')
  const [saved, setSaved] = useState(false)

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
  }

  useEffect(() => { load() }, [])

  function selectClient(c: Client) {
    setSelected(c)
    setForm(c)
    setTab('dados')
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
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    load()
  }

  const field = (label: string, key: keyof Client, multiline = false) => (
    <div key={key} style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={(form[key] as string) ?? ''}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          value={(form[key] as string) ?? ''}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          style={inputStyle}
        />
      )}
    </div>
  )

  const docField = (label: string, key: 'avatar_doc' | 'brain_doc' | 'sales_letter_doc', hint: string) => (
    <div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{hint}</div>
      <textarea
        value={(form[key] as string) ?? ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        rows={24}
        placeholder={`Cole aqui o ${label}...`}
        style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
      />
    </div>
  )

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dados', label: 'Dados' },
    { key: 'avatar', label: 'Avatar' },
    { key: 'brain', label: 'Business Brain' },
    { key: 'carta', label: 'Carta de Vendas' },
  ]

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Client list */}
      <div style={{ width: 248, flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Clientes
          </h3>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            style={{
              background: showNewForm ? 'var(--border)' : 'var(--caramel)',
              color: showNewForm ? 'var(--text-secondary)' : '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {showNewForm ? '✕' : '+ Novo'}
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={createClient} style={{
            marginBottom: 12,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: 12,
            boxShadow: 'var(--shadow-sm)',
          }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do cliente *"
              required
              style={{ ...inputStyle, marginBottom: 6 }}
            />
            <input
              value={newSegment}
              onChange={(e) => setNewSegment(e.target.value)}
              placeholder="Segmento"
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <button type="submit" style={{
              width: '100%',
              background: 'var(--caramel)',
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              padding: '7px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              Criar cliente
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {clients.map((c) => (
            <div
              key={c.id}
              onClick={() => selectClient(c)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                background: selected?.id === c.id ? 'var(--caramel-lt)' : 'var(--bg)',
                border: `1px solid ${selected?.id === c.id ? 'var(--caramel-md)' : 'var(--border)'}`,
                boxShadow: 'var(--shadow-sm)',
                transition: 'border-color 0.1s, background 0.1s',
              }}
            >
              <div style={{
                fontSize: 14,
                fontWeight: 500,
                color: selected?.id === c.id ? 'var(--caramel)' : 'var(--text-primary)',
              }}>
                {c.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{c.segment}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Client detail */}
      {selected && (
        <div style={{
          flex: 1,
          background: 'var(--bg)',
          borderRadius: 10,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {/* Header */}
          <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {selected.name}
            </h2>
            <div style={{ display: 'flex', gap: 0 }}>
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    background: 'none',
                    color: tab === t.key ? 'var(--caramel)' : 'var(--text-tertiary)',
                    border: 'none',
                    borderBottom: tab === t.key ? '2px solid var(--caramel)' : '2px solid transparent',
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: tab === t.key ? 600 : 400,
                    cursor: 'pointer',
                    marginBottom: -1,
                    transition: 'color 0.1s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px 24px' }}>
            {tab === 'dados' && (
              <div>
                {field('Nome', 'name')}
                {field('Segmento', 'segment')}
                {field('Público-alvo', 'target_audience')}
                {field('Cidades / Regiões', 'cities')}
                {field('Posicionamento', 'positioning', true)}
                {field('Tom de voz', 'voice_tone')}
                {field('Objetivos', 'objectives', true)}
                {field('Serviços', 'services', true)}
                {field('Notas', 'notes', true)}
              </div>
            )}

            {tab === 'avatar' && docField('Avatar', 'avatar_doc', 'Descreva o cliente ideal: quem é, dores profundas, desejos, objeções e gatilhos de compra.')}
            {tab === 'brain' && docField('Business Brain', 'brain_doc', 'DNA do negócio: ICP, ofertas, tom de voz (sempre/nunca), regra-âncora e diferenciais.')}
            {tab === 'carta' && docField('Carta de Vendas', 'sales_letter_doc', 'Carta de vendas principal: argumento central, provas sociais, objeções respondidas e CTA.')}

            <button
              onClick={save}
              style={{
                marginTop: 8,
                background: saved ? '#1D7A4A' : 'var(--caramel)',
                color: '#fff',
                border: 'none',
                borderRadius: 7,
                padding: '10px 28px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {saved ? '✓ Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {!selected && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-tertiary)',
          fontSize: 14,
          background: 'var(--bg)',
          borderRadius: 10,
          border: '1px solid var(--border)',
        }}>
          Selecione um cliente para editar
        </div>
      )}
    </div>
  )
}
