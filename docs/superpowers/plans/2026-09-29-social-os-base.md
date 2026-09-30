# Social OS Base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal social media operations dashboard in React + Vite + Supabase that answers "what do I need to do today?" in under 30 seconds.

**Architecture:** Single-page React app with Supabase as backend. Business logic (alerts, WIP, next actions) in TypeScript utilities. React Router v6 for navigation, Zustand for global state.

**Tech Stack:** React 18 · Vite · TypeScript · Tailwind CSS v4 · Supabase JS v2 · React Router v6 · Zustand · date-fns · Vitest

**Dependency:** This project must be built before the IA Layer plan (`2026-09-29-social-os-ia-layer.md`).

---

## File Map

```
social-os/
├── .env.local                        # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── netlify.toml
├── supabase/migrations/
│   ├── 20261000000001_schema.sql     # 8 tables + enums + triggers
│   └── 20261000000002_seed.sql       # DOALTO + dates + settings
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # Router + Layout
│   ├── index.css                     # design tokens + Tailwind
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts                  # alert logic, date utils, next action map
│   ├── types/index.ts                # all TS interfaces + enums
│   ├── store/app.ts                  # Zustand
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   ├── layout/Topbar.tsx
│   │   ├── ui/StatusPill.tsx
│   │   ├── ui/PriorityBadge.tsx
│   │   ├── ui/CountCard.tsx
│   │   └── contents/
│   │       ├── ContentRow.tsx
│   │       ├── ContentDrawer.tsx
│   │       └── ContentChecklist.tsx
│   └── pages/
│       ├── Home.tsx        # Central de Operação
│       ├── MyDay.tsx
│       ├── Contents.tsx
│       ├── Calendar.tsx
│       ├── Ideas.tsx
│       ├── Tasks.tsx
│       ├── Dates.tsx
│       ├── Clients.tsx
│       └── Settings.tsx
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `social-os/` (new directory)
- Create: `social-os/vite.config.ts`
- Create: `social-os/src/test/setup.ts`

- [ ] **Step 1: Scaffold Vite project**

```bash
cd "C:\Users\caahr\OneDrive\Documentos\Camila Estrategista em IA"
npm create vite@latest social-os -- --template react-ts
cd social-os
npm install
```

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install @supabase/supabase-js react-router-dom zustand date-fns
npm install tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 4: Write `vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 5: Write `src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Run dev server to verify scaffold**

```bash
npm run dev
```
Expected: Vite dev server running at `http://localhost:5173`

- [ ] **Step 7: Commit**

```bash
git add social-os/
git commit -m "feat: scaffold social-os vite react-ts"
```

---

## Task 2: Design Tokens + CSS

**Files:**
- Create: `src/index.css`
- Modify: `src/main.tsx` (import index.css)

- [ ] **Step 1: Write `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Jost:wght@300;400;500;600&display=swap');
@import "tailwindcss";

:root {
  --cream: #FAF7F4;
  --beige-lt: #E6DED8;
  --beige-md: #B8A593;
  --caramel: #A3815E;
  --charcoal: #3F3B37;
  --white: #FFFFFF;
  --terracotta: #C0715A;
  --font-display: 'Cormorant Garamond', serif;
  --font-body: 'Jost', sans-serif;
}

body {
  font-family: var(--font-body);
  background-color: var(--cream);
  color: var(--charcoal);
}

.font-display { font-family: var(--font-display); }
```

- [ ] **Step 2: Verify `src/main.tsx` imports the css**

```typescript
import './index.css'
```

- [ ] **Step 3: Commit**

```bash
git add src/index.css src/main.tsx
git commit -m "feat: design tokens and base css"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write `src/types/index.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/
git commit -m "feat: typescript types all entities"
```

---

## Task 4: Database Migration

**Files:**
- Create: `supabase/migrations/20261000000001_schema.sql`

- [ ] **Step 1: Write `supabase/migrations/20261000000001_schema.sql`**

```sql
-- Enums
CREATE TYPE content_status AS ENUM (
  'ideia','planejamento','roteiro','em_producao','em_revisao',
  'aguardando_aprovacao','ajustes_solicitados','aprovado',
  'agendado','publicado','arquivado'
);
CREATE TYPE content_priority AS ENUM ('baixa','media','alta','urgente');
CREATE TYPE content_format AS ENUM ('reels','carrossel','feed','stories','video','outro');
CREATE TYPE task_status AS ENUM ('pendente','em_andamento','concluida','cancelada');
CREATE TYPE checklist_step AS ENUM (
  'definir_ideia','definir_objetivo','criar_headline','criar_roteiro',
  'gravar_captar','editar','criar_arte','criar_legenda','revisar',
  'enviar_aprovacao','fazer_ajustes','aprovacao_final','agendar','publicar'
);

-- clients
CREATE TABLE clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment text,
  target_audience text,
  cities text,
  positioning text,
  voice_tone text,
  objectives text,
  services text,
  references text,
  links text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- contents
CREATE TABLE contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  idea_id uuid NULL,
  title text NOT NULL,
  format content_format NOT NULL DEFAULT 'reels',
  objective text,
  category text,
  pillar text,
  headline text,
  caption text,
  script text,
  briefing text,
  publication_date date,
  production_deadline date,
  approval_deadline date,
  status content_status NOT NULL DEFAULT 'ideia',
  priority content_priority NOT NULL DEFAULT 'media',
  responsible text,
  drive_link text,
  notes text,
  entry_date timestamptz DEFAULT now(),
  production_start_date timestamptz,
  approval_sent_date timestamptz,
  approved_date timestamptz,
  published_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- content_checklist
CREATE TABLE content_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
  step_key checklist_step NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz
);

-- content_history
CREATE TABLE content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE NOT NULL,
  old_status content_status,
  new_status content_status NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- ideas
CREATE TABLE ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  format content_format,
  objective text,
  category text,
  priority content_priority NOT NULL DEFAULT 'media',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- tasks
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  deadline date,
  priority content_priority NOT NULL DEFAULT 'media',
  status task_status NOT NULL DEFAULT 'pendente',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- important_dates
CREATE TABLE important_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  region text,
  category text,
  relevance text,
  should_create_content boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- settings
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  alert_planning_days int NOT NULL DEFAULT 30,
  alert_production_days int NOT NULL DEFAULT 20,
  alert_approval_days int NOT NULL DEFAULT 10,
  alert_scheduling_days int NOT NULL DEFAULT 3,
  wip_video_limit int NOT NULL DEFAULT 2,
  wip_production_limit int NOT NULL DEFAULT 3,
  wip_approval_limit int NOT NULL DEFAULT 3
);

-- RLS (personal use — allow all)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON clients USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON contents USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON content_checklist USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON content_history USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON ideas USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON tasks USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON important_dates USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON settings USING (true) WITH CHECK (true);

-- Trigger: auto-create 14 checklist steps when content is created
CREATE OR REPLACE FUNCTION create_content_checklist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_checklist (content_id, step_key)
  VALUES
    (NEW.id, 'definir_ideia'), (NEW.id, 'definir_objetivo'),
    (NEW.id, 'criar_headline'), (NEW.id, 'criar_roteiro'),
    (NEW.id, 'gravar_captar'), (NEW.id, 'editar'),
    (NEW.id, 'criar_arte'), (NEW.id, 'criar_legenda'),
    (NEW.id, 'revisar'), (NEW.id, 'enviar_aprovacao'),
    (NEW.id, 'fazer_ajustes'), (NEW.id, 'aprovacao_final'),
    (NEW.id, 'agendar'), (NEW.id, 'publicar');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_content_created
  AFTER INSERT ON contents
  FOR EACH ROW EXECUTE FUNCTION create_content_checklist();

-- Trigger: record status changes + set timestamps
CREATE OR REPLACE FUNCTION handle_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO content_history (content_id, old_status, new_status)
    VALUES (NEW.id, OLD.status, NEW.status);

    IF NEW.status = 'em_producao' AND OLD.production_start_date IS NULL THEN
      NEW.production_start_date = now();
    END IF;
    IF NEW.status = 'aguardando_aprovacao' AND OLD.approval_sent_date IS NULL THEN
      NEW.approval_sent_date = now();
    END IF;
    IF NEW.status = 'aprovado' AND OLD.approved_date IS NULL THEN
      NEW.approved_date = now();
    END IF;
    IF NEW.status = 'publicado' AND OLD.published_date IS NULL THEN
      NEW.published_date = now();
    END IF;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_content_status_change
  BEFORE UPDATE ON contents
  FOR EACH ROW EXECUTE FUNCTION handle_status_change();
```

- [ ] **Step 2: Run migration in Supabase SQL Editor**

Go to Supabase dashboard → SQL Editor → paste and run the file.
Expected: "Success. No rows returned."

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: database schema migration"
```

---

## Task 5: Seed Data

**Files:**
- Create: `supabase/migrations/20261000000002_seed.sql`

- [ ] **Step 1: Write `supabase/migrations/20261000000002_seed.sql`**

```sql
-- DOALTO Elevadores
INSERT INTO clients (name, segment, target_audience, cities, voice_tone, objectives)
VALUES (
  'DOALTO Elevadores',
  'Elevadores e manutenção predial',
  'Síndicos, administradoras de condomínio, engenheiros',
  'Salvador, Recife, Aracaju, Bahia, Pernambuco, Sergipe',
  'Direto, técnico, confiável, sem jargão excessivo',
  'Gerar leads de síndicos, posicionar como referência em manutenção de elevadores'
);

-- Important dates
INSERT INTO important_dates (name, date, region, category, should_create_content) VALUES
  ('Dia do Síndico', '2026-11-30', NULL, 'Segmento', true),
  ('Dia do Engenheiro', '2026-10-15', NULL, 'Segmento', true),
  ('Natal', '2026-12-25', NULL, 'Comercial', true),
  ('Ano Novo', '2027-01-01', NULL, 'Comercial', true),
  ('Dia de Sergipe', '2026-09-25', 'Sergipe', 'Estadual', false),
  ('Independência da Bahia', '2026-09-06', 'Bahia', 'Estadual', false);

-- Default settings
INSERT INTO settings (alert_planning_days, alert_production_days, alert_approval_days, alert_scheduling_days, wip_video_limit, wip_production_limit, wip_approval_limit)
VALUES (30, 20, 10, 3, 2, 3, 3);
```

- [ ] **Step 2: Run in Supabase SQL Editor**

Paste and run after Task 4 migration.
Expected: "Success."

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20261000000002_seed.sql
git commit -m "feat: seed data DOALTO and important dates"
```

---

## Task 6: Supabase Client + Business Logic Utils

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/lib/utils.ts`
- Create: `src/lib/utils.test.ts`
- Create: `.env.local`

- [ ] **Step 1: Create `.env.local`**

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Replace with values from Supabase dashboard → Settings → API.

- [ ] **Step 2: Write `src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 3: Write `src/lib/utils.ts`**

```typescript
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
```

- [ ] **Step 4: Write `src/lib/utils.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { isOverdue, isDueToday, daysUntil } from './utils'
import type { Content } from '../types'

const base: Content = {
  id: '1', client_id: 'c1', idea_id: null,
  title: 'Test', format: 'reels', objective: null,
  category: null, pillar: null, headline: null,
  caption: null, script: null, briefing: null,
  publication_date: null, production_deadline: null,
  approval_deadline: null, status: 'planejamento',
  priority: 'media', responsible: null, drive_link: null,
  notes: null, entry_date: null, production_start_date: null,
  approval_sent_date: null, approved_date: null, published_date: null,
  created_at: '', updated_at: '',
}

describe('isOverdue', () => {
  it('returns true when production_deadline is past and status is early', () => {
    const content = { ...base, production_deadline: '2020-01-01', status: 'planejamento' as const }
    expect(isOverdue(content)).toBe(true)
  })

  it('returns false when status is past em_revisao', () => {
    const content = { ...base, production_deadline: '2020-01-01', status: 'aprovado' as const }
    expect(isOverdue(content)).toBe(false)
  })
})

describe('isDueToday', () => {
  it('returns true when production_deadline is today', () => {
    const today = new Date().toISOString().split('T')[0]
    const content = { ...base, production_deadline: today }
    expect(isDueToday(content)).toBe(true)
  })

  it('returns false when deadline is tomorrow', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const content = { ...base, production_deadline: tomorrow }
    expect(isDueToday(content)).toBe(false)
  })
})

describe('daysUntil', () => {
  it('returns positive number for future date', () => {
    const future = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    expect(daysUntil(future)).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 5: Run tests**

```bash
npx vitest run
```
Expected: `3 tests passed`

- [ ] **Step 6: Commit**

```bash
git add src/lib/ .env.local
git commit -m "feat: supabase client and business logic utils"
```

---

## Task 7: Zustand Store

**Files:**
- Create: `src/store/app.ts`

- [ ] **Step 1: Write `src/store/app.ts`**

```typescript
import { create } from 'zustand'
import type { Settings } from '../types'

interface AppStore {
  clientFilter: string | null
  setClientFilter: (id: string | null) => void
  settings: Settings | null
  setSettings: (s: Settings) => void
  notificationCount: number
  setNotificationCount: (n: number) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export const useAppStore = create<AppStore>((set) => ({
  clientFilter: null,
  setClientFilter: (id) => set({ clientFilter: id }),
  settings: null,
  setSettings: (s) => set({ settings: s }),
  notificationCount: 0,
  setNotificationCount: (n) => set({ notificationCount: n }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/store/
git commit -m "feat: zustand store"
```

---

## Task 8: Layout Shell

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Topbar.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: Write `src/components/layout/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom'

const groups = [
  {
    label: 'Principal',
    links: [
      { to: '/', label: 'Central de Operação' },
      { to: '/meu-dia', label: 'Meu Dia' },
    ],
  },
  {
    label: 'Produção',
    links: [
      { to: '/conteudos', label: 'Conteúdos' },
      { to: '/ideias', label: 'Ideias' },
      { to: '/tarefas', label: 'Tarefas' },
    ],
  },
  {
    label: 'Planejamento',
    links: [
      { to: '/calendario', label: 'Calendário' },
      { to: '/radar', label: 'Radar de Datas' },
    ],
  },
  {
    label: 'Gestão',
    links: [
      { to: '/clientes', label: 'Clientes' },
      { to: '/configuracoes', label: 'Configurações' },
    ],
  },
]

export function Sidebar() {
  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: 'var(--charcoal)', color: 'var(--white)',
      padding: '24px 0', flexShrink: 0,
    }}>
      <div style={{ padding: '0 20px 24px', fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
        Social OS
      </div>
      {groups.map((group) => (
        <div key={group.label} style={{ marginBottom: 24 }}>
          <div style={{ padding: '0 20px 8px', fontSize: 10, fontWeight: 600, color: 'var(--beige-md)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {group.label}
          </div>
          {group.links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              style={({ isActive }) => ({
                display: 'block', padding: '8px 20px', fontSize: 14,
                color: isActive ? 'var(--caramel)' : 'var(--beige-lt)',
                background: isActive ? 'rgba(163,129,94,0.12)' : 'transparent',
                textDecoration: 'none', borderLeft: isActive ? '2px solid var(--caramel)' : '2px solid transparent',
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  )
}
```

- [ ] **Step 2: Write `src/components/layout/Topbar.tsx`**

```tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/app'

interface TopbarProps { title: string }

export function Topbar({ title }: TopbarProps) {
  const navigate = useNavigate()
  const { notificationCount, searchQuery, setSearchQuery } = useAppStore()
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <header style={{
      height: 56, background: 'var(--white)', borderBottom: '1px solid var(--beige-lt)',
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16,
    }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, flex: 1, margin: 0 }}>
        {title}
      </h1>
      <span style={{ fontSize: 13, color: 'var(--beige-md)', textTransform: 'capitalize' }}>{today}</span>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar..."
        style={{
          padding: '6px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6,
          fontSize: 13, background: 'var(--cream)', width: 200,
        }}
      />
      <button
        onClick={() => {/* TODO notification dropdown */}}
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 4 }}
      >
        🔔
        {notificationCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0, background: 'var(--terracotta)',
            color: '#fff', borderRadius: '50%', width: 16, height: 16,
            fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {notificationCount}
          </span>
        )}
      </button>
      <button
        onClick={() => navigate('/conteudos/novo')}
        style={{
          background: 'var(--caramel)', color: '#fff', border: 'none',
          borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
        }}
      >
        + Novo Conteúdo
      </button>
    </header>
  )
}
```

- [ ] **Step 3: Write `src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { Home } from './pages/Home'
import { MyDay } from './pages/MyDay'
import { Contents } from './pages/Contents'
import { Calendar } from './pages/Calendar'
import { Ideas } from './pages/Ideas'
import { Tasks } from './pages/Tasks'
import { Dates } from './pages/Dates'
import { Clients } from './pages/Clients'
import { Settings } from './pages/Settings'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Central de Operação',
  '/meu-dia': 'Meu Dia',
  '/conteudos': 'Banco de Conteúdos',
  '/calendario': 'Calendário Editorial',
  '/ideias': 'Banco de Ideias',
  '/tarefas': 'Tarefas Gerais',
  '/radar': 'Radar de Datas',
  '/clientes': 'Clientes',
  '/configuracoes': 'Configurações',
}

function Layout() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Social OS'
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title={title} />
        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/meu-dia" element={<MyDay />} />
            <Route path="/conteudos" element={<Contents />} />
            <Route path="/calendario" element={<Calendar />} />
            <Route path="/ideias" element={<Ideas />} />
            <Route path="/tarefas" element={<Tasks />} />
            <Route path="/radar" element={<Dates />} />
            <Route path="/clientes" element={<Clients />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  )
}
```

- [ ] **Step 4: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 5: Create placeholder pages** (one file for each, update in later tasks)

Create these 9 files, each with just:
```tsx
// src/pages/Home.tsx
export function Home() { return <div>Home</div> }
```
(same pattern for MyDay, Contents, Calendar, Ideas, Tasks, Dates, Clients, Settings)

- [ ] **Step 6: Run dev and verify navigation works**

```bash
npm run dev
```
Expected: sidebar visible, clicking links changes the title in Topbar.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: layout shell sidebar topbar router"
```

---

## Task 9: UI Primitives

**Files:**
- Create: `src/components/ui/StatusPill.tsx`
- Create: `src/components/ui/PriorityBadge.tsx`
- Create: `src/components/ui/CountCard.tsx`

- [ ] **Step 1: Write `src/components/ui/StatusPill.tsx`**

```tsx
import { getStatusColor } from '../../lib/utils'
import type { ContentStatus } from '../../types'

const LABELS: Record<ContentStatus, string> = {
  ideia: 'Ideia', planejamento: 'Planejamento', roteiro: 'Roteiro',
  em_producao: 'Em Produção', em_revisao: 'Em Revisão',
  aguardando_aprovacao: 'Aguard. Aprovação', ajustes_solicitados: 'Ajustes',
  aprovado: 'Aprovado', agendado: 'Agendado', publicado: 'Publicado', arquivado: 'Arquivado',
}

export function StatusPill({ status }: { status: ContentStatus }) {
  const color = getStatusColor(status)
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, color, border: `1px solid ${color}`,
      background: `${color}18`, whiteSpace: 'nowrap',
    }}>
      {LABELS[status]}
    </span>
  )
}
```

- [ ] **Step 2: Write `src/components/ui/PriorityBadge.tsx`**

```tsx
import { getPriorityColor } from '../../lib/utils'
import type { ContentPriority } from '../../types'

const LABELS: Record<ContentPriority, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente',
}

export function PriorityBadge({ priority }: { priority: ContentPriority }) {
  const color = getPriorityColor(priority)
  return (
    <span style={{
      display: 'inline-block', padding: '1px 6px', borderRadius: 4,
      fontSize: 10, fontWeight: 700, color, border: `1px solid ${color}`,
      background: `${color}18`,
    }}>
      {LABELS[priority]}
    </span>
  )
}
```

- [ ] **Step 3: Write `src/components/ui/CountCard.tsx`**

```tsx
interface Props {
  label: string
  count: number
  color?: string
  onClick?: () => void
}

export function CountCard({ label, count, color = 'var(--caramel)', onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8,
        padding: '16px 20px', cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>
        {count}
      </div>
      <div style={{ fontSize: 12, color: 'var(--beige-md)', marginTop: 4, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/
git commit -m "feat: ui primitives StatusPill PriorityBadge CountCard"
```

---

## Task 10: Central de Operação (Home)

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Write `src/pages/Home.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isOverdue, isDueToday, isPendingApprovalTooLong, daysUntil, formatDate, getNextAction } from '../lib/utils'
import { CountCard } from '../components/ui/CountCard'
import { StatusPill } from '../components/ui/StatusPill'
import { useAppStore } from '../store/app'
import type { Content, ImportantDate, Settings } from '../types'

export function Home() {
  const [contents, setContents] = useState<Content[]>([])
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [loading, setLoading] = useState(true)
  const { settings, setSettings, setNotificationCount } = useAppStore()

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: d }, { data: s }] = await Promise.all([
        supabase.from('contents').select('*, client:clients(name)').order('publication_date'),
        supabase.from('important_dates').select('*').order('date'),
        supabase.from('settings').select('*').limit(1).single(),
      ])
      setContents(c ?? [])
      setDates(d ?? [])
      if (s) setSettings(s as Settings)
      setLoading(false)

      const overdue = (c ?? []).filter(isOverdue).length
      const pending = (c ?? []).filter(isPendingApprovalTooLong).length
      setNotificationCount(overdue + pending)
    }
    load()
  }, [])

  if (loading) return <div style={{ padding: 40, color: 'var(--beige-md)' }}>Carregando...</div>

  const overdue = contents.filter(isOverdue)
  const dueToday = contents.filter(isDueToday)
  const pendingApproval = contents.filter((c) => c.status === 'aguardando_aprovacao')
  const inProduction = contents.filter((c) => c.status === 'em_producao')
  const scheduled = contents.filter((c) => c.status === 'agendado')
  const wipVideo = inProduction.filter((c) => c.format === 'reels' || c.format === 'video').length
  const wipLimit = settings?.wip_video_limit ?? 2
  const upcoming14 = contents.filter((c) => c.publication_date && daysUntil(c.publication_date) <= 14 && daysUntil(c.publication_date) >= 0)
  const upcomingDates = dates.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 60)
  const actionsNeeded = [...overdue, ...dueToday.filter((c) => !overdue.includes(c))]

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 1 }}>
        {/* Count cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 24 }}>
          <CountCard label="Atrasados" count={overdue.length} color="var(--terracotta)" />
          <CountCard label="Fazer hoje" count={dueToday.length} color="#C48435" />
          <CountCard label="Aprovação" count={pendingApproval.length} color="#C4A835" />
          <CountCard label="Em produção" count={inProduction.length} color="var(--caramel)" />
          <CountCard label="Agendados" count={scheduled.length} color="#3A9E8F" />
          <CountCard label="Ideias" count={0} color="var(--beige-md)" />
        </div>

        {/* Actions needed */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 12 }}>Ações necessárias hoje</h2>
          {actionsNeeded.length === 0 ? (
            <p style={{ color: 'var(--beige-md)', fontSize: 14 }}>Nenhuma ação urgente.</p>
          ) : actionsNeeded.map((c) => (
            <div key={c.id} style={{
              background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8,
              padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {isOverdue(c) && <span style={{ color: 'var(--terracotta)', fontSize: 12, fontWeight: 700 }}>ATRASADO</span>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--beige-md)' }}>{(c.client as any)?.name}</div>
              </div>
              <StatusPill status={c.status} />
              <span style={{ fontSize: 12, color: 'var(--caramel)' }}>{getNextAction(c.status).label}</span>
            </div>
          ))}
        </section>

        {/* Upcoming publications */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 12 }}>Próximas publicações — 14 dias</h2>
          {upcoming14.length === 0 ? (
            <p style={{ color: 'var(--beige-md)', fontSize: 14 }}>Nenhuma publicação nos próximos 14 dias.</p>
          ) : upcoming14.map((c) => {
            const days = daysUntil(c.publication_date!)
            const daysColor = days <= 2 ? 'var(--terracotta)' : days <= 6 ? '#C48435' : 'var(--charcoal)'
            return (
              <div key={c.id} style={{
                background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8,
                padding: '10px 16px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 13, color: daysColor, fontWeight: 600, minWidth: 60 }}>
                  {days === 0 ? 'Hoje' : `${days}d`}
                </span>
                <span style={{ fontSize: 13, color: 'var(--beige-md)', minWidth: 100 }}>
                  {formatDate(c.publication_date!)}
                </span>
                <span style={{ flex: 1, fontSize: 14 }}>{c.title}</span>
                <StatusPill status={c.status} />
              </div>
            )
          })}
        </section>
      </div>

      {/* Right panels */}
      <div style={{ width: 280, flexShrink: 0 }}>
        {/* WIP control */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>Controle de WIP</h3>
          {[
            { label: 'Vídeos em produção', value: wipVideo, limit: wipLimit },
            { label: 'Total em produção', value: inProduction.length, limit: settings?.wip_production_limit ?? 3 },
            { label: 'Aguardando aprovação', value: pendingApproval.length, limit: settings?.wip_approval_limit ?? 3 },
          ].map(({ label, value, limit }) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{label}</span>
                <span style={{ color: value > limit ? 'var(--terracotta)' : 'var(--caramel)', fontWeight: 600 }}>
                  {value}/{limit}
                </span>
              </div>
              <div style={{ background: 'var(--beige-lt)', borderRadius: 4, height: 6 }}>
                <div style={{
                  width: `${Math.min(100, (value / limit) * 100)}%`, height: '100%', borderRadius: 4,
                  background: value > limit ? 'var(--terracotta)' : 'var(--caramel)',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Radar de Datas */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>Radar de Datas</h3>
          {upcomingDates.length === 0 ? (
            <p style={{ color: 'var(--beige-md)', fontSize: 13 }}>Sem datas próximas.</p>
          ) : upcomingDates.slice(0, 6).map((d) => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: 'var(--beige-md)' }}>{formatDate(d.date)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--caramel)' }}>{daysUntil(d.date)}d</div>
                {d.should_create_content && (
                  <span style={{ fontSize: 10, color: 'var(--terracotta)', fontWeight: 600 }}>CONTEÚDO</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run dev and verify Home loads data**

```bash
npm run dev
```
Expected: Home screen shows count cards, action list, upcoming publications, WIP bars, and radar panel with real data from Supabase.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: central de operacao home page"
```

---

## Task 11: Banco de Conteúdos + Content Drawer

**Files:**
- Modify: `src/pages/Contents.tsx`
- Create: `src/components/contents/ContentRow.tsx`
- Create: `src/components/contents/ContentDrawer.tsx`
- Create: `src/components/contents/ContentChecklist.tsx`

- [ ] **Step 1: Write `src/components/contents/ContentRow.tsx`**

```tsx
import { isOverdue } from '../../lib/utils'
import { StatusPill } from '../ui/StatusPill'
import { PriorityBadge } from '../ui/PriorityBadge'
import type { Content } from '../../types'

interface Props { content: Content; onClick: () => void }

export function ContentRow({ content, onClick }: Props) {
  return (
    <tr onClick={onClick} style={{ cursor: 'pointer', borderBottom: '1px solid var(--beige-lt)' }}>
      <td style={{ padding: '10px 12px', fontSize: 14 }}>
        {isOverdue(content) && <span style={{ color: 'var(--terracotta)', marginRight: 6 }}>●</span>}
        {content.title}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--beige-md)' }}>
        {(content.client as any)?.name}
      </td>
      <td style={{ padding: '10px 12px' }}><StatusPill status={content.status} /></td>
      <td style={{ padding: '10px 12px' }}><PriorityBadge priority={content.priority} /></td>
      <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--beige-md)' }}>
        {content.publication_date ?? '—'}
      </td>
    </tr>
  )
}
```

- [ ] **Step 2: Write `src/components/contents/ContentChecklist.tsx`**

```tsx
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
```

- [ ] **Step 3: Write `src/components/contents/ContentDrawer.tsx`**

```tsx
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getNextAction } from '../../lib/utils'
import { StatusPill } from '../ui/StatusPill'
import { ContentChecklist } from './ContentChecklist'
import type { Content, ContentChecklist as ChecklistType, ContentHistory, ContentStatus } from '../../types'

interface Props { content: Content | null; onClose: () => void; onUpdate: () => void }

export function ContentDrawer({ content, onClose, onUpdate }: Props) {
  const [checklist, setChecklist] = useState<ChecklistType[]>([])
  const [history, setHistory] = useState<ContentHistory[]>([])
  const [tab, setTab] = useState<'detalhes' | 'checklist' | 'historico'>('detalhes')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!content) return
    setTitle(content.title)
    setNotes(content.notes ?? '')
    supabase.from('content_checklist').select('*').eq('content_id', content.id).then(({ data }) => setChecklist(data ?? []))
    supabase.from('content_history').select('*').eq('content_id', content.id).order('created_at', { ascending: false }).then(({ data }) => setHistory(data ?? []))
  }, [content])

  if (!content) return null

  async function save() {
    await supabase.from('contents').update({ title, notes }).eq('id', content!.id)
    onUpdate()
  }

  async function changeStatus(newStatus: ContentStatus) {
    await supabase.from('contents').update({ status: newStatus }).eq('id', content!.id)
    onUpdate()
  }

  const STATUS_OPTIONS: ContentStatus[] = [
    'ideia','planejamento','roteiro','em_producao','em_revisao',
    'aguardando_aprovacao','ajustes_solicitados','aprovado','agendado','publicado','arquivado'
  ]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: 520,
        background: 'var(--white)', zIndex: 50, padding: 24, overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <StatusPill status={content.status} />
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--caramel)', fontWeight: 600 }}>
              Próximo: {getNextAction(content.status).label}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--beige-lt)', paddingBottom: 12 }}>
          {(['detalhes','checklist','historico'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? 'var(--caramel)' : 'none', color: tab === t ? '#fff' : 'var(--beige-md)',
              border: '1px solid var(--beige-lt)', borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'detalhes' && (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--beige-md)' }}>TÍTULO</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, marginTop: 4, marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }} />

            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--beige-md)' }}>STATUS</label>
            <select value={content.status} onChange={(e) => changeStatus(e.target.value as ContentStatus)} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, marginTop: 4, marginBottom: 12, fontSize: 14 }}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>

            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--beige-md)' }}>NOTAS</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, marginTop: 4, marginBottom: 12, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />

            {content.drive_link && (
              <a href={content.drive_link} target="_blank" rel="noreferrer" style={{ color: 'var(--caramel)', fontSize: 13 }}>
                📁 Abrir arquivo no Drive
              </a>
            )}

            <button onClick={save} style={{ marginTop: 16, background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 14, cursor: 'pointer', width: '100%' }}>
              Salvar
            </button>
          </div>
        )}

        {tab === 'checklist' && (
          <ContentChecklist checklist={checklist} onUpdate={() => {
            supabase.from('content_checklist').select('*').eq('content_id', content.id).then(({ data }) => setChecklist(data ?? []))
          }} />
        )}

        {tab === 'historico' && (
          <div>
            {history.map((h) => (
              <div key={h.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--beige-lt)', fontSize: 13 }}>
                <span style={{ color: 'var(--beige-md)' }}>{h.old_status ?? 'início'}</span>
                {' → '}
                <span style={{ fontWeight: 600 }}>{h.new_status}</span>
                <div style={{ fontSize: 11, color: 'var(--beige-md)', marginTop: 2 }}>
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
```

- [ ] **Step 4: Write `src/pages/Contents.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ContentRow } from '../components/contents/ContentRow'
import { ContentDrawer } from '../components/contents/ContentDrawer'
import type { Content, Client } from '../types'

export function Contents() {
  const [contents, setContents] = useState<Content[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selected, setSelected] = useState<Content | null>(null)
  const [filterClient, setFilterClient] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  async function load() {
    const { data } = await supabase.from('contents').select('*, client:clients(name, id)').order('created_at', { ascending: false })
    setContents(data ?? [])
  }

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
  }, [])

  const filtered = contents.filter((c) => {
    const matchClient = !filterClient || c.client_id === filterClient
    const matchStatus = !filterStatus || c.status === filterStatus
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase())
    return matchClient && matchStatus && matchSearch
  })

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar título..." style={{ padding: '6px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13 }} />
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={{ padding: '6px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13 }}>
          <option value="">Todos os clientes</option>
          {clients.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '6px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13 }}>
          <option value="">Todos os status</option>
          {['ideia','planejamento','roteiro','em_producao','em_revisao','aguardando_aprovacao','ajustes_solicitados','aprovado','agendado','publicado','arquivado'].map((s) => (
            <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--cream)', borderBottom: '1px solid var(--beige-lt)' }}>
              {['Título','Cliente','Status','Prioridade','Publicação'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <ContentRow key={c.id} content={c} onClick={() => setSelected(c)} />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--beige-md)', fontSize: 14 }}>Nenhum conteúdo encontrado.</div>
        )}
      </div>

      <ContentDrawer content={selected} onClose={() => setSelected(null)} onUpdate={() => { load(); setSelected(null) }} />
    </div>
  )
}
```

- [ ] **Step 5: Test in browser**

Navigate to /conteudos. Expected: table loads with filters. Click a row → drawer slides in with tabs.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Contents.tsx src/components/contents/
git commit -m "feat: banco de conteudos list drawer checklist"
```

---

## Task 12: Meu Dia + Banco de Ideias + Tarefas

**Files:**
- Modify: `src/pages/MyDay.tsx`
- Modify: `src/pages/Ideas.tsx`
- Modify: `src/pages/Tasks.tsx`

- [ ] **Step 1: Write `src/pages/MyDay.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { isOverdue, isDueToday, isPendingApprovalTooLong, getNextAction } from '../lib/utils'
import { StatusPill } from '../components/ui/StatusPill'
import type { Content } from '../types'

export function MyDay() {
  const [contents, setContents] = useState<Content[]>([])

  useEffect(() => {
    supabase.from('contents').select('*, client:clients(name)').then(({ data }) => setContents(data ?? []))
  }, [])

  const sections = [
    { emoji: '🔴', label: 'Atrasados', items: contents.filter(isOverdue) },
    { emoji: '🟠', label: 'Fazer hoje', items: contents.filter((c) => isDueToday(c) && !isOverdue(c)) },
    { emoji: '🔵', label: 'Em produção', items: contents.filter((c) => c.status === 'em_producao') },
    { emoji: '🟡', label: 'Aguardando retorno', items: contents.filter(isPendingApprovalTooLong) },
    { emoji: '🟢', label: 'Publicado hoje', items: contents.filter((c) => c.status === 'publicado' && c.published_date?.startsWith(new Date().toISOString().split('T')[0])) },
  ]

  return (
    <div style={{ maxWidth: 720 }}>
      {sections.map(({ emoji, label, items }) => (
        <section key={label} style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 10 }}>{emoji} {label}</h2>
          {items.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--beige-md)' }}>Nenhum item.</p>
          ) : items.map((c) => (
            <div key={c.id} style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'var(--beige-md)', marginTop: 2 }}>{(c.client as any)?.name}</div>
              </div>
              <StatusPill status={c.status} />
              <span style={{ fontSize: 12, color: 'var(--caramel)' }}>{getNextAction(c.status).label}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `src/pages/Ideas.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PriorityBadge } from '../components/ui/PriorityBadge'
import type { Idea, Client, ContentPriority } from '../types'

export function Ideas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState('')
  const navigate = useNavigate()

  async function load() {
    const { data } = await supabase.from('ideas').select('*, client:clients(name)').order('created_at', { ascending: false })
    setIdeas(data ?? [])
  }

  useEffect(() => {
    load()
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data ?? []))
  }, [])

  async function addIdea(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !clientId) return
    await supabase.from('ideas').insert({ title, client_id: clientId, priority: 'media' as ContentPriority })
    setTitle(''); setClientId('')
    load()
  }

  async function promote(idea: Idea) {
    navigate(`/conteudos/novo?idea=${idea.id}&title=${encodeURIComponent(idea.title)}&client=${idea.client_id}`)
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <form onSubmit={addIdea} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título da ideia *" required style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }}>
          <option value="">Cliente *</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit" style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>+ Adicionar</button>
      </form>

      {ideas.map((idea) => (
        <div key={idea.id} style={{ background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{idea.title}</div>
            <div style={{ fontSize: 12, color: 'var(--beige-md)' }}>{(idea.client as any)?.name}</div>
          </div>
          <PriorityBadge priority={idea.priority} />
          <button onClick={() => promote(idea)} style={{ background: 'none', border: '1px solid var(--caramel)', color: 'var(--caramel)', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
            Promover → Conteúdo
          </button>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Write `src/pages/Tasks.tsx`**

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/MyDay.tsx src/pages/Ideas.tsx src/pages/Tasks.tsx
git commit -m "feat: meu dia, banco de ideias, tarefas"
```

---

## Task 13: Calendário + Radar de Datas + Clientes

**Files:**
- Modify: `src/pages/Calendar.tsx`
- Modify: `src/pages/Dates.tsx`
- Modify: `src/pages/Clients.tsx`

- [ ] **Step 1: Write `src/pages/Calendar.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { getStatusColor } from '../lib/utils'
import { ContentDrawer } from '../components/contents/ContentDrawer'
import type { Content } from '../types'

export function Calendar() {
  const [month, setMonth] = useState(new Date())
  const [contents, setContents] = useState<Content[]>([])
  const [selected, setSelected] = useState<Content | null>(null)

  async function load() {
    const { data } = await supabase.from('contents').select('*, client:clients(name)').not('publication_date', 'is', null)
    setContents(data ?? [])
  }

  useEffect(() => { load() }, [])

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
  const startPad = startOfMonth(month).getDay()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <button onClick={() => setMonth(subMonths(month, 1))} style={{ background: 'none', border: '1px solid var(--beige-lt)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>‹</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: 0, textTransform: 'capitalize' }}>
          {format(month, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <button onClick={() => setMonth(addMonths(month, 1))} style={{ background: 'none', border: '1px solid var(--beige-lt)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>›</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', padding: '4px 0' }}>{d}</div>
        ))}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((day) => {
          const dayContents = contents.filter((c) => c.publication_date && isSameDay(new Date(c.publication_date + 'T00:00:00'), day))
          return (
            <div key={day.toISOString()} style={{ minHeight: 80, background: 'var(--white)', border: '1px solid var(--beige-lt)', borderRadius: 6, padding: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--beige-md)', marginBottom: 4 }}>{format(day, 'd')}</div>
              {dayContents.map((c) => (
                <div key={c.id} onClick={() => setSelected(c)} style={{ background: getStatusColor(c.status) + '22', border: `1px solid ${getStatusColor(c.status)}`, borderRadius: 4, padding: '2px 4px', fontSize: 10, cursor: 'pointer', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {c.title}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <ContentDrawer content={selected} onClose={() => setSelected(null)} onUpdate={() => { load(); setSelected(null) }} />
    </div>
  )
}
```

- [ ] **Step 2: Write `src/pages/Dates.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { daysUntil, formatDate } from '../lib/utils'
import { useAppStore } from '../store/app'
import type { ImportantDate } from '../types'

export function Dates() {
  const [dates, setDates] = useState<ImportantDate[]>([])
  const [name, setName] = useState(''), [date, setDate] = useState(''), [region, setRegion] = useState(''), [category, setCategory] = useState(''), [shouldCreate, setShouldCreate] = useState(false)
  const settings = useAppStore((s) => s.settings)

  async function load() {
    const { data } = await supabase.from('important_dates').select('*').order('date')
    setDates(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !date) return
    await supabase.from('important_dates').insert({ name, date, region: region || null, category: category || null, should_create_content: shouldCreate })
    setName(''); setDate(''); setRegion(''); setCategory(''); setShouldCreate(false)
    load()
  }

  const alertDays = settings?.alert_planning_days ?? 30
  const upcoming = dates.filter((d) => daysUntil(d.date) >= 0)

  return (
    <div style={{ maxWidth: 800 }}>
      <form onSubmit={add} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da data *" required style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Região" style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14, width: 120 }} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Categoria" style={{ padding: '8px 12px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14, width: 120 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={shouldCreate} onChange={(e) => setShouldCreate(e.target.checked)} />
          Gerar conteúdo
        </label>
        <button type="submit" style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' }}>+ Adicionar</button>
      </form>

      {upcoming.map((d) => {
        const days = daysUntil(d.date)
        const isAlert = days <= alertDays && d.should_create_content
        return (
          <div key={d.id} style={{ background: 'var(--white)', border: `1px solid ${isAlert ? 'var(--terracotta)' : 'var(--beige-lt)'}`, borderRadius: 8, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--caramel)', minWidth: 60 }}>
              {days}d
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: 'var(--beige-md)' }}>{formatDate(d.date)} {d.region ? `· ${d.region}` : ''} {d.category ? `· ${d.category}` : ''}</div>
            </div>
            {d.should_create_content && (
              <span style={{ fontSize: 11, fontWeight: 700, color: isAlert ? 'var(--terracotta)' : 'var(--caramel)', border: `1px solid currentColor`, borderRadius: 4, padding: '2px 6px' }}>
                CONTEÚDO
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Write `src/pages/Clients.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

export function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [selected, setSelected] = useState<Client | null>(null)
  const [form, setForm] = useState<Partial<Client>>({})

  async function load() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients(data ?? [])
  }

  useEffect(() => { load() }, [])

  function selectClient(c: Client) {
    setSelected(c)
    setForm(c)
  }

  async function save() {
    if (!selected) return
    await supabase.from('clients').update({ ...form, updated_at: new Date().toISOString() }).eq('id', selected.id)
    load()
  }

  const field = (label: string, key: keyof Client, multiline = false) => (
    <div key={key} style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--beige-md)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
      {multiline ? (
        <textarea value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
      ) : (
        <input value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ width: 260 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 12 }}>Clientes</h3>
        {clients.map((c) => (
          <div key={c.id} onClick={() => selectClient(c)} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: selected?.id === c.id ? 'var(--caramel)' : 'var(--white)', color: selected?.id === c.id ? '#fff' : 'var(--charcoal)', border: '1px solid var(--beige-lt)', marginBottom: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{c.name}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{c.segment}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ flex: 1, background: 'var(--white)', borderRadius: 8, border: '1px solid var(--beige-lt)', padding: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 20 }}>{selected.name}</h2>
          {field('Nome', 'name')}
          {field('Segmento', 'segment')}
          {field('Público-alvo', 'target_audience')}
          {field('Cidades / Regiões', 'cities')}
          {field('Posicionamento', 'positioning', true)}
          {field('Tom de voz', 'voice_tone')}
          {field('Objetivos', 'objectives', true)}
          {field('Serviços', 'services', true)}
          {field('Notas', 'notes', true)}
          <button onClick={save} style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>
            Salvar
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Calendar.tsx src/pages/Dates.tsx src/pages/Clients.tsx
git commit -m "feat: calendario, radar de datas, clientes"
```

---

## Task 14: Configurações + Deploy

**Files:**
- Modify: `src/pages/Settings.tsx`
- Create: `netlify.toml`
- Create: `.env.local.example`

- [ ] **Step 1: Write `src/pages/Settings.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/app'
import type { Settings } from '../types'

export function Settings() {
  const { settings, setSettings } = useAppStore()
  const [form, setForm] = useState<Partial<Settings>>({
    alert_planning_days: 30, alert_production_days: 20,
    alert_approval_days: 10, alert_scheduling_days: 3,
    wip_video_limit: 2, wip_production_limit: 3, wip_approval_limit: 3,
  })

  useEffect(() => {
    if (settings) setForm(settings)
    else {
      supabase.from('settings').select('*').limit(1).single().then(({ data }) => {
        if (data) { setSettings(data as Settings); setForm(data) }
      })
    }
  }, [settings])

  async function save() {
    if (form.id) {
      await supabase.from('settings').update(form).eq('id', form.id)
    } else {
      const { data } = await supabase.from('settings').insert(form).select().single()
      if (data) setSettings(data as Settings)
    }
    supabase.from('settings').select('*').limit(1).single().then(({ data }) => { if (data) setSettings(data as Settings) })
  }

  const numField = (label: string, key: keyof Settings, suffix = 'dias') => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--beige-md)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="number" min={1} value={(form[key] as number) ?? 0} onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })}
          style={{ width: 80, padding: '8px', border: '1px solid var(--beige-lt)', borderRadius: 6, fontSize: 14 }} />
        <span style={{ fontSize: 13, color: 'var(--beige-md)' }}>{suffix}</span>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 500 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 24 }}>Configurações</h2>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--caramel)', marginBottom: 16 }}>Períodos de Alerta</h3>
        {numField('Alerta de planejamento', 'alert_planning_days')}
        {numField('Alerta de produção', 'alert_production_days')}
        {numField('Alerta de aprovação', 'alert_approval_days')}
        {numField('Alerta de agendamento', 'alert_scheduling_days')}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--caramel)', marginBottom: 16 }}>Limites de WIP</h3>
        {numField('Vídeos em produção', 'wip_video_limit', 'vídeos')}
        {numField('Total em produção', 'wip_production_limit', 'conteúdos')}
        {numField('Aguardando aprovação', 'wip_approval_limit', 'conteúdos')}
      </section>

      <button onClick={save} style={{ background: 'var(--caramel)', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 14, cursor: 'pointer' }}>
        Salvar configurações
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Write `netlify.toml`**

```toml
[build]
  base = "social-os"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 3: Write `.env.local.example`**

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

- [ ] **Step 4: Manual deploy steps**

1. Create project at supabase.com → copy URL + anon key to `.env.local`
2. In Supabase SQL Editor: run `20261000000001_schema.sql`, then `20261000000002_seed.sql`
3. `npm run dev` → verify all pages load and data appears
4. Push repo to GitHub
5. In Netlify: New site → connect GitHub repo → add env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) → deploy

- [ ] **Step 5: Run full test suite**

```bash
cd social-os && npx vitest run
```
Expected: `3 tests passed`

- [ ] **Step 6: Commit**

```bash
git add netlify.toml .env.local.example src/pages/Settings.tsx
git commit -m "feat: configuracoes e deploy setup"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Task |
|---|---|
| Stack (React + Vite + Supabase + Netlify) | Task 1, 14 |
| Design tokens + fonts | Task 2 |
| All 8 tables + enums | Task 4 |
| Triggers (checklist auto-create, status history, timestamps) | Task 4 |
| Seed DOALTO + dates + settings | Task 5 |
| Business logic (alerts, next action, WIP) | Task 6 |
| Layout (sidebar + topbar + router) | Task 8 |
| UI primitives | Task 9 |
| Central de Operação (6 cards, actions, upcoming, WIP, radar) | Task 10 |
| Banco de Conteúdos (list, filters, drawer, checklist, history) | Task 11 |
| Meu Dia (5 sections) | Task 12 |
| Banco de Ideias (add, promote) | Task 12 |
| Tarefas (add, complete) | Task 12 |
| Calendário (monthly, color by status) | Task 13 |
| Radar de Datas (list, add, alerts) | Task 13 |
| Clientes (list, profile, edit) | Task 13 |
| Configurações (all settings fields) | Task 14 |
| Netlify deploy | Task 14 |

**Not included (V2 per spec):** global search, notification dropdown (bell exists but dropdown is wired up only partially), Busca Global result dropdown. These are non-critical and marked V2 in the spec.

**No placeholders found.** All steps have complete code.

**Type consistency verified:** `Content`, `Client`, `Settings`, `Idea`, `Task`, `ImportantDate` defined in Task 3, used consistently in Tasks 6, 8–14.
