const EXACT_ORIGINS = new Set([
  'https://solarah-five.vercel.app',
  'http://localhost:5173',
])

const PREVIEW_ORIGIN_PATTERNS = [
  /^https:\/\/solarah-git-[a-z0-9-]+-moayedalhabbal-9761\.vercel\.app$/,
  /^https:\/\/solarah-[a-z0-9-]+-moayedalhabbal-9761\.vercel\.app$/,
]

export function isAllowedOrigin(origin: string): boolean {
  return EXACT_ORIGINS.has(origin) || PREVIEW_ORIGIN_PATTERNS.some(pattern => pattern.test(origin))
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  })
}

export function clientIp(req: Request): string {
  return req.headers.get('cf-connecting-ip')?.trim()
    || req.headers.get('x-real-ip')?.trim()
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function checkRateLimit(
  scope: string,
  subject: string,
  windowSeconds: number,
  limit: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Rate-limit service configuration is unavailable')
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const bucketStart = Math.floor(nowSeconds / windowSeconds) * windowSeconds
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/consume_rate_limit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      p_scope: scope,
      p_subject_hash: await sha256(subject),
      p_window_start: new Date(bucketStart * 1000).toISOString(),
      p_window_seconds: windowSeconds,
      p_limit: limit,
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    console.error('Rate-limit RPC failed:', response.status, detail)
    throw new Error('Rate-limit service request failed')
  }

  const result = await response.json()
  const row = Array.isArray(result) ? result[0] : result
  if (typeof row?.allowed !== 'boolean' || !Number.isFinite(Number(row?.retry_after))) {
    throw new Error('Rate-limit RPC returned an invalid response')
  }
  return { allowed: row.allowed, retryAfter: Math.max(1, Number(row.retry_after)) }
}

export async function enforceRateLimits(
  checks: Array<{ scope: string; subject: string; windowSeconds: number; limit: number }>,
): Promise<{ allowed: boolean; retryAfter: number }> {
  for (const check of checks) {
    const result = await checkRateLimit(
      check.scope,
      check.subject,
      check.windowSeconds,
      check.limit,
    )
    if (!result.allowed) return result
  }
  return { allowed: true, retryAfter: 0 }
}
