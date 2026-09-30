import type { ContentStatus } from '../../types'

const STATUS_CONFIG: Record<ContentStatus, { label: string; bg: string; color: string }> = {
  ideia:                { label: 'Ideia',         bg: '#EEE9F8', color: '#6B5BB5' },
  planejamento:         { label: 'Planejamento',  bg: '#E6EEF8', color: '#2D6FAD' },
  roteiro:              { label: 'Roteiro',       bg: '#E3F5F2', color: '#2A8A7A' },
  em_producao:          { label: 'Em Produção',   bg: '#FEF0E0', color: '#C06A10' },
  em_revisao:           { label: 'Em Revisão',    bg: '#FCEEE6', color: '#B05030' },
  aguardando_aprovacao: { label: 'Aguard. Aprov.',bg: '#FDF5D8', color: '#907010' },
  ajustes_solicitados:  { label: 'Ajustes',       bg: '#FDEAEA', color: '#A03030' },
  aprovado:             { label: 'Aprovado',      bg: '#E0F5EC', color: '#1D7A4A' },
  agendado:             { label: 'Agendado',      bg: '#E3EBF8', color: '#2050A0' },
  publicado:            { label: 'Publicado',     bg: '#D6F0E4', color: '#155E38' },
  arquivado:            { label: 'Arquivado',     bg: '#EEECEB', color: '#7A7570' },
}

export function StatusPill({ status }: { status: ContentStatus }) {
  const { label, bg, color } = STATUS_CONFIG[status] ?? STATUS_CONFIG.ideia
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 9px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: bg,
      whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      {label}
    </span>
  )
}
