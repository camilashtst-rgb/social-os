import { getPriorityColor } from '../../lib/utils'
import type { ContentPriority } from '../../types'

const LABELS: Record<ContentPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

export function PriorityBadge({ priority }: { priority: ContentPriority }) {
  const color = getPriorityColor(priority)
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 6px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      color,
      border: `1px solid ${color}`,
      background: `${color}18`,
    }}>
      {LABELS[priority]}
    </span>
  )
}
