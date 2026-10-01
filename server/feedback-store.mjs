// These adapters are server-only. Tests inject substitutes and never send mail.
export function createPrivateFeedbackStore(token, loadSdk = () => import('@vercel/blob')) {
  return {
    async read(pathname) {
      const { get } = await loadSdk()
      const result = await get(pathname, {
        access: 'private', token, useCache: false,
        abortSignal: AbortSignal.timeout(4000),
      })
      if (result === null) return null
      if (result.statusCode !== 200 || !result.stream) throw new Error('Storage read failed')
      return new Response(result.stream).json()
    },
    async create(pathname, record) {
      const { put } = await loadSdk()
      await put(pathname, JSON.stringify(record), {
        access: 'private', token, addRandomSuffix: false, allowOverwrite: false,
        contentType: 'application/json', cacheControlMaxAge: 60,
        abortSignal: AbortSignal.timeout(4000),
      })
    },
  }
}

export function createResendNotifier(apiKey, fetchImpl = globalThis.fetch) {
  return async (payload, idempotencyKey) => {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    })
    // Acceptance is not proof of delivery. Never expose provider errors or keys.
    if (!response.ok) throw new Error('Notification not accepted')
    const result = await response.json()
    if (typeof result.id !== 'string' || !result.id) throw new Error('Missing notification receipt')
    return { id: result.id }
  }
}
