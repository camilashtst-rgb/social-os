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
