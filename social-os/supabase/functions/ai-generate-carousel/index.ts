import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const body = await req.json()
    const groqKey = Deno.env.get('GROQ_API_KEY')
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    const { data: client } = await supabase
      .from('clients')
      .select('name, voice_tone, avatar_doc, brain_doc, sales_letter_doc')
      .eq('id', body.client_id)
      .single()

    const nome = client ? client.name : ''
    const voz = client ? client.voice_tone : 'profissional'
    const avatar = client ? (client.avatar_doc || '') : ''
    const brain = client ? (client.brain_doc || '') : ''
    const carta = client ? ((client.sales_letter_doc || '').substring(0, 1000)) : ''

    const prompt = [
      'Voce e especialista em social media. Crie um carrossel completo para Instagram.',
      '',
      'CONTEUDO: ' + (body.title || ''),
      'OBJETIVO: ' + (body.objective || 'engajamento'),
      'CLIENTE: ' + nome,
      'TOM: ' + voz,
      '',
      'TRANSCRICAO / NOTAS DO VIDEO (use isso como base principal do conteudo):',
      (body.notes || 'Nao informado'),
      '',
      'AVATAR:',
      avatar,
      '',
      'DNA DO NEGOCIO:',
      brain,
      '',
      'CARTA DE VENDAS:',
      carta,
      '',
      'Crie um carrossel com no maximo 10 slides. Retorne JSON com esta estrutura:',
      '{',
      '  "slides": [',
      '    { "numero": 1, "tipo": "capa", "titulo": "titulo impactante", "texto": "frase de gancho curta" },',
      '    { "numero": 2, "tipo": "conteudo", "titulo": "titulo do slide", "texto": "texto do slide em 2 a 3 linhas" },',
      '    { "numero": 3, "tipo": "conteudo", "titulo": "...", "texto": "..." },',
      '    { "numero": 10, "tipo": "cta", "titulo": "titulo CTA", "texto": "chamada para acao" }',
      '  ],',
      '  "legenda": "legenda Instagram para o carrossel com gancho, CTA e hashtags"',
      '}',
      '',
      'Responda APENAS com JSON valido, sem texto antes ou depois.',
    ].join('\n')

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + groqKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    if (!data.choices || !data.choices[0]) throw new Error(JSON.stringify(data))

    const text = data.choices[0].message.content
    const match = text.match(/\{[\s\S]*\}/)
    const result = match ? JSON.parse(match[0]) : { error: 'JSON invalido', raw: text }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
