import { differenceInDays, isToday, isPast, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Content, ContentStatus, ContentPriority } from '../types'

const LATE_STATUSES: ContentStatus[] = [
  'em_revisao', 'aguardando_aprovacao', 'ajustes_solicitados',
  'aprovado', 'agendado', 'publicado', 'arquivado'
]

export function isOverdue(content: Content): boolean {
  const productionOverdue =
    content.production_deadline &&
    isPast(parseISO(content.production_deadline)) &&
    !LATE_STATUSES.includes(content.status)

  const approvalOverdue =
    content.approval_deadline &&
    isPast(parseISO(content.approval_deadline)) &&
    !['aprovado', 'agendado', 'publicado', 'arquivado'].includes(content.status)

  return !!(productionOverdue || approvalOverdue)
}

export function isDueToday(content: Content): boolean {
  const prodToday = content.production_deadline && isToday(parseISO(content.production_deadline))
  const approvalToday = content.approval_deadline && isToday(parseISO(content.approval_deadline))
  return !!(prodToday || approvalToday)
}

export function isPendingApprovalTooLong(content: Content, thresholdDays = 2): boolean {
  if (content.status !== 'aguardando_aprovacao' || !content.approval_sent_date) return false
  return differenceInDays(new Date(), parseISO(content.approval_sent_date)) > thresholdDays
}

export function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date())
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM yyyy", { locale: ptBR })
}

export function getNextAction(status: ContentStatus): { label: string; responsible: 'você' | 'cliente' } {
  const map: Record<ContentStatus, { label: string; responsible: 'você' | 'cliente' }> = {
    ideia:                  { label: 'Definir objetivo e formato', responsible: 'você' },
    planejamento:           { label: 'Criar roteiro ou briefing', responsible: 'você' },
    roteiro:                { label: 'Iniciar gravação/produção', responsible: 'você' },
    em_producao:            { label: 'Finalizar e revisar', responsible: 'você' },
    em_revisao:             { label: 'Enviar para aprovação', responsible: 'você' },
    aguardando_aprovacao:   { label: 'Aguardar resposta do cliente', responsible: 'cliente' },
    ajustes_solicitados:    { label: 'Aplicar feedback e reenviar', responsible: 'você' },
    aprovado:               { label: 'Agendar publicação', responsible: 'você' },
    agendado:               { label: 'Confirmar publicação na data', responsible: 'você' },
    publicado:              { label: 'Ciclo completo', responsible: 'você' },
    arquivado:              { label: 'Arquivado', responsible: 'você' },
  }
  return map[status]
}

export function getStatusColor(status: ContentStatus): string {
  const map: Record<ContentStatus, string> = {
    ideia: '#B8A593',
    planejamento: '#7B9EC2',
    roteiro: '#9B85C4',
    em_producao: '#A3815E',
    em_revisao: '#C4A835',
    aguardando_aprovacao: '#C48435',
    ajustes_solicitados: '#C0715A',
    aprovado: '#5A9E6F',
    agendado: '#3A9E8F',
    publicado: '#7AAE8A',
    arquivado: '#C8C0B8',
  }
  return map[status]
}

export function getPriorityColor(priority: ContentPriority): string {
  const map: Record<ContentPriority, string> = {
    baixa: '#B8A593',
    media: '#A3815E',
    alta: '#C48435',
    urgente: '#C0715A',
  }
  return map[priority]
}
