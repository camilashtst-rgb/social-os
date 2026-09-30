# Social OS IA Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI intelligence to the Social OS — botões de geração de conteúdo (roteiro, legenda, multiplicação, engenharia reversa), pesquisa de viral por nicho e briefing inteligente na home.

**Architecture:** Supabase Edge Functions (Deno) atuam como backend seguro para Claude API e Exa API. O frontend React chama essas funções via `ai-client.ts`, que gerencia streaming e erros. O contexto do cliente (avatar + brain + carta de vendas) é injetado automaticamente em toda chamada de IA.

**Tech Stack:** Supabase Edge Functions · Deno/TypeScript · Anthropic Claude API (`claude-haiku-4-5-20251001` + `claude-sonnet-4-6`) · Exa API · React + Vite + TypeScript + Tailwind CSS

**Prerequisite:** Social OS implementado conforme `docs/superpowers/specs/2026-09-21-social-os-design.md`. As tabelas `clients` e `contents` devem existir antes desta migration.

---

## File Map

**Criar:**
```
supabase/migrations/20261002000000_add_ai_fields.sql
supabase/functions/_shared/cors.ts
supabase/functions/_shared/context-builder.ts
supabase/functions/_shared/schwartz-examples.ts
supabase/functions/_shared/exa-client.ts
supabase/functions/_shared/context-builder.test.ts
supabase/functions/ai-generate-script/index.ts
supabase/functions/ai-generate-caption/index.ts
supabase/functions/ai-multiply-content/index.ts
supabase/functions/ai-reverse-engineer/index.ts
supabase/functions/ai-viral-research/index.ts
supabase/functions/ai-daily-briefing/index.ts
src/lib/ai-client.ts
src/components/ai/StreamingResult.tsx
src/components/ai/GenerateScript.tsx
src/components/ai/GenerateCaption.tsx
src/components/ai/MultiplyContent.tsx
src/components/ai/ReverseEngineer.tsx
src/components/ai/AIAssistant.tsx
src/components/ai/ViralResearch.tsx
src/components/ai/DailyBriefing.tsx
src/components/clients/AIContextSection.tsx
```

**Modificar:**
```
src/types/database.ts          — novos campos após migration
src/pages/ContentDetail.tsx    — adicionar <AIAssistant>
src/pages/ClientProfile.tsx    — adicionar <AIContextSection> + <ViralResearch>
src/pages/Home.tsx             — adicionar <DailyBriefing>
```

---

## Task 1: Database Migration + Type Update

**Files:**
- Create: `supabase/migrations/20261002000000_add_ai_fields.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/20261002000000_add_ai_fields.sql

-- clients: campos de contexto de IA
ALTER TABLE clients ADD COLUMN IF NOT EXISTS avatar_doc text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brain_doc text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sales_letter_doc text;

-- contents: transcrição + headline YouTube + rename headline → headline_instagram
ALTER TABLE contents RENAME COLUMN headline TO headline_instagram;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS headline_youtube text;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS transcription text;

COMMENT ON COLUMN clients.avatar_doc IS 'Markdown do avatar/ICP completo (awareness, dor, objeções)';
COMMENT ON COLUMN clients.brain_doc IS 'Markdown do business brain (ICP, ofertas, voice 3+3, regra-âncora)';
COMMENT ON COLUMN clients.sales_letter_doc IS 'Carta de vendas completa — referência de voz e narrativa';
COMMENT ON COLUMN contents.transcription IS 'Transcrição bruta do vídeo para multiplicação de conteúdo';
COMMENT ON COLUMN contents.headline_youtube IS 'Título do vídeo no YouTube (descritivo/insight)';
```

- [ ] **Step 2: Apply migration**

```bash
npx supabase db push
```

Expected: `Applied 1 migration` sem erros.

- [ ] **Step 3: Update TypeScript types**

Regenerar tipos do Supabase:
```bash
npx supabase gen types typescript --local > src/types/database.ts
```

Verificar que `src/types/database.ts` agora inclui `avatar_doc`, `brain_doc`, `sales_letter_doc`, `headline_instagram`, `headline_youtube`, `transcription`.

- [ ] **Step 4: Fix any broken references to `headline`**

```bash
grep -r "\.headline" src/ --include="*.tsx" --include="*.ts"
```

Para cada ocorrência, renomear `content.headline` → `content.headline_instagram`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/ src/types/database.ts
git commit -m "feat(ia-layer): migration — adiciona campos ai em clients e contents"
```

---

## Task 2: Shared Edge Function Utilities

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/context-builder.ts`
- Create: `supabase/functions/_shared/schwartz-examples.ts`
- Create: `supabase/functions/_shared/exa-client.ts`
- Test: `supabase/functions/_shared/context-builder.test.ts`

- [ ] **Step 1: Create CORS headers**

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

- [ ] **Step 2: Create context builder**

```typescript
// supabase/functions/_shared/context-builder.ts

export interface ClientAIRecord {
  name: string;
  segment: string;
  cities: string;
  target_audience?: string | null;
  voice_tone?: string | null;
  avatar_doc?: string | null;
  brain_doc?: string | null;
  sales_letter_doc?: string | null;
}

export interface ContentAIRecord {
  title: string;
  format: string;
  objective?: string | null;
  pillar?: string | null;
  script?: string | null;
  transcription?: string | null;
}

export function buildClientContext(
  client: ClientAIRecord,
  content?: ContentAIRecord
): string {
  const parts: string[] = [];

  parts.push(`# CONTEXTO DO CLIENTE`);
  parts.push(`Cliente: ${client.name}`);
  parts.push(`Segmento: ${client.segment}`);
  parts.push(`Regiões: ${client.cities}`);

  if (client.avatar_doc) {
    parts.push(`\n## AVATAR / ICP`);
    parts.push(client.avatar_doc);
  } else if (client.target_audience) {
    parts.push(`\n## PÚBLICO-ALVO`);
    parts.push(client.target_audience);
  }

  if (client.brain_doc) {
    parts.push(`\n## BUSINESS BRAIN`);
    parts.push(client.brain_doc);
  } else if (client.voice_tone) {
    parts.push(`\n## VOZ`);
    parts.push(client.voice_tone);
  }

  if (client.sales_letter_doc) {
    parts.push(`\n## CARTA DE VENDAS (referência de voz e narrativa)`);
    parts.push(client.sales_letter_doc);
  }

  parts.push(`\n## REFERÊNCIA DE COPY`);
  parts.push(`Framework: Eugene Schwartz — Breakthrough Advertising`);
  parts.push(`Regra: declare awareness level e sophistication level no comentário de abertura (ex: <!-- Schwartz: Awareness 3/5 × Sophistication 3/5 -->).`);
  parts.push(`Nunca abrir com benefício genérico. Abrir nomeando a dor específica ou o mecanismo único.`);
  parts.push(`Sophistication 3/5: promessas genéricas ("atendimento 24h", "técnico certificado") não convertem — use mecanismo concreto.`);

  if (content) {
    parts.push(`\n## CONTEÚDO ATUAL`);
    parts.push(`Formato: ${content.format}`);
    if (content.objective) parts.push(`Objetivo: ${content.objective}`);
    if (content.pillar) parts.push(`Pilar: ${content.pillar}`);
    parts.push(`Título: ${content.title}`);
    if (content.script) {
      parts.push(`\nRoteiro existente (use como base para a legenda):`);
      parts.push(content.script);
    }
  }

  return parts.join('\n');
}

export function hasAIContext(client: ClientAIRecord): boolean {
  return !!(client.avatar_doc || client.brain_doc);
}
```

- [ ] **Step 3: Write context builder test**

```typescript
// supabase/functions/_shared/context-builder.test.ts
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { buildClientContext, hasAIContext } from "./context-builder.ts";

Deno.test("buildClientContext inclui nome, segmento e regiões", () => {
  const client = { name: "DOALTO", segment: "Elevadores", cities: "Salvador" };
  const result = buildClientContext(client);
  assertEquals(result.includes("DOALTO"), true);
  assertEquals(result.includes("Elevadores"), true);
  assertEquals(result.includes("Salvador"), true);
});

Deno.test("buildClientContext usa avatar_doc quando disponível", () => {
  const client = {
    name: "DOALTO", segment: "Elevadores", cities: "Salvador",
    avatar_doc: "# Rodrigo\nSíndico, 45 anos",
  };
  const result = buildClientContext(client);
  assertEquals(result.includes("AVATAR / ICP"), true);
  assertEquals(result.includes("Rodrigo"), true);
  assertEquals(result.includes("PÚBLICO-ALVO"), false);
});

Deno.test("buildClientContext fallback para target_audience quando avatar_doc ausente", () => {
  const client = {
    name: "X", segment: "Y", cities: "Z",
    target_audience: "Síndicos em geral",
  };
  const result = buildClientContext(client);
  assertEquals(result.includes("PÚBLICO-ALVO"), true);
  assertEquals(result.includes("Síndicos em geral"), true);
});

Deno.test("buildClientContext inclui sales_letter_doc quando presente", () => {
  const client = {
    name: "DOALTO", segment: "Elevadores", cities: "Salvador",
    sales_letter_doc: "Prezado Síndico, essa situação...",
  };
  const result = buildClientContext(client);
  assertEquals(result.includes("CARTA DE VENDAS"), true);
  assertEquals(result.includes("Prezado Síndico"), true);
});

Deno.test("buildClientContext inclui contexto do conteúdo quando passado", () => {
  const client = { name: "DOALTO", segment: "X", cities: "Y" };
  const content = { title: "5 sinais", format: "reels", objective: "Educação" };
  const result = buildClientContext(client, content);
  assertEquals(result.includes("5 sinais"), true);
  assertEquals(result.includes("reels"), true);
});

Deno.test("hasAIContext retorna true quando avatar_doc presente", () => {
  assertEquals(hasAIContext({ name: "", segment: "", cities: "", avatar_doc: "x" }), true);
});

Deno.test("hasAIContext retorna false quando ambos ausentes", () => {
  assertEquals(hasAIContext({ name: "", segment: "", cities: "" }), false);
});
```

- [ ] **Step 4: Run context builder tests**

```bash
cd supabase/functions/_shared
deno test context-builder.test.ts
```

Expected: 7 tests passing.

- [ ] **Step 5: Create Schwartz examples**

```typescript
// supabase/functions/_shared/schwartz-examples.ts
export const DOALTO_HEADLINE_EXAMPLES = `
Padrão de headlines DOALTO (use como referência de tom e estrutura):

INSTAGRAM — hook emocional, problem-aware, nomeia dor específica:
- "Se o seu síndico só apresenta propostas comerciais na hora de escolher uma empresa de manutenção de elevadores, você pode pagar caro por isso!!!"
- "Por que existe a sensação de que as empresas de elevadores estão tentando tirar vantagem, cobrando peças mais caras que o mercado pratica?"
- "Por que não é permitido que outra empresa de elevadores faça vistoria ou manutenção?"
- "A montadora é dona do elevador que ela instalou? Só ela pode fazer manutenção?"
- "Elevador parado: O risco elétrico que nem o seguro do condomínio cobre."
- "Atenção, síndico: O inox engana. A maresia não perdoa."
- "A diferença entre o síndico que resolve crise e o que nunca chega nela é uma só: planejamento."

YOUTUBE — insight descritivo, SEO-friendly, benefício claro:
- "O preço pode esconder o que realmente está sendo contratado"
- "Como saber se o preço de uma peça de elevador está realmente correto?"
- "O que pode acontecer quando duas empresas mexem no mesmo elevador?"
- "Depois da instalação, quem realmente responde pelo elevador?"
- "O problema pode estar acontecendo mesmo com o elevador parado"
- "O problema começa onde os olhos não conseguem enxergar"
- "A crise que você resolve hoje pode ter começado meses atrás"
`;
```

- [ ] **Step 6: Create Exa client**

```typescript
// supabase/functions/_shared/exa-client.ts

const EXA_BASE = 'https://api.exa.ai';

export interface ExaResult {
  title: string;
  url: string;
  text?: string;
  score: number;
}

export async function exaSearch(
  query: string,
  numResults = 5
): Promise<ExaResult[]> {
  const apiKey = Deno.env.get('EXA_API_KEY');
  if (!apiKey) throw new Error('EXA_API_KEY not configured');

  const res = await fetch(`${EXA_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      query,
      numResults,
      useAutoprompt: true,
      contents: { text: { maxCharacters: 1000 } },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Exa search failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return (data.results ?? []) as ExaResult[];
}

export async function exaFetchContent(url: string): Promise<string | null> {
  const apiKey = Deno.env.get('EXA_API_KEY');
  if (!apiKey) return null;

  const res = await fetch(`${EXA_BASE}/contents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({
      ids: [url],
      contents: { text: { maxCharacters: 3000 } },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return (data.results?.[0]?.text as string) ?? null;
}
```

- [ ] **Step 7: Commit utilities**

```bash
git add supabase/functions/_shared/
git commit -m "feat(ia-layer): shared Edge Function utilities — context builder, Exa client, Schwartz examples"
```

---

## Task 3: Edge Functions — Geração Simples (Script + Caption)

**Files:**
- Create: `supabase/functions/ai-generate-script/index.ts`
- Create: `supabase/functions/ai-generate-caption/index.ts`

- [ ] **Step 1: Create ai-generate-script**

```typescript
// supabase/functions/ai-generate-script/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { corsHeaders } from "../_shared/cors.ts";
import { buildClientContext, hasAIContext } from "../_shared/context-builder.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { content_id } = await req.json();
    if (!content_id) return new Response(
      JSON.stringify({ error: "content_id obrigatório" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: content, error } = await supabase
      .from("contents")
      .select("title, format, objective, pillar, script, clients(name, segment, cities, target_audience, voice_tone, avatar_doc, brain_doc, sales_letter_doc)")
      .eq("id", content_id)
      .single();

    if (error || !content) return new Response(
      JSON.stringify({ error: "Conteúdo não encontrado" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const client = content.clients as Record<string, unknown>;
    if (!hasAIContext(client as Parameters<typeof hasAIContext>[0])) {
      return new Response(
        JSON.stringify({ error: "Configure o contexto de IA no perfil do cliente antes de gerar." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildClientContext(
      client as Parameters<typeof buildClientContext>[0],
      content as Parameters<typeof buildClientContext>[1]
    );

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const stream = await anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Gere um roteiro de Reels para o conteúdo "${content.title}".

Estrutura obrigatória:
[HOOK — 3 seg] frase de abertura que nomeia a dor do avatar
[PROBLEMA] 2-3 frases desenvolvendo o problema
[SOLUÇÃO] como a DOALTO resolve isso
[CTA] chamada para ação clara

Comece com: <!-- Schwartz: Awareness X/5 × Sophistication Y/5 -->
Máximo 250 palavras. Tom: ${client.voice_tone ?? "técnico e direto, sem jargão de vendedor"}.`
      }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Create ai-generate-caption**

```typescript
// supabase/functions/ai-generate-caption/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { corsHeaders } from "../_shared/cors.ts";
import { buildClientContext, hasAIContext } from "../_shared/context-builder.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { content_id } = await req.json();
    if (!content_id) return new Response(
      JSON.stringify({ error: "content_id obrigatório" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: content, error } = await supabase
      .from("contents")
      .select("title, format, objective, pillar, script, clients(name, segment, cities, target_audience, voice_tone, avatar_doc, brain_doc, sales_letter_doc)")
      .eq("id", content_id)
      .single();

    if (error || !content) return new Response(
      JSON.stringify({ error: "Conteúdo não encontrado" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const client = content.clients as Record<string, unknown>;
    if (!hasAIContext(client as Parameters<typeof hasAIContext>[0])) {
      return new Response(
        JSON.stringify({ error: "Configure o contexto de IA no perfil do cliente." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildClientContext(
      client as Parameters<typeof buildClientContext>[0],
      content as Parameters<typeof buildClientContext>[1]
    );

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const stream = await anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Gere uma legenda de Instagram para o conteúdo "${content.title}".

${content.script ? `Roteiro de referência:\n${content.script}\n` : ""}

Estrutura:
- Linha 1: hook direto (não repita o título — use uma variação ou consequência)
- Corpo: 3-5 linhas que desenvolvem o tema
- 5 hashtags relevantes (nicho de elevadores + segmento síndico)
- CTA final (ex: "Salve este post.", "Marque um síndico que precisa ver isso.")

Máximo 220 palavras. Tom da marca aplicado conforme voice.`
      }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 3: Test functions locally**

```bash
npx supabase functions serve ai-generate-script --env-file .env.local
```

Em outro terminal:
```bash
curl -X POST http://localhost:54321/functions/v1/ai-generate-script \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -d '{"content_id": "<id-de-um-conteudo-existente>"}' \
  --no-buffer
```

Expected: texto do roteiro sendo transmitido em stream.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-generate-script/ supabase/functions/ai-generate-caption/
git commit -m "feat(ia-layer): Edge Functions ai-generate-script e ai-generate-caption com streaming"
```

---

## Task 4: Frontend — ai-client.ts + StreamingResult

**Files:**
- Create: `src/lib/ai-client.ts`
- Create: `src/components/ai/StreamingResult.tsx`

- [ ] **Step 1: Create ai-client.ts**

```typescript
// src/lib/ai-client.ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export async function callAIStream(
  functionName: string,
  payload: Record<string, unknown>,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
): Promise<void> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      onError(data.error ?? "Erro desconhecido");
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError("Resposta sem body"); return; }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
    onDone();
  } catch (err) {
    onError(err instanceof Error ? err.message : "Erro de conexão");
  }
}

export async function callAI<T>(
  functionName: string,
  payload: Record<string, unknown>
): Promise<T> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(data.error ?? "Erro desconhecido");
  }

  return response.json() as Promise<T>;
}
```

- [ ] **Step 2: Create StreamingResult component**

```tsx
// src/components/ai/StreamingResult.tsx
import { useState } from "react";

interface StreamingResultProps {
  text: string;
  isStreaming: boolean;
  error?: string;
  onSave: (text: string) => void;
  onRegenerate: () => void;
  saveLabel?: string;
}

export function StreamingResult({
  text,
  isStreaming,
  error,
  onSave,
  onRegenerate,
  saveLabel = "Salvar",
}: StreamingResultProps) {
  const [edited, setEdited] = useState(text);

  // sync when new generation arrives
  if (!isStreaming && edited !== text && text !== "") {
    setEdited(text);
  }

  if (error) {
    return (
      <div className="rounded-lg border border-terracota/40 bg-terracota/10 p-3">
        <p className="text-sm text-terracota">{error}</p>
        <button
          onClick={onRegenerate}
          className="mt-2 text-xs underline text-caramel hover:opacity-70"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!text && !isStreaming) return null;

  return (
    <div className="rounded-lg border border-beige-lt bg-white p-3 space-y-2">
      {isStreaming && !text && (
        <div className="flex items-center gap-2 text-sm text-beige-md">
          <span className="animate-pulse">●</span> Gerando...
        </div>
      )}
      <textarea
        className="w-full min-h-[120px] text-sm font-body text-charcoal resize-y bg-cream rounded p-2 border border-beige-lt focus:outline-none focus:border-caramel"
        value={isStreaming ? text : edited}
        onChange={(e) => !isStreaming && setEdited(e.target.value)}
        readOnly={isStreaming}
      />
      {!isStreaming && text && (
        <div className="flex gap-2">
          <button
            onClick={() => onSave(edited)}
            className="text-xs bg-caramel text-white rounded px-3 py-1.5 hover:opacity-80"
          >
            {saveLabel}
          </button>
          <button
            onClick={onRegenerate}
            className="text-xs border border-beige-lt rounded px-3 py-1.5 hover:bg-cream"
          >
            Gerar nova versão
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/ai-client.ts src/components/ai/StreamingResult.tsx
git commit -m "feat(ia-layer): ai-client.ts e StreamingResult component"
```

---

## Task 5: Components — GenerateScript + GenerateCaption

**Files:**
- Create: `src/components/ai/GenerateScript.tsx`
- Create: `src/components/ai/GenerateCaption.tsx`

- [ ] **Step 1: Create GenerateScript**

```tsx
// src/components/ai/GenerateScript.tsx
import { useState } from "react";
import { callAIStream } from "@/lib/ai-client";
import { StreamingResult } from "./StreamingResult";
import { supabase } from "@/lib/supabase";

interface GenerateScriptProps {
  contentId: string;
  onSaved: () => void;
}

export function GenerateScript({ contentId, onSaved }: GenerateScriptProps) {
  const [result, setResult] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>();

  function generate() {
    setResult("");
    setError(undefined);
    setIsStreaming(true);
    callAIStream(
      "ai-generate-script",
      { content_id: contentId },
      (chunk) => setResult((prev) => prev + chunk),
      () => setIsStreaming(false),
      (msg) => { setError(msg); setIsStreaming(false); }
    );
  }

  async function handleSave(text: string) {
    await supabase.from("contents").update({ script: text }).eq("id", contentId);
    onSaved();
  }

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={isStreaming}
        className="text-sm bg-cream border border-beige-lt rounded px-3 py-1.5 hover:border-caramel disabled:opacity-50"
      >
        ✨ Gerar roteiro
      </button>
      <StreamingResult
        text={result}
        isStreaming={isStreaming}
        error={error}
        onSave={handleSave}
        onRegenerate={generate}
        saveLabel="Salvar no roteiro"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create GenerateCaption**

```tsx
// src/components/ai/GenerateCaption.tsx
import { useState } from "react";
import { callAIStream } from "@/lib/ai-client";
import { StreamingResult } from "./StreamingResult";
import { supabase } from "@/lib/supabase";

interface GenerateCaptionProps {
  contentId: string;
  onSaved: () => void;
}

export function GenerateCaption({ contentId, onSaved }: GenerateCaptionProps) {
  const [result, setResult] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>();

  function generate() {
    setResult("");
    setError(undefined);
    setIsStreaming(true);
    callAIStream(
      "ai-generate-caption",
      { content_id: contentId },
      (chunk) => setResult((prev) => prev + chunk),
      () => setIsStreaming(false),
      (msg) => { setError(msg); setIsStreaming(false); }
    );
  }

  async function handleSave(text: string) {
    await supabase.from("contents").update({ caption: text }).eq("id", contentId);
    onSaved();
  }

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={isStreaming}
        className="text-sm bg-cream border border-beige-lt rounded px-3 py-1.5 hover:border-caramel disabled:opacity-50"
      >
        📝 Gerar legenda
      </button>
      <StreamingResult
        text={result}
        isStreaming={isStreaming}
        error={error}
        onSave={handleSave}
        onRegenerate={generate}
        saveLabel="Salvar na legenda"
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ai/GenerateScript.tsx src/components/ai/GenerateCaption.tsx
git commit -m "feat(ia-layer): GenerateScript e GenerateCaption components"
```

---

## Task 6: Edge Function — ai-multiply-content

**Files:**
- Create: `supabase/functions/ai-multiply-content/index.ts`

- [ ] **Step 1: Create ai-multiply-content**

```typescript
// supabase/functions/ai-multiply-content/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { corsHeaders } from "../_shared/cors.ts";
import { buildClientContext, hasAIContext } from "../_shared/context-builder.ts";
import { DOALTO_HEADLINE_EXAMPLES } from "../_shared/schwartz-examples.ts";

interface MultiplyOutput {
  schwartz_frame: string;
  headline_instagram: string;
  headline_youtube: string;
  roteiro_reels: string;
  estrutura_carrossel: string;
  legenda_estatico: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { content_id } = await req.json();
    if (!content_id) return new Response(
      JSON.stringify({ error: "content_id obrigatório" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: content, error } = await supabase
      .from("contents")
      .select("title, format, objective, pillar, transcription, clients(name, segment, cities, target_audience, voice_tone, avatar_doc, brain_doc, sales_letter_doc)")
      .eq("id", content_id)
      .single();

    if (error || !content) return new Response(
      JSON.stringify({ error: "Conteúdo não encontrado" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    if (!content.transcription) return new Response(
      JSON.stringify({ error: "Adicione a transcrição do vídeo antes de multiplicar." }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const client = content.clients as Record<string, unknown>;
    if (!hasAIContext(client as Parameters<typeof hasAIContext>[0])) {
      return new Response(
        JSON.stringify({ error: "Configure o contexto de IA no perfil do cliente." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildClientContext(client as Parameters<typeof buildClientContext>[0]);
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Analise a transcrição abaixo e gere 5 formatos de conteúdo.

TRANSCRIÇÃO:
${content.transcription}

${DOALTO_HEADLINE_EXAMPLES}

Retorne SOMENTE um JSON válido com esta estrutura (sem markdown, sem texto fora do JSON):
{
  "schwartz_frame": "Awareness X/5 (tipo) × Sophistication Y/5",
  "headline_instagram": "hook emocional problem-aware que nomeia dor específica",
  "headline_youtube": "insight descritivo SEO-friendly",
  "roteiro_reels": "[HOOK 3s] ... [PROBLEMA] ... [SOLUÇÃO] ... [CTA]",
  "estrutura_carrossel": "Cover: ...\\nSlide 1: ...\\nSlide 2: ...\\nSlide 3: ...\\nSlide 4: ...\\nSlide 5: ...\\nCTA: ...",
  "legenda_estatico": "3-5 linhas + #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5 + CTA"
}`
      }],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    let output: MultiplyOutput;
    try {
      output = JSON.parse(rawText) as MultiplyOutput;
    } catch {
      return new Response(
        JSON.stringify({ error: "IA retornou formato inesperado. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Test locally**

```bash
npx supabase functions serve ai-multiply-content --env-file .env.local
```

```bash
curl -X POST http://localhost:54321/functions/v1/ai-multiply-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"content_id": "<id-com-transcription-preenchida>"}'
```

Expected: JSON com 6 campos incluindo `schwartz_frame`.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/ai-multiply-content/
git commit -m "feat(ia-layer): ai-multiply-content — 1 transcrição → 5 formatos via sonnet-4-6"
```

---

## Task 7: Component — MultiplyContent

**Files:**
- Create: `src/components/ai/MultiplyContent.tsx`

- [ ] **Step 1: Create MultiplyContent**

```tsx
// src/components/ai/MultiplyContent.tsx
import { useState } from "react";
import { callAI } from "@/lib/ai-client";
import { supabase } from "@/lib/supabase";

interface MultiplyResult {
  schwartz_frame: string;
  headline_instagram: string;
  headline_youtube: string;
  roteiro_reels: string;
  estrutura_carrossel: string;
  legenda_estatico: string;
}

interface MultiplyContentProps {
  contentId: string;
  hasTranscription: boolean;
  onSaved: () => void;
}

export function MultiplyContent({ contentId, hasTranscription, onSaved }: MultiplyContentProps) {
  const [result, setResult] = useState<MultiplyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  async function generate() {
    setLoading(true);
    setError(undefined);
    setResult(null);
    try {
      const data = await callAI<MultiplyResult>("ai-multiply-content", { content_id: contentId });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar");
    } finally {
      setLoading(false);
    }
  }

  async function saveField(field: string, value: string) {
    await supabase.from("contents").update({ [field]: value }).eq("id", contentId);
    setSaved((prev) => ({ ...prev, [field]: true }));
    onSaved();
  }

  if (!hasTranscription) {
    return (
      <p className="text-xs text-beige-md italic">
        Adicione a transcrição do vídeo para habilitar a multiplicação de conteúdo.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={generate}
        disabled={loading}
        className="text-sm bg-caramel text-white rounded px-3 py-1.5 hover:opacity-80 disabled:opacity-50"
      >
        {loading ? "⏳ Gerando..." : "📹 Multiplicar conteúdo"}
      </button>

      {error && (
        <p className="text-sm text-terracota">{error}</p>
      )}

      {result && (
        <div className="space-y-3">
          <p className="text-xs text-beige-md font-mono">
            {result.schwartz_frame}
          </p>

          {([
            { field: "headline_instagram", label: "📱 Headline Instagram", icon: "" },
            { field: "headline_youtube", label: "▶️ Headline YouTube", icon: "" },
            { field: "script", label: "🎬 Roteiro Reels", value: result.roteiro_reels, icon: "" },
            { field: "notes", label: "📊 Estrutura Carrossel", value: result.estrutura_carrossel, icon: "" },
            { field: "caption", label: "🖼️ Legenda Post Estático", value: result.legenda_estatico, icon: "" },
          ] as Array<{ field: string; label: string; value?: string }>).map(({ field, label, value }) => {
            const content = value ?? result[field as keyof MultiplyResult] as string;
            return (
              <div key={field} className="rounded-lg border border-beige-lt bg-cream p-3 space-y-2">
                <p className="text-xs font-semibold text-caramel">{label}</p>
                <p className="text-sm text-charcoal whitespace-pre-wrap">{content}</p>
                <button
                  onClick={() => saveField(field, content)}
                  disabled={saved[field]}
                  className="text-xs bg-white border border-beige-lt rounded px-2 py-1 hover:border-caramel disabled:opacity-50"
                >
                  {saved[field] ? "✓ Salvo" : "Salvar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ai/MultiplyContent.tsx
git commit -m "feat(ia-layer): MultiplyContent component — 5 blocos editáveis com save individual"
```

---

## Task 8: Edge Function — ai-reverse-engineer

**Files:**
- Create: `supabase/functions/ai-reverse-engineer/index.ts`
- Create: `src/components/ai/ReverseEngineer.tsx`

- [ ] **Step 1: Create ai-reverse-engineer**

```typescript
// supabase/functions/ai-reverse-engineer/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { corsHeaders } from "../_shared/cors.ts";
import { buildClientContext, hasAIContext } from "../_shared/context-builder.ts";
import { exaFetchContent } from "../_shared/exa-client.ts";

interface ReverseOutput {
  framework: string;
  hook_pattern: string;
  estrutura: string;
  adaptacao_titulo: string;
  adaptacao_roteiro: string;
  fallback_used: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { client_id, url } = await req.json();
    if (!client_id || !url) return new Response(
      JSON.stringify({ error: "client_id e url obrigatórios" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    // Validate URL
    try { new URL(url); } catch {
      return new Response(
        JSON.stringify({ error: "URL inválida" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: client, error } = await supabase
      .from("clients")
      .select("name, segment, cities, target_audience, voice_tone, avatar_doc, brain_doc, sales_letter_doc")
      .eq("id", client_id)
      .single();

    if (error || !client) return new Response(
      JSON.stringify({ error: "Cliente não encontrado" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    if (!hasAIContext(client)) return new Response(
      JSON.stringify({ error: "Configure o contexto de IA no perfil do cliente." }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    // Try to fetch content via Exa
    let urlContent: string | null = null;
    let fallbackUsed = false;
    try {
      urlContent = await exaFetchContent(url);
    } catch {
      fallbackUsed = true;
    }

    if (!urlContent) fallbackUsed = true;

    const systemPrompt = buildClientContext(client);
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const userPrompt = urlContent
      ? `Analise este conteúdo viral e adapte para o cliente.\n\nURL: ${url}\n\nCONTEÚDO:\n${urlContent}`
      : `Analise a URL abaixo e, com base no que você sabe sobre este tipo de conteúdo, faça uma engenharia reversa e adapte para o cliente.\n\nURL: ${url}\n\n(Nota: não consegui acessar o conteúdo diretamente — infira pelo contexto da URL.)`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `${userPrompt}

Retorne SOMENTE um JSON válido:
{
  "framework": "nome do framework identificado (ex: Contraste + Lista de erros + CTA de autoridade)",
  "hook_pattern": "padrão do hook de abertura",
  "estrutura": "estrutura do conteúdo em bullet points",
  "adaptacao_titulo": "título adaptado para ${client.name}",
  "adaptacao_roteiro": "roteiro adaptado em 150-200 palavras",
  "fallback_used": ${fallbackUsed}
}`
      }],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    let output: ReverseOutput;
    try {
      output = JSON.parse(rawText) as ReverseOutput;
      output.fallback_used = fallbackUsed;
    } catch {
      return new Response(
        JSON.stringify({ error: "IA retornou formato inesperado. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Create ReverseEngineer component**

```tsx
// src/components/ai/ReverseEngineer.tsx
import { useState } from "react";
import { callAI } from "@/lib/ai-client";

interface ReverseResult {
  framework: string;
  hook_pattern: string;
  estrutura: string;
  adaptacao_titulo: string;
  adaptacao_roteiro: string;
  fallback_used: boolean;
}

interface ReverseEngineerProps {
  clientId: string;
  onCreateContent: (title: string, script: string) => void;
  onAddIdea: (title: string) => void;
}

export function ReverseEngineer({ clientId, onCreateContent, onAddIdea }: ReverseEngineerProps) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ReverseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function analyze() {
    if (!url.trim()) return;
    setLoading(true);
    setError(undefined);
    setResult(null);
    try {
      const data = await callAI<ReverseResult>("ai-reverse-engineer", {
        client_id: clientId,
        url: url.trim(),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao analisar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.instagram.com/reel/..."
          className="flex-1 text-sm border border-beige-lt rounded px-3 py-1.5 bg-cream focus:outline-none focus:border-caramel"
        />
        <button
          onClick={analyze}
          disabled={loading || !url.trim()}
          className="text-sm bg-cream border border-beige-lt rounded px-3 py-1.5 hover:border-caramel disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "⏳ Analisando..." : "🔗 Analisar"}
        </button>
      </div>

      {error && <p className="text-sm text-terracota">{error}</p>}

      {result && (
        <div className="rounded-lg border border-beige-lt bg-cream p-3 space-y-3 text-sm">
          {result.fallback_used && (
            <p className="text-xs text-beige-md italic">
              ⚠️ Não consegui acessar o conteúdo diretamente — análise baseada na URL.
            </p>
          )}
          <div>
            <p className="text-xs font-semibold text-caramel mb-1">Framework identificado</p>
            <p className="text-charcoal">{result.framework}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-caramel mb-1">Padrão do hook</p>
            <p className="text-charcoal">{result.hook_pattern}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-caramel mb-1">Adaptação sugerida</p>
            <p className="font-semibold text-charcoal">{result.adaptacao_titulo}</p>
            <p className="text-charcoal mt-1 whitespace-pre-wrap">{result.adaptacao_roteiro}</p>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onCreateContent(result.adaptacao_titulo, result.adaptacao_roteiro)}
              className="text-xs bg-caramel text-white rounded px-3 py-1.5 hover:opacity-80"
            >
              Criar conteúdo com esse ângulo
            </button>
            <button
              onClick={() => onAddIdea(result.adaptacao_titulo)}
              className="text-xs border border-beige-lt rounded px-3 py-1.5 hover:bg-white"
            >
              Adicionar ao banco de ideias
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/ai-reverse-engineer/ src/components/ai/ReverseEngineer.tsx
git commit -m "feat(ia-layer): ai-reverse-engineer Edge Function + ReverseEngineer component"
```

---

## Task 9: AIAssistant Wrapper + Wire into ContentDetail

**Files:**
- Create: `src/components/ai/AIAssistant.tsx`
- Modify: `src/pages/ContentDetail.tsx`

- [ ] **Step 1: Create AIAssistant wrapper**

```tsx
// src/components/ai/AIAssistant.tsx
import { useState } from "react";
import { GenerateScript } from "./GenerateScript";
import { GenerateCaption } from "./GenerateCaption";
import { MultiplyContent } from "./MultiplyContent";
import { ReverseEngineer } from "./ReverseEngineer";

type ActiveTool = "script" | "caption" | "multiply" | "reverse" | null;

interface AIAssistantProps {
  contentId: string;
  clientId: string;
  hasTranscription: boolean;
  hasAIContext: boolean;
  onSaved: () => void;
  onCreateContent: (title: string, script: string) => void;
  onAddIdea: (title: string) => void;
}

export function AIAssistant({
  contentId,
  clientId,
  hasTranscription,
  hasAIContext,
  onSaved,
  onCreateContent,
  onAddIdea,
}: AIAssistantProps) {
  const [active, setActive] = useState<ActiveTool>(null);

  if (!hasAIContext) {
    return (
      <div className="rounded-lg border border-beige-lt bg-cream p-3">
        <p className="text-xs text-beige-md">
          Configure o Avatar, Business Brain ou Carta de Vendas no perfil do cliente para habilitar o Assistente de Conteúdo.
        </p>
      </div>
    );
  }

  const tools: Array<{ id: ActiveTool; label: string; description: string }> = [
    { id: "script", label: "✨ Gerar roteiro", description: "Hook + Problema + Solução + CTA" },
    { id: "caption", label: "📝 Gerar legenda", description: "Com hashtags e CTA" },
    { id: "multiply", label: "📹 Multiplicar conteúdo", description: hasTranscription ? "5 formatos a partir da transcrição" : "Requer transcrição" },
    { id: "reverse", label: "🔗 Engenharia reversa", description: "Analisa link e adapta ao cliente" },
  ];

  return (
    <div className="rounded-lg border-2 border-caramel/30 bg-white p-4 space-y-3">
      <p className="text-xs font-semibold text-caramel uppercase tracking-wide">
        🤖 Assistente de Conteúdo
      </p>

      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActive(active === tool.id ? null : tool.id)}
            className={`text-sm rounded px-3 py-1.5 border transition-colors ${
              active === tool.id
                ? "bg-caramel text-white border-caramel"
                : "bg-cream border-beige-lt hover:border-caramel"
            }`}
          >
            {tool.label}
          </button>
        ))}
      </div>

      {active === "script" && (
        <GenerateScript contentId={contentId} onSaved={onSaved} />
      )}
      {active === "caption" && (
        <GenerateCaption contentId={contentId} onSaved={onSaved} />
      )}
      {active === "multiply" && (
        <MultiplyContent
          contentId={contentId}
          hasTranscription={hasTranscription}
          onSaved={onSaved}
        />
      )}
      {active === "reverse" && (
        <ReverseEngineer
          clientId={clientId}
          onCreateContent={onCreateContent}
          onAddIdea={onAddIdea}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into ContentDetail**

Abrir `src/pages/ContentDetail.tsx` (ou o drawer/modal que exibe o detalhe de um conteúdo). Adicionar as seguintes importações no topo:

```tsx
import { AIAssistant } from "@/components/ai/AIAssistant";
```

Localizar onde estão os campos `script` e `caption` no detalhe. Após o último campo editável, adicionar:

```tsx
{/* AI Assistant Section */}
<AIAssistant
  contentId={content.id}
  clientId={content.client_id}
  hasTranscription={!!content.transcription}
  hasAIContext={!!(content.clients?.avatar_doc || content.clients?.brain_doc)}
  onSaved={refetchContent}
  onCreateContent={(title, script) => {
    // Abrir modal de novo conteúdo pré-preenchido
    navigate("/contents/new", { state: { title, script, client_id: content.client_id } });
  }}
  onAddIdea={(title) => {
    // Adicionar ao banco de ideias
    supabase.from("ideas").insert({
      client_id: content.client_id,
      title,
      priority: "media",
    });
  }}
/>
```

Adicionar `transcription` ao select da query de conteúdo se ainda não estiver:
```tsx
.select("*, clients(name, avatar_doc, brain_doc, sales_letter_doc, ...)")
```

- [ ] **Step 3: Test in browser**

1. Abrir o detalhe de um conteúdo da DOALTO
2. Verificar que a seção "Assistente de Conteúdo" aparece
3. Clicar "✨ Gerar roteiro" — verificar streaming
4. Clicar "Salvar no roteiro" — verificar que o campo `script` foi atualizado

- [ ] **Step 4: Commit**

```bash
git add src/components/ai/AIAssistant.tsx src/pages/ContentDetail.tsx
git commit -m "feat(ia-layer): AIAssistant wired into ContentDetail"
```

---

## Task 10: AIContextSection + Wire into ClientProfile

**Files:**
- Create: `src/components/clients/AIContextSection.tsx`
- Modify: `src/pages/ClientProfile.tsx`

- [ ] **Step 1: Create AIContextSection**

```tsx
// src/components/clients/AIContextSection.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface AIContextSectionProps {
  clientId: string;
  initialAvatarDoc: string;
  initialBrainDoc: string;
  initialSalesLetterDoc: string;
}

export function AIContextSection({
  clientId,
  initialAvatarDoc,
  initialBrainDoc,
  initialSalesLetterDoc,
}: AIContextSectionProps) {
  const [avatarDoc, setAvatarDoc] = useState(initialAvatarDoc);
  const [brainDoc, setBrainDoc] = useState(initialBrainDoc);
  const [salesLetterDoc, setSalesLetterDoc] = useState(initialSalesLetterDoc);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await supabase.from("clients").update({
      avatar_doc: avatarDoc,
      brain_doc: brainDoc,
      sales_letter_doc: salesLetterDoc,
    }).eq("id", clientId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const hasContext = !!(avatarDoc || brainDoc);
  const hasFull = !!(avatarDoc && brainDoc && salesLetterDoc);

  return (
    <div className="rounded-lg border-2 border-caramel/30 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-caramel">🤖 Contexto para IA</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          hasFull
            ? "bg-green-100 text-green-700"
            : hasContext
            ? "bg-caramel/10 text-caramel"
            : "bg-beige-lt text-beige-md"
        }`}>
          {hasFull ? "IA completa ✓✓" : hasContext ? "IA configurada ✓" : "Não configurado"}
        </span>
      </div>

      {[
        { label: "Avatar / ICP", value: avatarDoc, onChange: setAvatarDoc, placeholder: "Cole o documento de avatar completo (método Magnus — dor, desejo, objeções, Schwartz frame)..." },
        { label: "Business Brain", value: brainDoc, onChange: setBrainDoc, placeholder: "ICP em 1 frase, top 3 ofertas, voice 3 sempre + 3 nunca, regra-âncora..." },
        { label: "Carta de Vendas", value: salesLetterDoc, onChange: setSalesLetterDoc, placeholder: "Carta de vendas completa (referência de voz, objeções respondidas, social proof, mecanismo único)..." },
      ].map(({ label, value, onChange, placeholder }) => (
        <div key={label} className="space-y-1">
          <label className="text-xs font-semibold text-charcoal">{label}</label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={6}
            className="w-full text-sm font-mono text-charcoal bg-cream border border-beige-lt rounded p-2 resize-y focus:outline-none focus:border-caramel"
          />
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="text-sm bg-caramel text-white rounded px-4 py-2 hover:opacity-80 disabled:opacity-50"
      >
        {saving ? "Salvando..." : saved ? "✓ Salvo" : "Salvar contexto"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Wire into ClientProfile**

Abrir `src/pages/ClientProfile.tsx`. Adicionar import:

```tsx
import { AIContextSection } from "@/components/clients/AIContextSection";
```

No final dos campos do cliente, antes do botão de salvar geral, adicionar:

```tsx
<AIContextSection
  clientId={client.id}
  initialAvatarDoc={client.avatar_doc ?? ""}
  initialBrainDoc={client.brain_doc ?? ""}
  initialSalesLetterDoc={client.sales_letter_doc ?? ""}
/>
```

- [ ] **Step 3: Test in browser**

1. Abrir perfil da DOALTO
2. Verificar seção "Contexto para IA" com badge
3. Editar o avatar_doc e clicar Salvar
4. Recarregar a página e verificar persistência

- [ ] **Step 4: Commit**

```bash
git add src/components/clients/AIContextSection.tsx src/pages/ClientProfile.tsx
git commit -m "feat(ia-layer): AIContextSection component wired into ClientProfile"
```

---

## Task 11: Viral Research — Edge Function + Component + Wire

**Files:**
- Create: `supabase/functions/ai-viral-research/index.ts`
- Create: `src/components/ai/ViralResearch.tsx`
- Modify: `src/pages/ClientProfile.tsx`

- [ ] **Step 1: Create ai-viral-research**

```typescript
// supabase/functions/ai-viral-research/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { corsHeaders } from "../_shared/cors.ts";
import { buildClientContext } from "../_shared/context-builder.ts";
import { exaSearch, ExaResult } from "../_shared/exa-client.ts";

interface Trend {
  titulo: string;
  por_que_performa: string;
  angulo_sugerido: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { client_id } = await req.json();
    if (!client_id) return new Response(
      JSON.stringify({ error: "client_id obrigatório" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: client, error } = await supabase
      .from("clients")
      .select("name, segment, cities, target_audience, voice_tone, avatar_doc, brain_doc")
      .eq("id", client_id)
      .single();

    if (error || !client) return new Response(
      JSON.stringify({ error: "Cliente não encontrado" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

    // Build search query from client context
    const searchQuery = `conteúdo viral Instagram ${client.segment} ${client.cities} síndico condomínio 2026`;

    let exaResults: ExaResult[] = [];
    let usedWebSearch = false;
    try {
      exaResults = await exaSearch(searchQuery, 5);
      usedWebSearch = true;
    } catch {
      // proceed without web results — Claude generates from brain context only
    }

    const systemPrompt = buildClientContext(client);
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const webContext = usedWebSearch && exaResults.length > 0
      ? `\nRESULTADOS DA BUSCA WEB:\n${exaResults.map((r, i) => `${i + 1}. ${r.title}\n${r.text ?? ""}`).join("\n\n")}`
      : "\n(Sem resultados de busca web disponíveis — gere tendências baseadas no conhecimento do nicho)";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
      messages: [{
        role: "user",
        content: `Identifique 3-5 tendências de conteúdo que estão performando bem para o nicho de ${client.segment} no Instagram, relevantes para o público da ${client.name} (${client.cities}).
${webContext}

Retorne SOMENTE um JSON válido:
{
  "tendencias": [
    {
      "titulo": "nome da tendência",
      "por_que_performa": "razão emocional ou informacional que gera engajamento",
      "angulo_sugerido": "como adaptar especificamente para ${client.name} e o Rodrigo"
    }
  ],
  "usou_busca_web": ${usedWebSearch}
}`
      }],
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";
    let output: { tendencias: Trend[]; usou_busca_web: boolean };
    try {
      output = JSON.parse(rawText);
    } catch {
      return new Response(
        JSON.stringify({ error: "IA retornou formato inesperado. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Create ViralResearch component**

```tsx
// src/components/ai/ViralResearch.tsx
import { useState } from "react";
import { callAI } from "@/lib/ai-client";
import { supabase } from "@/lib/supabase";

interface Trend {
  titulo: string;
  por_que_performa: string;
  angulo_sugerido: string;
}

interface ViralResearchProps {
  clientId: string;
  clientSegment: string;
}

export function ViralResearch({ clientId, clientSegment }: ViralResearchProps) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [usedWeb, setUsedWeb] = useState(false);
  const [added, setAdded] = useState<Record<number, boolean>>({});

  async function search() {
    setLoading(true);
    setError(undefined);
    setTrends([]);
    try {
      const data = await callAI<{ tendencias: Trend[]; usou_busca_web: boolean }>(
        "ai-viral-research",
        { client_id: clientId }
      );
      setTrends(data.tendencias ?? []);
      setUsedWeb(data.usou_busca_web);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao pesquisar");
    } finally {
      setLoading(false);
    }
  }

  async function addToIdeas(index: number, trend: Trend) {
    await supabase.from("ideas").insert({
      client_id: clientId,
      title: trend.angulo_sugerido,
      notes: `Tendência: ${trend.titulo}\n\nPor que performa: ${trend.por_que_performa}`,
      priority: "media",
    });
    setAdded((prev) => ({ ...prev, [index]: true }));
  }

  return (
    <div className="rounded-lg border border-beige-lt bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-charcoal">🔍 Pesquisa de Tendências</p>
        <button
          onClick={search}
          disabled={loading}
          className="text-xs bg-cream border border-beige-lt rounded px-3 py-1.5 hover:border-caramel disabled:opacity-50"
        >
          {loading ? "⏳ Pesquisando..." : `Pesquisar virais em ${clientSegment}`}
        </button>
      </div>

      {error && <p className="text-sm text-terracota">{error}</p>}

      {trends.length > 0 && (
        <div className="space-y-2">
          {!usedWeb && (
            <p className="text-xs text-beige-md italic">
              Busca web indisponível — resultados baseados no conhecimento do nicho.
            </p>
          )}
          {trends.map((trend, i) => (
            <div key={i} className="rounded-lg border border-beige-lt bg-cream p-3 space-y-1">
              <p className="text-sm font-semibold text-charcoal">{trend.titulo}</p>
              <p className="text-xs text-beige-md">{trend.por_que_performa}</p>
              <p className="text-xs text-caramel font-medium">{trend.angulo_sugerido}</p>
              <button
                onClick={() => addToIdeas(i, trend)}
                disabled={added[i]}
                className="text-xs border border-beige-lt rounded px-2 py-1 hover:bg-white disabled:opacity-50 mt-1"
              >
                {added[i] ? "✓ Adicionado" : "Adicionar ao banco de ideias"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire into ClientProfile**

Em `src/pages/ClientProfile.tsx`, adicionar import:

```tsx
import { ViralResearch } from "@/components/ai/ViralResearch";
```

Após a seção `AIContextSection`, adicionar:

```tsx
<ViralResearch
  clientId={client.id}
  clientSegment={client.segment}
/>
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/ai-viral-research/ src/components/ai/ViralResearch.tsx src/pages/ClientProfile.tsx
git commit -m "feat(ia-layer): pesquisa proativa de virais — Edge Function + ViralResearch component"
```

---

## Task 12: Daily Briefing — Edge Function + Component + Wire

**Files:**
- Create: `supabase/functions/ai-daily-briefing/index.ts`
- Create: `src/components/ai/DailyBriefing.tsx`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Create ai-daily-briefing**

```typescript
// supabase/functions/ai-daily-briefing/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Fetch operational data
    const [overdue, duesSoon, pendingApproval, wipCounts] = await Promise.all([
      supabase.from("contents")
        .select("id, title, status, production_deadline, approval_deadline, clients(name)")
        .lt("production_deadline", today)
        .not("status", "in", '("aprovado","agendado","publicado","arquivado")')
        .limit(5),

      supabase.from("contents")
        .select("id, title, status, publication_date, production_deadline, clients(name)")
        .gte("publication_date", today)
        .lte("publication_date", in7Days)
        .not("status", "in", '("publicado","arquivado")')
        .limit(5),

      supabase.from("contents")
        .select("id, title, approval_sent_date, clients(name)")
        .eq("status", "aguardando_aprovacao")
        .lt("approval_sent_date", new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())
        .limit(3),

      supabase.from("contents")
        .select("id, format, status")
        .in("status", ["em_producao"])
        .in("format", ["reels", "video"]),
    ]);

    const operationalData = {
      atrasados: overdue.data ?? [],
      publicando_7_dias: duesSoon.data ?? [],
      aguardando_aprovacao_2dias: pendingApproval.data ?? [],
      videos_em_producao: wipCounts.data?.length ?? 0,
    };

    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Você é um assistente de operação para uma estrategista de social media. Analise os dados operacionais abaixo e escreva um briefing de 3-5 linhas para o início do dia.

DADOS:
${JSON.stringify(operationalData, null, 2)}

Regras:
- Comece direto: "Você tem X conteúdos que precisam de atenção hoje."
- Mencione cliente e conteúdo específico quando relevante
- Termine com uma prioridade concreta: "Comece pelo [título] porque [razão]."
- Sem introduções, sem cumprimentos, sem formatação markdown
- Máximo 5 linhas`
      }],
    });

    const briefing = message.content[0].type === "text" ? message.content[0].text : "";

    return new Response(
      JSON.stringify({ briefing, generated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Create DailyBriefing component**

```tsx
// src/components/ai/DailyBriefing.tsx
import { useEffect, useState } from "react";
import { callAI } from "@/lib/ai-client";

const CACHE_KEY = "daily_briefing_cache";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

interface BriefingCache {
  briefing: string;
  generated_at: string;
  cached_at: number;
}

export function DailyBriefing() {
  const [briefing, setBriefing] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>("");

  useEffect(() => {
    loadBriefing();
  }, []);

  function getCache(): BriefingCache | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const cache: BriefingCache = JSON.parse(raw);
      if (Date.now() - cache.cached_at > CACHE_TTL_MS) return null;
      return cache;
    } catch {
      return null;
    }
  }

  async function loadBriefing(force = false) {
    if (!force) {
      const cache = getCache();
      if (cache) {
        setBriefing(cache.briefing);
        setGeneratedAt(cache.generated_at);
        return;
      }
    }

    setLoading(true);
    try {
      const data = await callAI<{ briefing: string; generated_at: string }>(
        "ai-daily-briefing",
        {}
      );
      setBriefing(data.briefing);
      setGeneratedAt(data.generated_at);
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        ...data,
        cached_at: Date.now(),
      }));
    } catch {
      // silently fail — briefing is optional
    } finally {
      setLoading(false);
    }
  }

  if (!briefing && !loading) return null;

  return (
    <div className="rounded-lg border-2 border-caramel/40 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-caramel uppercase tracking-wide">
          🧠 Foco do dia
        </p>
        <button
          onClick={() => loadBriefing(true)}
          disabled={loading}
          className="text-xs text-beige-md hover:text-caramel disabled:opacity-50"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {loading && !briefing ? (
        <p className="text-sm text-beige-md animate-pulse">Analisando sua operação...</p>
      ) : (
        <p className="text-sm text-charcoal leading-relaxed">{briefing}</p>
      )}

      {generatedAt && (
        <p className="text-xs text-beige-md">
          Gerado às {new Date(generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire into Home**

Em `src/pages/Home.tsx`, adicionar import:

```tsx
import { DailyBriefing } from "@/components/ai/DailyBriefing";
```

Após os 6 cards de contagem rápida (e antes de "Ações necessárias hoje"), adicionar:

```tsx
{/* AI Briefing — aparece abaixo dos cards de contagem */}
<DailyBriefing />
```

- [ ] **Step 4: Test in browser**

1. Abrir a Central de Operação
2. Verificar que o briefing aparece em 2-3 segundos
3. Recarregar a página — verificar que usa cache (sem nova chamada de API)
4. Clicar "Atualizar" — verificar nova geração

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/ai-daily-briefing/ src/components/ai/DailyBriefing.tsx src/pages/Home.tsx
git commit -m "feat(ia-layer): DailyBriefing — briefing inteligente na home com cache 2h"
```

---

## Task 13: Seed DOALTO — Migration com Documentos Reais

**Files:**
- Create: `supabase/migrations/20261003000000_seed_doalto_ai_context.sql`

- [ ] **Step 1: Locate DOALTO client ID**

```bash
npx supabase db execute "SELECT id, name FROM clients WHERE name ILIKE '%DOALTO%';"
```

Copiar o UUID retornado. Usar no passo seguinte.

- [ ] **Step 2: Create seed migration**

Criar o arquivo abaixo. Substituir `<DOALTO_CLIENT_ID>` pelo UUID real.

```sql
-- supabase/migrations/20261003000000_seed_doalto_ai_context.sql
-- Insere avatar, business brain e carta de vendas no perfil da DOALTO

UPDATE clients SET
  avatar_doc = $avatar$
# Avatar — Rodrigo, o Síndico que Cansou de Apagar Incêndio
Produto: Contrato de Manutenção Preventiva (recorrente)
Data: 2026-05-14

<!-- Schwartz: Awareness 3/5 (Problem-aware) × Sophistication 3/5 -->

## Identidade Atual
- **Demografia:** Homem, 42–58 anos. Síndico eleito (não profissional) em condomínio residencial de médio porte — 80 a 250 unidades — em Aracaju ou Maceió. Classe média/média-alta.
- **Psicografia:** Se vê como responsável e organizado — mas sente que o cargo o obriga a resolver problemas que não são culpa dele. Desgastado com fornecedores que não cumprem o que prometem.
- **Como ele se descreve:** "Sou o síndico — faço o que posso com o que tenho, mas estou sozinho nisso."

## Dor
- **Sintoma:** Celular toca às 21h com morador preso no elevador. Liga pra empresa — ninguém atende.
- **Causa percebida:** "Contratei uma empresa grande demais pra se importar com meu prédio."
- **Causa real:** Contrato sem SLA + técnico sem rota dedicada + empresa que vende e terceiriza.
- **Custo da inação:** Responsabilidade civil por acidente. Processado por morador preso ou ferido. Perda de reputação. Reeleição em risco.

## Desejo
- **Externo:** Elevador funcionando sem surpresas. Laudos em dia. Zero chamados de emergência surpresa às 22h.
- **Interno:** Dormir sem ansiedade de "o que vai quebrar amanhã".
- **Identidade aspiracional:** O síndico que tomou a decisão certa. Escolheu parceiro de verdade — não o mais barato, o mais sério.

## Objeções (ordem de força)
1. "Toda empresa promete atendimento rápido. Depois que assino, some." — quebra com SLA no contrato, case real, tempo documentado.
2. "Empresa local tem estrutura igual à grande?" — quebra com certificações, NT, currículo do Alves.
3. "Preciso levar pra assembleia." — fornecer material pronto para apresentação.
4. "Estou no meio do contrato com outra empresa." — cálculo do custo de ficar vs. multa rescisória.
5. "A assembleia vai perguntar por que é mais caro." — enquadrar como proteção do patrimônio coletivo.

## Gatilhos
- **Compra:** Elevador quebrou + empresa atual não atendeu em 4h + morador reclamou formalmente. Ou: indicação direta de outro síndico.
- **Recusa:** Sentir que está sendo "vendido", não orientado. Promessa genérica dispara ceticismo.
- **Indicação:** DOALTO resolve emergência rápido → ele conta pra outro síndico porque quer crédito pela decisão certa.

## Schwartz Frame
- **Awareness 3/5 (Problem-aware):** Sabe que tem problema e existem alternativas. Está no "me convença de que você é diferente dos outros".
- **Sophistication 3/5:** Já ouviu "manutenção preventiva", "técnico certificado", "24h" de pelo menos 2 concorrentes. Precisa de mecanismo único.
- **Implicação:** Não abre com benefício genérico. Abre nomeando dor específica e vai direto pro mecanismo diferenciador (o ritual do Alves, o SLA no contrato, o laudo assinado).
$avatar$,

  brain_doc = $brain$
# Business Brain — DOALTO ELEVADORES

## ICP (1 frase)
Síndicos e administradores de condomínios residenciais e comerciais no Nordeste (foco Salvador/Aracaju/Recife) que precisam de empresa confiável e qualificada para manutenção, modernização ou instalação de elevadores.

## Top 3 Ofertas
1. Contrato de Manutenção Preventiva — recorrente — garante funcionamento seguro em conformidade com NT, técnico certificado, atendimento rápido em emergências.
2. Modernização de Elevadores — sob orçamento — substitui componentes obsoletos, aumenta vida útil, segurança e valorização do patrimônio.
3. Instalação de Elevadores Novos — sob orçamento — projeto completo do zero, consultoria técnica até entrega com laudo de conformidade.

## Voice (3 sempre + 3 nunca)

### Sempre
- Tom técnico + direto: fala como especialista que sabe o que faz, não como vendedor. Autoridade sem arrogância.
- Ancora em segurança e NT: toda afirmação forte referencia conformidade, laudo ou risco real.
- Usa linguagem do síndico: "patrimônio", "responsabilidade civil", "condomínio" — não jargão de engenharia pura.

### Nunca
- Nunca promete "o melhor preço" ou compete por custo — posiciona por qualidade técnica e responsabilidade.
- Nunca usa linguagem genérica ("atendemos com excelência", "soluções completas").
- Nunca ignora o histórico negativo do prospect — a copy precisa nomear se ele já teve problema com outra empresa.

## Regra-âncora
Em elevador não existe jeitinho — toda peça de comunicação deve comunicar conformidade com NT como valor inegociável, não como diferencial. É o chão, não o teto. O herói é o Alves (CEO técnico, autoridade no setor), e cada ritual dele (vistoria, reunião, viagem) é prova social em forma de conteúdo. Ícones Ferrari e Trevo traduzem: equipe de alta performance que trabalha certo desde a primeira vez.
$brain$,

  sales_letter_doc = $letter$
Quando sua empresa de elevadores recomenda a troca de uma peça, como você sabe se ela realmente precisa ser trocada?

Prezado Síndico,

Essa situação provavelmente já aconteceu no seu condomínio. A empresa responsável pela manutenção informa que uma peça precisa ser substituída. O orçamento chega. O valor chama a atenção. Você pede uma explicação e recebe uma resposta técnica. Só que a decisão continua sendo sua.

A troca é realmente necessária? O preço é justo? Ou estou sendo enganado?

Essa última pergunta é desconfortável. Mas ela aparece com frequência nas conversas de síndicos e administradoras sobre empresas de elevadores.

[...carta de vendas completa do Eng. Vandilson Alves — #NovoTempoDOALTO — Agilidade + Transparência + Tecnologia — 30 anos de experiência — Le Parc 55 elevadores — técnicos de moto para emergências...]

Solicite sua vistoria técnica gratuita.
WhatsApp: (71) 99667-1494 | @doaltoelevadores | www.doaltoelevadores.com.br

Atenciosamente,
Vandilson Alves — Engenheiro Mecânico — CEO da DOALTO Soluções em Elevadores
$letter$

WHERE name ILIKE '%DOALTO%';
```

**Nota:** O `sales_letter_doc` acima é uma versão resumida. Antes de aplicar, edite o arquivo e cole a carta de vendas **completa** entre os delimitadores `$letter$` e `$letter$`. O texto completo está em `C:\Users\caahr\Downloads\business-brain.md` (carta de vendas) e nas transcrições fornecidas.

- [ ] **Step 3: Apply migration**

```bash
npx supabase db push
```

- [ ] **Step 4: Verify seed**

```bash
npx supabase db execute "SELECT name, length(avatar_doc) as avatar_len, length(brain_doc) as brain_len, length(sales_letter_doc) as letter_len FROM clients WHERE name ILIKE '%DOALTO%';"
```

Expected: todos os 3 campos com length > 0.

- [ ] **Step 5: Smoke test no browser**

1. Abrir perfil da DOALTO — verificar badge "IA completa ✓✓"
2. Abrir qualquer conteúdo da DOALTO — verificar que assistente de IA aparece
3. Clicar "✨ Gerar roteiro" — o hook deve começar nomeando a dor do Rodrigo (não um benefício genérico)
4. Verificar que o resultado inclui `<!-- Schwartz: Awareness 3/5 × Sophistication 3/5 -->`

- [ ] **Step 6: Final commit**

```bash
git add supabase/migrations/20261003000000_seed_doalto_ai_context.sql
git commit -m "feat(ia-layer): seed DOALTO — avatar, business brain e carta de vendas completos"
```

---

## Variáveis de Ambiente Necessárias

Antes de fazer deploy das Edge Functions, configurar em **Supabase → Settings → Edge Functions → Secrets**:

```
ANTHROPIC_API_KEY   = sk-ant-...
EXA_API_KEY         = ...
```

Para desenvolvimento local, criar `.env.local` na raiz:
```
ANTHROPIC_API_KEY=sk-ant-...
EXA_API_KEY=...
```

---

## Critério de Conclusão

O plano está completo quando:
1. Briefing inteligente aparece na home ao abrir o sistema — em uma frase diz o que fazer primeiro e por quê
2. "Multiplicar conteúdo" com transcrição da DOALTO gera os 5 formatos com hook calibrado ao Rodrigo (awareness 3) sem edição manual do tom
3. Pesquisa de virais retorna ≥ 2 tendências acionáveis que viram ideias com 1 clique
4. Perfil da DOALTO mostra badge "IA completa ✓✓"
