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
