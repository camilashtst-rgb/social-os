# Social OS — IA Layer
**Data:** 2026-09-29
**Status:** Aprovado — pronto para implementação
**Dependência:** Construído sobre o Social OS (spec: `2026-09-21-social-os-design.md`)
**Stack adicional:** Claude API (Anthropic) · Exa API · Supabase Edge Functions

---

## 1. Objetivo

Adicionar inteligência de IA ao Social OS existente para resolver duas dores centrais da operação:

- **B — Decidir o que criar:** pesquisa de tendências, engenharia reversa de viral, geração de roteiro/legenda calibrada ao avatar do cliente
- **D — Visão do todo / prioridade:** briefing gerado automaticamente ao abrir o sistema — "o que preciso fazer agora e por quê"

---

## 2. Escopo

### 2.1 Incluído nesta fase
- Seção "Contexto para IA" no perfil de cada cliente (`avatar_doc` + `brain_doc`)
- Botões IA no detalhe do conteúdo: Gerar roteiro · Gerar legenda · Multiplicar conteúdo · Engenharia reversa de link
- Pesquisa proativa de virais por nicho (Exa API)
- Briefing inteligente na Central de Operação (gerado ao abrir)

### 2.2 Fora do escopo (V2)
- Chat conversacional com o sistema
- Painel proativo automático (push de tendências sem ação da usuária)
- Biblioteca de frameworks salvos
- Notificações por WhatsApp / e-mail
- Streaming simultâneo para redes sociais

---

## 3. Stack

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Frontend | React + Vite (existente) | Sem mudança de stack |
| AI — geração | Claude API · `claude-haiku-4-5-20251001` | Rápido, barato para geração de copy |
| AI — análise complexa | Claude API · `claude-sonnet-4-6` | Multiplicação de conteúdo · engenharia reversa · pesquisa viral |
| Busca web | Exa API | Busca semântica por nicho |
| Backend / segredo de chaves | Supabase Edge Functions | API keys nunca no frontend |
| DB | Supabase PostgreSQL (existente) | Campos novos via migration |

---

## 4. Mudanças no Modelo de Dados

### 4.1 Tabela `clients` — campos novos
```
avatar_doc        text   -- markdown completo do avatar/ICP (ex: avatar-2026-05-14.md)
brain_doc         text   -- markdown do business brain (ICP, ofertas, voice 3+3, regra-âncora)
sales_letter_doc  text   -- carta de vendas completa: voz, objeções respondidas, social proof, mecanismo único
```

### 4.2 Tabela `contents` — campos novos
```
transcription      text   -- transcrição bruta do vídeo do Alves
headline_youtube   text   -- título para o YouTube (descritivo/insight)
```

### 4.3 Renomeação
- `headline` → `headline_instagram` (breaking change — requer migration + update no frontend)

---

## 5. Injeção Automática de Contexto

Toda chamada de IA para conteúdos de um cliente injeta automaticamente o seguinte bloco no system prompt, montado pela Edge Function via query no banco:

```
# CONTEXTO DO CLIENTE
Cliente: {clients.name}
Segmento: {clients.segment}
Regiões: {clients.cities}

## AVATAR / ICP
{clients.avatar_doc}
<!-- inclui: Schwartz awareness level, sophistication level, dor profunda, desejo, objeções, gatilhos -->

## BUSINESS BRAIN
{clients.brain_doc}
<!-- inclui: ICP, ofertas, voice 3 sempre + 3 nunca, regra-âncora -->

## CARTA DE VENDAS (referência de voz e narrativa)
{clients.sales_letter_doc}
<!-- inclui: tom do Vandilson, objeções respondidas, social proof, mecanismo #NovoTempoDOALTO -->

## REFERÊNCIA DE COPY
Framework: Eugene Schwartz — Breakthrough Advertising
Regra: declare awareness level e sophistication level no início de cada peça gerada.
Awareness do avatar: {avatar_awareness_level}/5 — escreva para esse nível.
Sophistication do mercado: {avatar_sophistication_level}/5 — evite promessas genéricas já ouvidas.

## CONTEÚDO ATUAL
Formato: {contents.format}
Objetivo: {contents.objective}
Pilar: {contents.pillar}
Título: {contents.title}
```

Se `avatar_doc` ou `brain_doc` estiverem vazios, a Edge Function usa os campos estruturados existentes como fallback (segment, target_audience, voice_tone). `sales_letter_doc` é opcional — quando presente, tem precedência para calibração de tom e objeções.

---

## 6. Features

### 6.1 Seção "Contexto para IA" — Perfil do Cliente

**Onde:** Tela de perfil do cliente (tab ou seção colapsável)

**UI:**
- Três textareas markdown editáveis: "Avatar / ICP", "Business Brain" e "Carta de Vendas"
- Botão "Salvar contexto"
- Badge "IA configurada ✓" quando pelo menos `avatar_doc` + `brain_doc` estão preenchidos
- Badge "IA completa ✓✓" quando os três campos estão preenchidos

**Comportamento:**
- Conteúdo é salvo em `clients.avatar_doc`, `clients.brain_doc` e `clients.sales_letter_doc`
- Seed inicial para DOALTO: inserido via migration com `avatar-2026-05-14.md`, `business-brain.md` e a carta de vendas completa do Vandilson Alves

---

### 6.2 Botões IA — Detalhe do Conteúdo

**Onde:** Seção "Assistente de Conteúdo" no detalhe/drawer do conteúdo, visível apenas quando `clients.avatar_doc` ou `clients.brain_doc` estão preenchidos.

#### 6.2.1 Gerar Roteiro
- Chama Edge Function `ai-generate-script`
- Modelo: `claude-haiku-4-5-20251001`
- Prompt inclui: contexto do cliente + `contents.title` + `contents.format` + `contents.objective` + `contents.pillar`
- Instrução de formato: hook (3s) + problema + solução + CTA
- Resultado renderizado como texto editável
- Botões: "Salvar no script" (salva em `contents.script`) · "Gerar nova versão"

#### 6.2.2 Gerar Legenda
- Chama Edge Function `ai-generate-caption`
- Modelo: `claude-haiku-4-5-20251001`
- Usa `contents.script` se preenchido, senão usa título + objetivo
- Inclui: abertura de hook, corpo, hashtags (5 relevantes), CTA
- Botão: "Salvar na legenda" (salva em `contents.caption`)

#### 6.2.3 Engenharia Reversa de Link
- Input: campo de texto para URL (Reels ou TikTok)
- Chama Edge Function `ai-reverse-engineer`
- Modelo: `claude-sonnet-4-6`
- A Edge Function tenta fetch do conteúdo da URL via Exa API (`contents` endpoint) antes de passar ao Claude
- **Limitação:** Instagram e TikTok bloqueiam scraping. Fallback: se Exa não retornar conteúdo, o sistema exibe um campo "Cole a transcrição ou descrição do vídeo" para a usuária preencher manualmente, e o Claude analisa esse texto
- Output:
  - Framework identificado (hook, estrutura, CTA)
  - Adaptação para o cliente atual (título sugerido + roteiro adaptado)
- Botões: "Criar conteúdo com esse ângulo" (abre modal de novo conteúdo pré-preenchido) · "Adicionar ao banco de ideias"

#### 6.2.4 Multiplicar Conteúdo
- Disponível apenas quando `contents.transcription` está preenchido
- Chama Edge Function `ai-multiply-content`
- Modelo: `claude-sonnet-4-6`
- Prompt inclui: contexto do cliente + transcrição completa + exemplos de few-shot (headlines já aprovadas da DOALTO)
- **Few-shot examples** injetados no prompt (padrão aprendido):
  - Instagram: hook emocional — "Por que...", "Se o seu síndico...", "Atenção, síndico..."
  - YouTube: insight descritivo — "O preço pode esconder...", "O problema começa onde..."
- Output (5 blocos editáveis separados):
  1. `headline_instagram` — hook emocional
  2. `headline_youtube` — título descritivo/SEO
  3. Roteiro Reels — hook 3s + problema + solução + CTA
  4. Estrutura Carrossel — cover + slides numerados + CTA
  5. Legenda Post Estático — 3–5 linhas + hashtags + CTA
- Cada bloco tem botão "Salvar" individual que persiste no campo correspondente do conteúdo

---

### 6.3 Pesquisa de Viral por Nicho

**Onde:** Perfil do cliente, seção "Pesquisa de Tendências"

**Modo A — Proativo (botão no perfil):**
- Botão "Pesquisar virais no nicho de {client.segment}"
- Chama Edge Function `ai-viral-research`
- Edge Function usa Exa API (`search` com query semântica baseada em `clients.segment` + `clients.brain_doc`)
- Claude analisa os resultados e retorna 3–5 tendências formatadas:
  - Título da tendência
  - Por que está performando (gancho emocional ou informacional)
  - Ângulo sugerido para o cliente
  - Botão "Adicionar ao banco de ideias" por tendência

**Modo B — Engenharia reversa:** ver seção 6.2.3 acima.

---

### 6.4 Briefing Inteligente — Central de Operação

**Onde:** Card fixo no topo da Central de Operação, abaixo dos 6 cards de contagem.

**Trigger:** Gerado na abertura da tela, uma vez por sessão (não a cada re-render). Cache de 2h no localStorage.

**Chama Edge Function `ai-daily-briefing`:**
- Lê os dados operacionais: conteúdos atrasados, prazos próximos (7 dias), aprovações pendentes há > 2 dias, WIP próximo do limite
- Modelo: `claude-haiku-4-5-20251001`
- Output: parágrafo único (3–5 linhas) com:
  - O que está crítico agora e por quê
  - Prioridade concreta ("comece pelo X porque Y")
  - Menção ao cliente e conteúdo específico quando relevante
- UI: card com borda caramel, label "🧠 Foco do dia", texto gerado, rodapé com horário e "Atualizar"

---

## 7. Edge Functions — Resumo

| Função | Modelos usados | APIs externas |
|--------|---------------|---------------|
| `ai-generate-script` | haiku-4-5 | — |
| `ai-generate-caption` | haiku-4-5 | — |
| `ai-reverse-engineer` | sonnet-4-6 | Exa (fetch URL) |
| `ai-multiply-content` | sonnet-4-6 | — |
| `ai-viral-research` | sonnet-4-6 | Exa (search) |
| `ai-daily-briefing` | haiku-4-5 | — |

Todas as funções:
- Leem o perfil do cliente do Supabase antes de chamar a IA
- Retornam erro 422 com mensagem amigável se `avatar_doc` e `brain_doc` estiverem ambos vazios
- Têm timeout de 30s (Supabase Edge Functions limit)
- Retornam streaming response nas funções `ai-generate-script` e `ai-multiply-content` para UX responsiva (texto aparece à medida que é gerado)

---

## 8. Tratamento de Erros

| Situação | Comportamento |
|----------|--------------|
| API key inválida / quota excedida | Toast "Serviço de IA temporariamente indisponível. Tente em alguns minutos." |
| `avatar_doc` vazio | Aviso inline: "Configure o contexto de IA no perfil do cliente para melhores resultados" |
| Timeout (>30s) | Toast com botão "Tentar novamente" |
| Exa não retorna resultados | Fallback: Claude gera sugestões baseadas apenas no `brain_doc` sem busca web |
| URL inválida (engenharia reversa) | Validação no frontend antes de chamar a Edge Function |

---

## 9. Framework de Copy — Eugene Schwartz

Todo conteúdo gerado segue Breakthrough Advertising como framework primário:

- **Regra de abertura:** nunca abrir com benefício genérico. Abrir nomeando a dor específica do avatar ou o mecanismo único — conforme awareness level.
- **Awareness 3/5 (padrão Rodrigo):** o prospect sabe que tem um problema e que existem soluções, mas ainda avalia em quem confiar. Copy deve nomear a dor conhecida e apresentar o mecanismo diferenciador (o ritual do Alves, o SLA no contrato, o laudo técnico, as motos de emergência).
- **Sophistication 3/5:** mercado intermediário-saturado. Promessas genéricas ("atendimento 24h", "técnico certificado") não convertem. Precisa de prova específica e mecanismo concreto.
- **Output obrigatório das Edge Functions de geração:** cada resultado começa com um comentário de header declarando awareness e sophistication usados:
  ```
  <!-- Schwartz: Awareness 3/5 (Problem-aware) × Sophistication 3/5 -->
  ```

## 9b. Few-Shot Examples — Headlines DOALTO

Injetados no prompt de `ai-multiply-content`. Baseados nos conteúdos reais fornecidos:

```
Exemplos de padrão de headline DOALTO:

Instagram (hook emocional):
- "Se o seu síndico só apresenta propostas comerciais na hora de escolher uma empresa de manutenção de elevadores, você pode pagar caro por isso!!!"
- "Por que existe a sensação de que as empresas de elevadores estão tentando tirar vantagem?"
- "Por que não é permitido que outra empresa de elevadores faça vistoria ou manutenção?"
- "A montadora é dona do elevador que ela instalou? Só ela pode fazer manutenção?"
- "Elevador parado: O risco elétrico que nem o seguro do condomínio cobre."
- "Atenção, síndico: O inox engana. A maresia não perdoa."

YouTube (insight descritivo):
- "O preço pode esconder o que realmente está sendo contratado"
- "Como saber se o preço de uma peça de elevador está realmente correto?"
- "O que pode acontecer quando duas empresas mexem no mesmo elevador?"
- "Depois da instalação, quem realmente responde pelo elevador?"
- "O problema pode estar acontecendo mesmo com o elevador parado"
- "O problema começa onde os olhos não conseguem enxergar"
```

---

## 10. Variáveis de Ambiente Necessárias (Supabase)

```
ANTHROPIC_API_KEY    — chave da Claude API
EXA_API_KEY          — chave da Exa API
```

Nunca expostas no frontend. Configuradas em Supabase → Settings → Edge Functions → Secrets.

---

## 11. Seed de Dados — DOALTO

Migration inicial popula:
- `clients.avatar_doc` com conteúdo de `avatar-2026-05-14.md`
- `clients.brain_doc` com conteúdo de `business-brain.md`
- `clients.sales_letter_doc` com a carta de vendas completa do Eng. Vandilson Alves

**O que a carta de vendas habilita na geração:**
- Tom epistolar/direto (carta assinada pelo Vandilson, não voz de marca genérica)
- Objeções já respondidas disponíveis como referência: "só a fabricante pode cuidar?", "como sei a procedência das peças?", "outra empresa pode vistoriar?", "e o acompanhamento de outros serviços?"
- Social proof concreto para injetar quando relevante: Le Parc (55 elevadores), Parque Shopping Aracaju (9 elevadores + 6 escadas), hospitais, faculdades, hotéis
- Mecanismo único: #NovoTempoDOALTO (Agilidade + Transparência + Tecnologia)
- Diferencial operacional: técnicos de moto para emergências, remuneração 1/3 superior, rastreamento em tempo real

---

## 12. Critério de Sucesso

A camada de IA é bem-sucedida se:

1. Ao abrir o Social OS de manhã, o briefing inteligente diz — em uma frase — o que fazer primeiro e por quê, sem a usuária precisar abrir nenhuma outra tela.
2. Ao clicar "Multiplicar conteúdo" com uma transcrição do Alves, os 5 formatos gerados estão calibrados ao avatar do Rodrigo — sem precisar editar o tom ou reescrever o hook do zero.
3. Ao pesquisar virais para a DOALTO, pelo menos 2 das sugestões são acionáveis (viram ideias no banco com 1 clique).

---

## 13. O Que Fica para V2

- Chat conversacional com os dados do sistema ("quais conteúdos da DOALTO estão em risco essa semana?")
- Painel proativo automático de tendências (push sem ação da usuária)
- Biblioteca de frameworks salvos a partir de engenharia reversa
- Sugestão automática de datas do Radar ao gerar conteúdo
- Análise de performance de conteúdos publicados (integração Meta Business Suite)
