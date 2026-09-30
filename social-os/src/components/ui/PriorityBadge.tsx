import type { ContentPriority } from '../../types'

const CONFIG: Record<ContentPriority, { label: string; bg: string; color: string }> = {
  baixa:   { label: 'Baixa',   bg: '#F0F4F8', color: '#4A6B8A' },
  media:   { label: 'Média',   bg: '#FDF5D8', color: '#907010' },
  alta:    { label: 'Alta',    bg: '#FCEEE6', color: '#B05030' },
  urgente: { label: 'Urgente', bg: '#FDEAEA', color: '#A03030' },
}

export function PriorityBadge({ priority }: { priority: ContentPriority }) {
  const { label, bg, color } = CONFIG[priority] ?? CONFIG.media
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      color,
      background: bg,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {label}
    </span>
  )
}
