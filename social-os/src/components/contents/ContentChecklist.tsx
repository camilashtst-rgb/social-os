import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ContentChecklist as ChecklistType, ChecklistStep } from '../../types'

const STEP_LABELS: Record<ChecklistStep, string> = {
  definir_ideia: 'Definir ideia', definir_objetivo: 'Definir objetivo',
  criar_headline: 'Criar headline', criar_roteiro: 'Criar roteiro',
  gravar_captar: 'Gravar / Captar', editar: 'Editar',
  criar_arte: 'Criar arte', criar_legenda: 'Criar legenda',
  revisar: 'Revisar', enviar_aprovacao: 'Enviar para aprovação',
  fazer_ajustes: 'Fazer ajustes', aprovacao_final: 'Aprovação final',
  agendar: 'Agendar', publicar: 'Publicar',
}

interface Props { checklist: ChecklistType[]; onUpdate: () => void }

export function ContentChecklist({ checklist, onUpdate }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  async function toggle(item: ChecklistType) {
    setLoading(item.id)
    await supabase.from('content_checklist').update({
      completed: !item.completed,
      completed_at: !item.completed ? new Date().toISOString() : null,
    }).eq('id', item.id)
    setLoading(null)
    onUpdate()
  }

  return (
    <div>
      {checklist.map((item) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--beige-lt)' }}>
          <input
            type="checkbox"
            checked={item.completed}
            onChange={() => toggle(item)}
            disabled={loading === item.id}
            style={{ accentColor: 'var(--caramel)', width: 16, height: 16 }}
          />
          <span style={{ fontSize: 13, textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--beige-md)' : 'var(--charcoal)' }}>
            {STEP_LABELS[item.step_key]}
          </span>
        </div>
      ))}
    </div>
  )
}
