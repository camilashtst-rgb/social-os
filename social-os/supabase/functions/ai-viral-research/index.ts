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
    const exaKey = Deno.env.get('EXA_API_KEY')
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    // Busca dados completos do cliente para contexto real
    const { data: client } = await supabase
      .from('clients')
      .select('name, segment, cities, target_audience, services, voice_tone, avatar_doc, brain_doc')
      .eq('id', body.client_id)
      .single()

    const segment = client?.segment || body.segment || ''
    const cities = client?.cities || body.cities || ''
    const clientName = client?.name || body.client_name || ''
    const services = client?.services || ''
    const audience = client?.target_audience || ''
    const brain = (client?.brain_doc || '').substring(0, 800)

    // Monta query de busca Exa focada no segmento real do cliente
    const searchQuery = buildSearchQuery(segment, services, cities)

    // Busca artigos reais sobre o segmento via Exa
    let exaResults: any[] = []
    if (exaKey && searchQuery) {
      const exaResp = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'x-api-key': exaKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          numResults: 8,
          useAutoprompt: true,
          type: 'neural',
          contents: { text: { maxCharacters: 400 } },
        }),
      })
      const exaData = await exaResp.json()
      exaResults = exaData.results || []
    }

    const exaContext = exaResults.map((r: any) => `- ${r.title}: ${r.text || ''}`).join('\n')

    // Prompt focado no segmento do cliente — sem marketing digital genérico
    const prompt = [
      'Voce e um estrategista de conteudo especializado no setor: ' + segment,
      '',
      'CLIENTE: ' + clientName,
      'SEGMENTO: ' + segment,
      'SERVICOS: ' + services,
      'PUBLICO-ALVO: ' + audience,
      'CIDADES: ' + cities,
      '',
      'DNA DO NEGOCIO (use para alinhar os temas):',
      brain,
      '',
      exaResults.length > 0 ? 'NOTICIAS E TENDENCIAS REAIS DO SETOR (encontradas agora):' : 'Gere ideias baseadas no setor especifico:',
      exaContext || '(sem resultados externos — gere com base no segmento)',
      '',
      'Gere 6 ideias de conteudo para redes sociais (Instagram/YouTube) sobre o SETOR especifico deste cliente.',
      'NAO gere conteudo sobre marketing digital, social media, agencias ou estrategia de conteudo.',
      'Gere sobre o NEGOCIO em si: o que o publico-alvo quer saber sobre ' + segment + '.',
      '',
      'Para cada ideia:',
      '- titulo: titulo chamativo para o conteudo (como seria postado)',
      '- angulo: por que esse tema interessa o publico deste segmento',
      '- formato: reels, carrossel, feed ou video',
      '',
      'Retorne JSON:',
      '{',
      '  "ideas": [',
      '    { "titulo": "...", "angulo": "...", "formato": "reels" },',
      '    ...',
      '  ]',
      '}',
      '',
      'Responda APENAS com JSON valido.',
    ].join('\n')

    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + groqKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    })

    const groqData = await groqResp.json()
    if (!groqData.choices || !groqData.choices[0]) throw new Error(JSON.stringify(groqData))

    const text = groqData.choices[0].message.content
    const match = text.match(/\{[\s\S]*\}/)
    const result = match ? JSON.parse(match[0]) : { error: 'JSON invalido', raw: text }

    // Mescla resultados: ideias geradas + links de referencia do Exa
    const output = {
      ideas: result.ideas || [],
      references: exaResults.slice(0, 4).map((r: any) => ({ title: r.title, url: r.url })),
      segment,
      client_name: clientName,
    }

    return new Response(JSON.stringify(output), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})

function buildSearchQuery(segment: string, services: string, cities: string): string {
  if (!segment) return ''

  // Limpa e simplifica o segmento para a query
  const seg = segment.toLowerCase().trim()
  const city = cities ? cities.split('/')[0].trim() : ''

  // Termos de conteúdo evitados intencionalmente (não queremos resultados de marketing)
  const contentTerms = 'tendencias novidades mercado 2024 2025'

  if (city) {
    return `${seg} ${contentTerms} ${city}`
  }
  return `${seg} ${contentTerms} Brasil`
}
