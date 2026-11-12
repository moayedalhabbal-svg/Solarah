import { clientIp, corsHeaders, enforceRateLimits, isAllowedOrigin, jsonResponse } from '../_shared/security.ts'

const MAX_PROMPT_CHARS = 8000
const MAX_MESSAGES = 20

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function onlyKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every(key => allowed.includes(key))
}

function validImageBody(body: Record<string, unknown>): body is { type: 'image'; prompt: string } {
  return onlyKeys(body, ['type', 'prompt'])
    && body.type === 'image'
    && typeof body.prompt === 'string'
    && body.prompt.trim().length > 0
    && body.prompt.length <= MAX_PROMPT_CHARS
}

function validChatBody(body: Record<string, unknown>): boolean {
  if (!onlyKeys(body, ['stream', 'system', 'messages'])) return false
  if (body.stream !== undefined && typeof body.stream !== 'boolean') return false
  if (body.system !== undefined && typeof body.system !== 'string') return false
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) return false

  let promptSize = typeof body.system === 'string' ? body.system.length : 0
  for (const message of body.messages) {
    if (!isRecord(message) || !onlyKeys(message, ['role', 'content'])) return false
    if (message.role !== 'user' && message.role !== 'assistant') return false
    if (typeof message.content !== 'string' || !message.content.trim()) return false
    promptSize += message.content.length
  }
  return promptSize <= MAX_PROMPT_CHARS
}

function safeUpstreamError(text: string, apiKey: string): void {
  console.error('Gemini upstream request failed:', text.replaceAll(apiKey, '[REDACTED]'))
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') || ''
  if (!isAllowedOrigin(origin)) return new Response('Forbidden', { status: 403 })

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, origin)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400, origin)
  }
  if (!isRecord(body)) return jsonResponse({ error: 'Request body must be an object' }, 400, origin)

  const imageRequest = body.type === 'image'
  if (imageRequest ? !validImageBody(body) : !validChatBody(body)) {
    return jsonResponse({ error: 'Invalid request shape or prompt exceeds limits' }, 400, origin)
  }

  let rateLimit
  try {
    const ip = clientIp(req)
    rateLimit = await enforceRateLimits([
      { scope: 'ai-proxy:minute', subject: ip, windowSeconds: 60, limit: 20 },
      { scope: 'ai-proxy:day', subject: ip, windowSeconds: 86400, limit: 200 },
    ])
  } catch (error) {
    console.error('AI rate limiting unavailable:', error)
    return jsonResponse({ error: 'AI service temporarily unavailable' }, 503, origin)
  }
  if (!rateLimit.allowed) {
    return jsonResponse(
      { error: 'Rate limit exceeded. Please retry later.' },
      429,
      origin,
      { 'Retry-After': String(rateLimit.retryAfter) },
    )
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not configured')
    return jsonResponse({ error: 'AI service is not configured' }, 500, origin)
  }

  try {
    if (imageRequest) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict'
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          instances: [{ prompt: body.prompt }],
          parameters: { sampleCount: 1 },
        }),
      })
      if (!response.ok) {
        safeUpstreamError(await response.text(), apiKey)
        return jsonResponse({ error: 'Image generation failed' }, 502, origin)
      }
      return jsonResponse(await response.json(), 200, origin)
    }

    const chatBody = body as { stream?: boolean; system?: string; messages: Array<{ role: string; content: string }> }
    const geminiBody: Record<string, unknown> = {
      contents: chatBody.messages.map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
    }
    if (chatBody.system) geminiBody.systemInstruction = { parts: [{ text: chatBody.system }] }

    const endpoint = chatBody.stream ? 'streamGenerateContent?alt=sse' : 'generateContent'
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:${endpoint}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(geminiBody),
      },
    )
    if (!response.ok) {
      safeUpstreamError(await response.text(), apiKey)
      return jsonResponse({ error: 'AI generation failed' }, 502, origin)
    }

    if (chatBody.stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders(origin),
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }
    return jsonResponse(await response.json(), 200, origin)
  } catch (error) {
    console.error('AI proxy request failed:', error)
    return jsonResponse({ error: 'AI service request failed' }, 502, origin)
  }
})
