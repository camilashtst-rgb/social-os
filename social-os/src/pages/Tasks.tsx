import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, ContentPriority } from '../types'

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<ContentPriority>('media')

  async function load() {
    const { data } = await supabase.from('tasks').select('*').neq('status', 'cancelada').order('deadline')
    setTasks(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!title) return
    await supabase.from('tasks').insert({ title, deadline: deadline || null, priority, status: 'pendente' })
    setTitle(''); setDeadline('')
    load()
  }

  async function complete(id: string) {
    await supabase.from('tasks').update({ status: 'concluida', updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <form onSubmit={add} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da tarefa *" required style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <select value={priority} onChange={(e) => setPriority(e.target.value as ContentPriority)} style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }}>
          {(['baixa','media','alta','urgente'] as const).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button type="submit" style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>+ Adicionar</button>
      </form>

      {tasks.map((task) => (
        <div key={task.id} style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="checkbox" checked={task.status === 'concluida'} onChange={() => complete(task.id)} style={{ accentColor: 'var(--caramel)', width: 16, height: 16 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, textDecoration: task.status === 'concluida' ? 'line-through' : 'none', color: task.status === 'concluida' ? 'var(--beige-md)' : 'var(--charcoal)' }}>{task.title}</div>
            {task.deadline && <div style={{ fontSize: 12, color: 'var(--beige-md)' }}>{task.deadline}</div>}
          </div>
        </div>
      ))}
    </div>
  )
}
