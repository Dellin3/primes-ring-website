import test from 'node:test'
import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import { randomUUID } from 'node:crypto'
import { CONTACT_EMAIL, MAX_BODY_BYTES, createFeedbackHandler, createRateLimiter } from '../server/feedback.mjs'
import { createPrivateFeedbackStore, createResendNotifier } from '../server/feedback-store.mjs'

const origin = 'https://primes-ring-website-p9yv.vercel.app'
const env = {
  NODE_ENV: 'production', VERCEL: '1',
  BLOB_READ_WRITE_TOKEN: 'fake-private-token', RESEND_API_KEY: 'fake-resend-key',
  FEEDBACK_FROM_EMAIL: 'PRIMES Feedback <feedback@example.org>',
}
const feedback = (overrides = {}) => ({
  id: '583077c5-b292-48bb-a60a-7c3e0bef6e30', category: 'content',
  message: 'Could you add an explanation of this graph?', name: 'Student',
  email: 'student@example.org', page: '/research/stationary-phase', website: '', ...overrides,
})

function memoryStore() {
  const records = new Map()
  return {
    records,
    async create(path, record) {
      if (records.has(path)) throw new Error('Already exists')
      records.set(path, structuredClone(record))
    },
    async read(path) { return structuredClone(records.get(path) ?? null) },
  }
}

function fixture(options = {}) {
  const store = options.store || memoryStore()
  const mail = []
  const notify = options.notify || (async (payload, key) => { mail.push({ payload, key }); return { id: 'provider-receipt' } })
  return { store, mail, handler: createFeedbackHandler({ env, store, notify, ...options }) }
}

async function request(handler, { method = 'POST', body = feedback(), headers = {}, chunks } = {}) {
  const req = chunks ? Readable.from(chunks) : {}
  req.method = method
  req.headers = { origin, 'content-type': 'application/json', ...headers }
  if (!chunks) req.body = body
  const responseHeaders = {}
  let raw = ''
  const res = { statusCode: 0, setHeader: (key, value) => { responseHeaders[key] = value }, end: (value) => { raw = value } }
  await handler(req, res)
  return { status: res.statusCode, body: JSON.parse(raw), headers: responseHeaders, raw }
}

test('GET exposes configuration only, with no private read/list endpoint or cache', async () => {
  const f = fixture()
  const result = await request(f.handler, { method: 'GET', body: { id: feedback().id } })
  assert.deepEqual(result.body, { enabled: true })
  assert.equal(result.headers['Cache-Control'], 'no-store')
  assert.equal(f.store.records.size, 0)
  const disabled = await request(createFeedbackHandler({ env: {} }), { method: 'GET' })
  assert.deepEqual(disabled.body, { enabled: false })
})

test('each required missing server variable disables direct submission', async () => {
  for (const key of ['BLOB_READ_WRITE_TOKEN', 'RESEND_API_KEY', 'FEEDBACK_FROM_EMAIL']) {
    const f = fixture({ env: { ...env, [key]: '' } })
    assert.equal((await request(f.handler, { method: 'GET' })).body.enabled, false)
    const result = await request(f.handler)
    assert.equal(result.status, 503)
    assert.equal(result.body.ok, false)
    assert.equal(f.store.records.size, 0)
    assert.equal(f.mail.length, 0)
  }
})

test('durably saves before email, fixes recipient, and only exposes an opaque id', async () => {
  const store = memoryStore()
  const f = fixture({ store, notify: async (payload) => {
    assert.equal(store.records.has(`feedback/${feedback().id}.json`), true)
    assert.deepEqual(payload.to, [CONTACT_EMAIL])
    assert.equal(payload.reply_to, 'student@example.org')
    return { id: 'provider-receipt' }
  } })
  const result = await request(f.handler)
  assert.deepEqual(result.body, { ok: true, saved: true, id: feedback().id, notificationSent: true })
  assert.equal(result.raw.includes('student@example.org'), false)
  assert.equal(result.raw.includes('blob'), false)
  const saved = store.records.get(`feedback/${feedback().id}.json`)
  assert.equal(saved.feedback.message, feedback().message)
  assert.equal('ip' in saved, false)
  assert.equal('userAgent' in saved, false)
})

test('storage failure never claims success or sends an email', async () => {
  const f = fixture({ store: { create: async () => { throw new Error('private secret error') }, read: async () => null } })
  const result = await request(f.handler)
  assert.equal(result.status, 503)
  assert.equal(result.body.ok, false)
  assert.equal(f.mail.length, 0)
  assert.equal(result.raw.includes('private secret'), false)
})

test('a timed-out create is confirmed by reading back the immutable stored record', async () => {
  const store = memoryStore()
  const create = store.create
  store.create = async (...args) => { await create(...args); throw new Error('Network timeout after upload') }
  const result = await request(fixture({ store }).handler)
  assert.equal(result.status, 200)
  assert.equal(result.body.saved, true)
})

test('email failure preserves feedback and reports saved without claiming notification', async () => {
  const f = fixture({ notify: async () => { throw new Error('Secret provider error') } })
  const result = await request(f.handler)
  assert.equal(result.status, 200)
  assert.equal(result.body.saved, true)
  assert.equal(result.body.notificationSent, false)
  assert.equal(f.store.records.size, 1)
  assert.equal(result.raw.includes('provider'), false)
})

test('same id and canonical content neither overwrites nor duplicates accepted mail', async () => {
  const f = fixture()
  await request(f.handler)
  const original = f.store.records.get(`feedback/${feedback().id}.json`)
  const result = await request(f.handler, { body: feedback({ message: `  ${feedback().message}  ` }) })
  assert.equal(result.status, 200)
  assert.equal(f.mail.length, 1)
  assert.deepEqual(f.store.records.get(`feedback/${feedback().id}.json`), original)
  const conflicting = await request(f.handler, { body: feedback({ message: 'A completely different request.' }) })
  assert.equal(conflicting.status, 409)
  assert.equal(f.mail.length, 1)
  assert.deepEqual(f.store.records.get(`feedback/${feedback().id}.json`), original)
})

test('failed email retries use exactly the same persisted payload and idempotency key', async () => {
  let time = Date.parse('2026-10-01T00:00:00Z')
  const attempts = []
  const f = fixture({ now: () => time, notify: async (payload, key) => {
    attempts.push({ payload, key })
    if (attempts.length === 1) throw new Error('Timeout')
    return { id: 'accepted' }
  } })
  assert.equal((await request(f.handler)).body.notificationSent, false)
  time += 120_000
  assert.equal((await request(f.handler)).body.notificationSent, true)
  assert.deepEqual(attempts[0], attempts[1])
  assert.equal(attempts[0].key, `primes-feedback/${feedback().id}`)
})

test('unrecorded mail receipt retries stop before provider idempotency expiry', async () => {
  let time = Date.parse('2026-10-01T00:00:00Z')
  const store = memoryStore()
  const create = store.create
  store.create = async (path, record) => {
    if (path.startsWith('feedback-notifications/')) throw new Error('Marker storage unavailable')
    return create(path, record)
  }
  const f = fixture({ store, now: () => time })
  assert.equal((await request(f.handler)).body.notificationSent, true)
  time += 24 * 60 * 60 * 1000
  const result = await request(f.handler)
  assert.equal(result.body.saved, true)
  assert.equal(result.body.notificationSent, false)
  assert.equal(f.mail.length, 1)
})

test('concurrent retries keep one record and use one provider idempotency key', async () => {
  const f = fixture()
  const results = await Promise.all([request(f.handler), request(f.handler)])
  assert.ok(results.every((result) => result.status === 200))
  assert.equal([...f.store.records.keys()].filter((key) => key.startsWith('feedback/')).length, 1)
  assert.equal(new Set(f.mail.map((item) => item.key)).size, 1)
  assert.equal(new Set(f.mail.map((item) => JSON.stringify(item.payload))).size, 1)
})

test('rejects cross-origin, missing origin, and forged Host; accepts trusted Vercel preview', async () => {
  const f = fixture({ env: { ...env, VERCEL_URL: 'primes-preview-team.vercel.app' } })
  for (const headers of [
    { origin: 'https://attacker.example', host: 'attacker.example' },
    { origin: '' }, { origin: 'null' }, { 'sec-fetch-site': 'cross-site' },
    { origin: 'http://localhost:3000' },
    { origin: `${origin}.attacker.example` },
  ]) assert.equal((await request(f.handler, { headers })).status, 403)
  const result = await request(f.handler, { headers: { origin: 'https://primes-preview-team.vercel.app' } })
  assert.equal(result.status, 200)
  assert.equal(f.mail.length, 1)
})

test('custom apex accepts same-origin feedback while forged request Host stays untrusted', async () => {
  const f = fixture()
  const result = await request(f.handler, { headers: { origin: 'https://saturnringlab.com' } })
  assert.equal(result.status, 200)
  assert.equal(f.store.records.size, 2)
  assert.equal(f.mail.length, 1)
  const forged = await request(f.handler, { headers: { origin: 'https://saturnringlab.com.attacker.example', host: 'saturnringlab.com' } })
  assert.equal(forged.status, 403)
  assert.equal(f.store.records.size, 2)
  assert.equal(f.mail.length, 1)
})

test('only development allows fixed localhost origins', async () => {
  const f = fixture({ env: { ...env, VERCEL_ENV: 'development' } })
  assert.equal((await request(f.handler, { headers: { origin: 'http://localhost:3000' } })).status, 200)
  assert.equal((await request(f.handler, { headers: { origin: 'http://localhost:8888' } })).status, 403)
})

test('validation blocks malformed values, controls, relay fields, external paths, and honeypot', async () => {
  const invalid = [
    [], null, feedback({ id: '../../read-private' }), feedback({ category: 'to-owner' }),
    feedback({ message: 'short' }), feedback({ message: 'x'.repeat(5001) }),
    feedback({ message: 'Looks normal\u0000hidden' }), feedback({ message: { text: 'invalid object' } }),
    feedback({ name: 'a'.repeat(101) }), feedback({ name: 'Jane\nInjected' }),
    feedback({ email: 'a@b.example\r\nBcc: attacker@example.org' }), feedback({ email: 'invalid' }),
    feedback({ page: '//attacker.example/a' }), feedback({ page: '/\\attacker.example/a' }),
    feedback({ page: 'https://attacker.example/a' }), feedback({ page: '/a%0Ab' }),
    feedback({ website: 'bot field' }), feedback({ website: true }),
    { ...feedback(), to: 'attacker@example.org' },
  ]
  for (const body of invalid) {
    const f = fixture()
    const result = await request(f.handler, { body })
    assert.equal(result.status, 400, JSON.stringify(body))
    assert.equal(f.store.records.size, 0)
    assert.equal(f.mail.length, 0)
  }
})

test('accepts anonymous Unicode feedback and strips page query and fragment', async () => {
  const f = fixture()
  const body = feedback({ message: '希望这里能够补充对图表坐标的详细说明。', name: '', email: '', page: '/research?token=secret#private' })
  assert.equal((await request(f.handler, { body })).status, 200)
  assert.equal(f.store.records.get(`feedback/${body.id}.json`).feedback.page, '/research')
  assert.equal('reply_to' in f.mail[0].payload, false)
})

test('enforces JSON media type, encoding, header and exact streamed body byte limits', async () => {
  const f = fixture()
  assert.equal((await request(f.handler, { headers: { 'content-type': 'text/plain' } })).status, 415)
  assert.equal((await request(f.handler, { headers: { 'content-encoding': 'gzip' } })).status, 415)
  assert.equal((await request(f.handler, { headers: { 'content-length': `${MAX_BODY_BYTES + 1}` } })).status, 413)
  assert.equal((await request(f.handler, { chunks: [Buffer.alloc(MAX_BODY_BYTES), Buffer.from('x')] })).status, 413)
  assert.equal((await request(f.handler, { body: ' '.repeat(MAX_BODY_BYTES + 1) })).status, 413)
  assert.equal((await request(f.handler, { body: '{broken json' })).status, 400)
  assert.equal((await request(f.handler, { chunks: [Buffer.from([0xc3, 0x28])] })).status, 400)
  assert.equal((await request(f.handler, { chunks: [JSON.stringify(feedback())] })).status, 200)
})

test('bounded per-instance limiter rejects bursts and recovers without retaining client data', async () => {
  let time = 100
  const f = fixture({ rateLimit: createRateLimiter({ limit: 2, now: () => time }) })
  for (let i = 0; i < 2; i++) assert.equal((await request(f.handler, { body: feedback({ id: randomUUID() }) })).status, 200)
  const limited = await request(f.handler)
  assert.equal(limited.status, 429)
  assert.equal(limited.headers['Retry-After'], '60')
  time += 60_000
  assert.equal((await request(f.handler)).status, 200)
})

test('unsupported methods do not write data and advertise supported methods', async () => {
  const f = fixture()
  const result = await request(f.handler, { method: 'DELETE' })
  assert.equal(result.status, 405)
  assert.equal(result.headers.Allow, 'GET, POST')
  assert.equal(f.store.records.size, 0)
})

test('Blob adapter always uses private, immutable writes and authenticated uncached reads', async () => {
  const calls = []
  const sdk = {
    put: async (...args) => { calls.push({ method: 'put', args }) },
    get: async (...args) => {
      calls.push({ method: 'get', args })
      return { statusCode: 200, stream: new Response(JSON.stringify({ ok: true })).body }
    },
  }
  const store = createPrivateFeedbackStore('test-private-token', async () => sdk)
  await store.create('feedback/test.json', { message: 'test' })
  assert.deepEqual(await store.read('feedback/test.json'), { ok: true })
  const write = calls[0].args[2]
  assert.equal(write.access, 'private')
  assert.equal(write.allowOverwrite, false)
  assert.equal(write.addRandomSuffix, false)
  assert.equal(write.token, 'test-private-token')
  assert.equal(calls[1].args[1].useCache, false)
  assert.equal(calls[1].args[1].access, 'private')
})

test('Resend adapter uses a fixed endpoint and stable idempotency header; rejects nonacceptance', async () => {
  const calls = []
  const sender = createResendNotifier('test-key', async (...args) => {
    calls.push(args)
    return new Response(JSON.stringify({ id: 'accepted-id' }), { status: 200 })
  })
  const receipt = await sender({ to: [CONTACT_EMAIL], text: 'Test' }, 'fixed-key')
  assert.deepEqual(receipt, { id: 'accepted-id' })
  assert.equal(calls[0][0], 'https://api.resend.com/emails')
  assert.equal(calls[0][1].headers['Idempotency-Key'], 'fixed-key')
  const failingSender = createResendNotifier('test-key', async () => new Response('{}', { status: 403 }))
  await assert.rejects(failingSender({}, 'key'), /Notification not accepted/u)
})
