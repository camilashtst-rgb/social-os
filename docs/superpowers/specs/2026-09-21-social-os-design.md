# Social OS — Sistema Operacional da Social Media
**Data:** 2026-09-21  
**Status:** Aprovado pela usuária — pronto para implementação  
**Stack:** React + Vite · Supabase · Netlify

---

## 1. Objetivo

Sistema web pessoal de gestão de operação para social media. Responde em menos de 30 segundos, ao abrir pela manhã:

1. O que preciso fazer hoje?
2. O que está atrasado?
3. O que está próximo do prazo?
4. Quais conteúdos estão em produção?
5. O que está aguardando aprovação?
6. O que será publicado nos próximos dias?
7. Quais datas importantes estão chegando?
8. Existe algum risco de perder uma publicação?
9. Qual é o próximo passo de cada conteúdo?

---

## 2. Stack Técnica

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Frontend | React + Vite | Rápido, componentizável, sem overhead |
| Styling | Tailwind CSS + variáveis CSS custom | Utilitário + tokens da identidade visual |
| Backend/DB | Supabase (PostgreSQL) | Free tier, auth incluso, sem backend customizado |
| Deploy | Netlify (CD via git push) | Já conhece o fluxo |
| Fontes | Cormorant Garamond + Jost (Google Fonts) | Equivalente web ao SVN Aire Pro do branding |
| State | Zustand | Leve, sem boilerplate |
| Roteamento | React Router v6 | Standard |
| Datas | date-fns | Leve, treeshakeable |

---

## 3. Identidade Visual

| Token | Valor | Uso |
|-------|-------|-----|
| `--cream` | `#FAF7F4` | Fundo geral |
| `--beige-lt` | `#E6DED8` | Bordas, fundos secundários |
| `--beige-md` | `#B8A593` | Texto terciário, elementos neutros |
| `--caramel` | `#A3815E` | Cor de destaque — CTAs, links, badges, ações |
| `--charcoal` | `#3F3B37` | Sidebar, texto principal |
| `--white` | `#FFFFFF` | Cards, painéis |
| Font display | Cormorant Garamond | Títulos de seção, números grandes |
| Font body | Jost | Tudo o mais |

Sem azul. Alertas em terracota quente (`#C0715A`) em vez de vermelho puro.

---

## 4. Entidades e Modelo de Dados

### 4.1 `clients` — Clientes
```
id, name, segment, target_audience, cities, positioning,
voice_tone, objectives, services, references, links, notes,
created_at, updated_at
```

### 4.2 `contents` — Conteúdos (entidade principal)
```
id, client_id (FK), idea_id (FK nullable),
title, format, objective, category, pillar,
headline, caption, script, briefing,
publication_date, production_deadline, approval_deadline,
status (enum), priority (enum), responsible,
drive_link, notes,
entry_date, production_start_date, approval_sent_date,
approved_date, published_date,
created_at, updated_at
```

**Enums de status:**
1. `ideia`
2. `planejamento`
3. `roteiro`
4. `em_producao`
5. `em_revisao`
6. `aguardando_aprovacao`
7. `ajustes_solicitados`
8. `aprovado`
9. `agendado`
10. `publicado`
11. `arquivado`

**Enums de prioridade:** `baixa` · `media` · `alta` · `urgente`

**Enums de formato:** `reels` · `carrossel` · `feed` · `stories` · `video` · `outro`

### 4.3 `content_checklist` — Etapas de produção
```
id, content_id (FK), step_key (enum), completed (bool), completed_at
```

**Steps (fixos, criados automaticamente ao criar conteúdo):**
`definir_ideia` · `definir_objetivo` · `criar_headline` · `criar_roteiro` ·
`gravar_captar` · `editar` · `criar_arte` · `criar_legenda` · `revisar` ·
`enviar_aprovacao` · `fazer_ajustes` · `aprovacao_final` · `agendar` · `publicar`

### 4.4 `content_history` — Histórico de status
```
id, content_id (FK), old_status, new_status, note, created_at
```
Criado automaticamente a cada mudança de status.

### 4.5 `ideas` — Banco de Ideias
```
id, client_id (FK), title, format, objective, category,
priority, notes, created_at
```

### 4.6 `tasks` — Tarefas Gerais
```
id, client_id (FK nullable), title, description,
deadline, priority, status, created_at, updated_at
```

**Status de tarefa:** `pendente` · `em_andamento` · `concluida` · `cancelada`

### 4.7 `important_dates` — Radar de Datas
```
id, name, date, region, category, relevance,
should_create_content (bool), notes, created_at
```

### 4.8 `settings` — Configurações da usuária (1 linha)
```
id, user_id,
alert_planning_days (default 30),
alert_production_days (default 20),
alert_approval_days (default 10),
alert_scheduling_days (default 3),
wip_video_limit (default 2),
wip_production_limit (default 3),
wip_approval_limit (default 3)
```

---

## 5. Relacionamentos

- `clients` 1:N → `contents`, `ideas`, `tasks`
- `contents` 1:N → `content_checklist` (14 itens criados automaticamente)
- `contents` 1:N → `content_history`
- `ideas` 0:1 → `contents` (quando ideia é promovida a conteúdo)
- `tasks` N:1 → `clients` (opcional — tarefa pode existir sem cliente)

---

## 6. Lógica de Negócio

### 6.1 Próxima Ação (por status)
| Status | Próxima ação | Responsável |
|--------|-------------|-------------|
| Ideia | Definir objetivo e formato | Você |
| Planejamento | Criar roteiro ou briefing | Você |
| Roteiro | Iniciar gravação/produção | Você |
| Em Produção | Finalizar e revisar | Você |
| Em Revisão | Enviar para aprovação | Você |
| Aguardando Aprovação | Aguardar resposta | Cliente |
| Ajustes Solicitados | Aplicar feedback e reenviar | Você |
| Aprovado | Agendar publicação | Você |
| Agendado | Confirmar publicação na data | Você |
| Publicado | — (ciclo completo) | — |

### 6.2 Alertas Automáticos
- Conteúdo ultrapassou `production_deadline` e status < `em_revisao` → **Atrasado (🔴)**
- Conteúdo ultrapassou `approval_deadline` e status < `aprovado` → **Atrasado (🔴)**
- `production_deadline` = hoje → **Fazer hoje (🟠)**
- `approval_deadline` = hoje → **Fazer hoje (🟠)**
- Status = `aguardando_aprovacao` há mais de 2 dias → **Enviar lembrete (🟡)**
- Data importante com `should_create_content = true` dentro de `alert_planning_days` → alerta no Radar

### 6.3 Controle de WIP
- Contar conteúdos com `format = 'reels' OR 'video'` e `status = 'em_producao'`
- Comparar com `wip_video_limit` da tabela `settings`
- Se ultrapassado → indicador vermelho no dashboard + mensagem de alerta
- Mesmo padrão para `wip_production_limit` (todos em produção) e `wip_approval_limit`

### 6.4 Datas Separadas (obrigatório)
Nunca misturar os três campos:
- `production_deadline` — prazo interno de produção (alerta chega aqui primeiro)
- `approval_deadline` — prazo para o cliente aprovar
- `publication_date` — data real de publicação no feed

### 6.5 Tempo de Ciclo
Campos registrados automaticamente com timestamp:
- `entry_date` — quando o conteúdo foi criado no sistema
- `production_start_date` — quando passou para "Em Produção"
- `approval_sent_date` — quando passou para "Aguardando Aprovação"
- `approved_date` — quando passou para "Aprovado"
- `published_date` — quando passou para "Publicado"

Tempo de ciclo total = `published_date - entry_date`

---

## 7. Telas (MVP)

### 7.1 Central de Operação (Home)
Responde as 9 perguntas operacionais.

**Seções:**
- 6 cards de contagem rápida: Atrasados · Fazer hoje · Aprovação · Em produção · Agendados · Ideias
- Painel "Ações necessárias hoje": conteúdos e tarefas que exigem ação — ordenados por urgência, com status pill colorido e próxima ação
- Painel "Próximas publicações – 14 dias": data + título + formato + status + dias faltando (colorido por urgência)
- Painel lateral "Radar de Datas": contagem regressiva + tag "Conteúdo" vs "Radar"
- Painel lateral "Controle de WIP": barras de progresso por categoria com alerta se exceder

### 7.2 Meu Dia
Foco total no dia atual. Seções separadas visualmente:
- 🔴 Atrasados
- 🟠 Prioridade alta / fazer hoje
- 🔵 Em produção
- 🟡 Aguardando retorno (bola com cliente)
- 🟢 Concluído hoje

Marcar tarefa/etapa como concluída direto nessa tela.

### 7.3 Banco de Conteúdos
**Listagem:**
- Tabela/cards com filtros: cliente, status, formato, prioridade, período
- Busca inline
- Botão de mudança de status rápida (dropdown)
- Indicador visual de atraso

**Detalhe do conteúdo (tela ou drawer lateral):**
- Todos os campos do `contents`
- Checklist de 14 etapas com toggle
- Histórico de status (timeline)
- Próxima ação em destaque
- Link para arquivos

### 7.4 Calendário Editorial
- Toggle mensal / semanal
- Eventos coloridos por status
- Clique no dia → modal para criar conteúdo
- Espaços vazios visíveis (slots sem conteúdo)

### 7.5 Banco de Ideias
- Lista de ideias com prioridade e cliente
- Cadastro rápido (título + cliente em 2 campos obrigatórios, resto opcional)
- Botão "Promover → Conteúdo": pré-preenche cadastro de conteúdo com dados da ideia

### 7.6 Tarefas Gerais
- Lista de tarefas com filtros de status e prioridade
- Cadastro rápido: título + prazo + prioridade
- Marcar como concluída com 1 clique

### 7.7 Radar de Datas
- Lista de datas com contagem regressiva
- Filtros por região e categoria
- Cadastro de nova data
- Alerta visual quando dentro do período configurado

### 7.8 Clientes
- Lista de clientes
- Perfil completo editável
- Sub-seção: conteúdos do cliente

### 7.9 Configurações
- Períodos de alerta (30/20/10/3 dias — configuráveis)
- Limites de WIP por categoria
- (Estrutura preparada para futura autenticação do cliente)

---

## 8. Navegação

Sidebar fixa à esquerda (220px) com grupos:
- **Principal:** Central de Op. · Meu Dia
- **Produção:** Conteúdos · Ideias · Tarefas
- **Planejamento:** Calendário · Radar de Datas
- **Gestão:** Clientes · Configurações

Topbar com: título da tela · data atual · busca global · notificações · "+ Novo Conteúdo"

---

## 9. Busca Global

Campo na topbar. Busca em tempo real em:
- Títulos de conteúdo
- Títulos de ideia
- Títulos de tarefa
- Nome de datas importantes
- Nome de clientes

Retorna resultados agrupados por tipo.

---

## 10. Notificações Internas

Sino no topbar com badge de contagem. Lista de alertas:
- Conteúdo atrasado
- Prazo chegando (produção / aprovação)
- Aprovação pendente há N dias
- Publicação em X dias
- Data comemorativa se aproximando

V1: somente dentro do sistema. V2: email/WhatsApp.

---

## 11. Dados Iniciais (Seed)

### Cliente DOALTO Elevadores
- Segmento: Elevadores e manutenção predial
- Regiões: Salvador, Recife, Aracaju, Bahia, Pernambuco, Sergipe
- Público: Síndicos, administradoras de condomínio, engenheiros

### Datas importantes pré-cadastradas (seleção)
| Data | Nome | Categoria | Gerar conteúdo |
|------|------|-----------|----------------|
| 30/11 | Dia do Síndico | Segmento | Sim |
| 15/10 | Dia do Engenheiro | Segmento | Sim |
| 25/12 | Natal | Comercial | Sim |
| 01/01 | Ano Novo | Comercial | Sim |
| 25/09 | Dia de Sergipe | Estadual (SE) | Radar |
| 06/09 | Independência da Bahia | Estadual (BA) | Radar |

---

## 12. O Que Fica para V2

- Portal do cliente: área separada onde cliente visualiza conteúdos, aprova ou solicita ajustes, com autenticação própria
- Gráficos de tempo de ciclo médio por formato
- Notificações por e-mail e/ou WhatsApp
- Multi-usuário / equipe
- Export de relatórios
- Integração com Meta Business Suite (agendamento direto)

---

## 13. Critério de Sucesso

O sistema é bem-sucedido se, ao abrir pela manhã, a usuária conseguir responder em menos de 30 segundos: **"O que eu preciso fazer hoje?"**

E se ao olhar para qualquer conteúdo souber imediatamente:
- O que é e para quem
- Quando será publicado
- Em que etapa está
- Qual foi a última ação
- Qual é a próxima ação
- Se depende dela ou do cliente
- Se está atrasado
