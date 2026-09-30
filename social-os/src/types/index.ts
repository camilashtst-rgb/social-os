export type ContentStatus =
  | 'ideia' | 'planejamento' | 'roteiro' | 'em_producao'
  | 'em_revisao' | 'aguardando_aprovacao' | 'ajustes_solicitados'
  | 'aprovado' | 'agendado' | 'publicado' | 'arquivado'

export type ContentPriority = 'baixa' | 'media' | 'alta' | 'urgente'

export type ContentFormat = 'reels' | 'carrossel' | 'feed' | 'stories' | 'video' | 'outro'

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida' | 'cancelada'

export type ChecklistStep =
  | 'definir_ideia' | 'definir_objetivo' | 'criar_headline' | 'criar_roteiro'
  | 'gravar_captar' | 'editar' | 'criar_arte' | 'criar_legenda' | 'revisar'
  | 'enviar_aprovacao' | 'fazer_ajustes' | 'aprovacao_final' | 'agendar' | 'publicar'

export interface Client {
  id: string
  name: string
  segment: string
  target_audience: string | null
  cities: string | null
  positioning: string | null
  voice_tone: string | null
  objectives: string | null
  services: string | null
  references: string | null
  links: string | null
  notes: string | null
  avatar_doc: string | null
  brain_doc: string | null
  sales_letter_doc: string | null
  created_at: string
  updated_at: string
}

export interface Content {
  id: string
  client_id: string
  idea_id: string | null
  title: string
  format: ContentFormat
  objective: string | null
  category: string | null
  pillar: string | null
  headline: string | null
  caption: string | null
  script: string | null
  briefing: string | null
  publication_date: string | null
  production_deadline: string | null
  approval_deadline: string | null
  status: ContentStatus
  priority: ContentPriority
  responsible: string | null
  drive_link: string | null
  notes: string | null
  entry_date: string | null
  production_start_date: string | null
  approval_sent_date: string | null
  approved_date: string | null
  published_date: string | null
  created_at: string
  updated_at: string
  client?: Client
}

export interface ContentChecklist {
  id: string
  content_id: string
  step_key: ChecklistStep
  completed: boolean
  completed_at: string | null
}

export interface ContentHistory {
  id: string
  content_id: string
  old_status: ContentStatus | null
  new_status: ContentStatus
  note: string | null
  created_at: string
}

export interface Idea {
  id: string
  client_id: string
  title: string
  format: ContentFormat | null
  objective: string | null
  category: string | null
  priority: ContentPriority
  notes: string | null
  created_at: string
  client?: Client
}

export interface Task {
  id: string
  client_id: string | null
  title: string
  description: string | null
  deadline: string | null
  priority: ContentPriority
  status: TaskStatus
  created_at: string
  updated_at: string
  client?: Client
}

export interface ImportantDate {
  id: string
  name: string
  date: string
  region: string | null
  category: string | null
  relevance: string | null
  should_create_content: boolean
  notes: string | null
  client_id: string | null
  created_at: string
}

export interface Settings {
  id: string
  user_id: string | null
  alert_planning_days: number
  alert_production_days: number
  alert_approval_days: number
  alert_scheduling_days: number
  wip_video_limit: number
  wip_production_limit: number
  wip_approval_limit: number
}
