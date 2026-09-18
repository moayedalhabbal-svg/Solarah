// ════════════════════════════════════════════════════════════════════════
// SOLARAH — Gemini API Proxy (Supabase Edge Function)
// ════════════════════════════════════════════════════════════════════════

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || ''

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } })
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } })
  }

  try {
    const body = await req.json()
    const { stream = false, system, messages } = body

    // Convert OpenAI/Anthropic format to Gemini format
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || m.text }]
    }))

    const geminiBody: any = { contents }
    if (system) {
      geminiBody.systemInstruction = { parts: [{ text: system }] }
    }

    const endpoint = stream ? 'streamGenerateContent?alt=sse' : 'generateContent'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:${endpoint}`

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(geminiBody),
    })

    if (!res.ok) {
      const err = await res.text()
      return new Response(JSON.stringify({ error: 'Gemini API error', detail: err }), { status: res.status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } })
    }

    if (stream) {
      return new Response(res.body, {
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    const data = await res.json()
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', detail: String(err) }), { status: 500, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } })
  }
})
