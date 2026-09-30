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
      .select('name, segment, cities, services, target_audience, brain_doc')
      .eq('id', body.client_id)
      .single()

    if (!client) throw new Error('Cliente nao encontrado')

    const segment = client.segment || ''
    const services = client.services || ''
    const cities = client.cities || ''
    const brain = (client.brain_doc || '').substring(0, 600)

    // Ano atual e proximo para gerar datas futuras relevantes
    const now = new Date()
    const currentYear = now.getFullYear()
    const nextYear = currentYear + 1

    const prompt = [
      'Voce e um especialista em marketing de conteudo no Brasil.',
      '',
      'CLIENTE: ' + client.name,
      'SEGMENTO / NICHO: ' + segment,
      'SERVICOS: ' + services,
      'CIDADES: ' + cities,
      '',
      'DNA DO NEGOCIO:',
      brain,
      '',
      'Gere uma lista de datas comemorativas, eventos e oportunidades de conteudo',
      'ESPECIFICAS deste nicho para ' + currentYear + ' e ' + nextYear + '.',
      '',
      'Inclua:',
      '- Dias profissionais do setor (ex: Dia do Engenheiro, Dia do Medico)',
      '- Feiras, congressos e eventos do segmento no Brasil',
      '- Datas sazonais que afetam diretamente este nicho',
      '- Datas civicas relevantes para o publico deste segmento',
      '- Meses tematicos do setor',
      '',
      'NAO inclua datas genericas como Natal, Ano Novo, Dia das Maes a menos que sejam',
      'genuinamente relevantes para este segmento especifico.',
      '',
      'Para cada data:',
      '- name: nome da data/evento',
      '- date: formato YYYY-MM-DD',
      '- category: categoria (profissional, evento, sazonal, civica)',
      '- relevance: por que importa para este nicho (1 frase)',
      '- should_create_content: true se vale criar conteudo para essa data',
      '',
      'Retorne JSON:',
      '{',
      '  "dates": [',
      '    {',
      '      "name": "Dia do Engenheiro Civil",',
      '      "date": "' + currentYear + '-10-25",',
      '      "category": "profissional",',
      '      "relevance": "Data de celebracao da categoria, alto engajamento",',
      '      "should_create_content": true',
      '    }',
      '  ]',
      '}',
      '',
      'Retorne entre 10 e 20 datas. Responda APENAS com JSON valido.',
    ].join('\n')

    const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + groqKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      }),
    })

    const groqData = await groqResp.json()
    if (!groqData.choices || !groqData.choices[0]) throw new Error(JSON.stringify(groqData))

    const text = groqData.choices[0].message.content
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON invalido: ' + text)

    const result = JSON.parse(match[0])
    const dates = result.dates || []

    if (dates.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, dates: [] }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Insere no banco com client_id — ignora duplicatas pelo nome+data+client
    const rows = dates.map((d: any) => ({
      name: d.name,
      date: d.date,
      category: d.category || null,
      relevance: d.relevance || null,
      should_create_content: d.should_create_content ?? true,
      client_id: body.client_id,
      notes: null,
      region: cities || null,
    }))

    const { data: inserted, error } = await supabase
      .from('important_dates')
      .upsert(rows, { onConflict: 'name,date,client_id', ignoreDuplicates: true })
      .select()

    if (error) throw new Error(JSON.stringify(error))

    return new Response(JSON.stringify({ inserted: inserted?.length ?? 0, dates: inserted }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
