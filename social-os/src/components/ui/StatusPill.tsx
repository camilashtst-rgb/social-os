import { getStatusColor } from '../../lib/utils'
import type { ContentStatus } from '../../types'

const LABELS: Record<ContentStatus, string> = {
  ideia: 'Ideia',
  planejamento: 'Planejamento',
  roteiro: 'Roteiro',
  em_producao: 'Em Produção',
  em_revisao: 'Em Revisão',
  aguardando_aprovacao: 'Aguard. Aprovação',
  ajustes_solicitados: 'Ajustes',
  aprovado: 'Aprovado',
  agendado: 'Agendado',
  publicado: 'Publicado',
  arquivado: 'Arquivado',
}

export function StatusPill({ status }: { status: ContentStatus }) {
  const color = getStatusColor(status)
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      color,
      border: `1px solid ${color}`,
      background: `${color}18`,
      whiteSpace: 'nowrap',
    }}>
      {LABELS[status]}
    </span>
  )
}
