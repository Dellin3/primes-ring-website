import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { createPrivateFeedbackStore, createResendNotifier } from './feedback-store.mjs'

export const CONTACT_EMAIL = 'Zhuoxuan780123@gmail.com'
export const MAX_BODY_BYTES = 32 * 1024
const PRODUCTION_ORIGIN = 'https://primes-ring-website-p9yv.vercel.app'
const CATEGORIES = new Set(['bug', 'content', 'idea', 'other'])
const FIELDS = new Set(['id', 'category', 'message', 'name', 'email', 'page', 'website'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
// Reject invisible control characters while allowing ordinary multiline text.
// eslint-disable-next-line no-control-regex
const UNSAFE_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u
const SINGLE_LINE_CONTROLS = /[\r\n\t]/u
const EMAIL = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/u
// Resend retains idempotency keys for 24h. Stop automated retries before expiry.
const NOTIFICATION_RETRY_MS = 23 * 60 * 60 * 1000

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

function header(req, name) {
  const value = req.headers?.[name]
  return typeof value === 'string' ? value : ''
}

function configured(env) {
  return ['BLOB_READ_WRITE_TOKEN', 'RESEND_API_KEY', 'FEEDBACK_FROM_EMAIL']
    .every((key) => typeof env[key] === 'string' && env[key].trim())
    && !/[\r\n]/u.test(env.FEEDBACK_FROM_EMAIL)
}

function allowedOrigins(env) {
  const origins = new Set([PRODUCTION_ORIGIN])
  // These are deployment-supplied values, never the request Host header.
  for (const key of ['VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'VERCEL_BRANCH_URL']) {
    const host = env[key]
    if (typeof host === 'string' && /^[a-z\d](?:[a-z\d.-]*[a-z\d])?$/iu.test(host)) {
      origins.add(`https://${host.toLowerCase()}`)
    }
  }
  if (env.VERCEL_ENV === 'development' || (!env.VERCEL && env.NODE_ENV !== 'production')) {
    for (const port of [3000, 5173, 4173]) {
      origins.add(`http://localhost:${port}`)
      origins.add(`http://127.0.0.1:${port}`)
    }
  }
  return origins
}

export function createRateLimiter({ limit = 30, windowMs = 60_000, now = Date.now } = {}) {
  // Deliberately per warm function instance, not a global or per-user limit.
  // No IP addresses, user agents, or unbounded client maps are retained.
  let start = now()
  let count = 0
  return () => {
    const time = now()
    if (time - start >= windowMs || time < start) { start = time; count = 0 }
    if (count >= limit) return false
    count += 1
    return true
  }
}

async function readJson(req) {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?\s*$/iu.test(header(req, 'content-type'))) {
    throw new RequestError(415, 'Please send JSON feedback.')
  }
  const encoding = header(req, 'content-encoding')
  if (encoding && encoding !== 'identity') throw new RequestError(415, 'Unsupported content encoding.')
  const length = header(req, 'content-length')
  if (length && (!/^\d+$/u.test(length) || Number(length) > MAX_BODY_BYTES)) {
    throw new RequestError(413, 'Feedback is too large.')
  }
  let raw = req.body
  if (raw === undefined) {
    const chunks = []
    let size = 0
    for await (const chunk of req) {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      size += bytes.length
      if (size > MAX_BODY_BYTES) throw new RequestError(413, 'Feedback is too large.')
      chunks.push(bytes)
    }
    raw = Buffer.concat(chunks)
  }
  try {
    // Vercel may already have parsed JSON. Check its encoded size as well as the
    // incoming Content-Length; the streamed path applies an exact byte limit.
    const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(typeof raw === 'string' ? raw : JSON.stringify(raw))
    if (bytes.length > MAX_BODY_BYTES) throw new RequestError(413, 'Feedback is too large.')
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch (error) {
    if (error instanceof RequestError) throw error
    throw new RequestError(400, 'Feedback must be valid JSON.')
  }
}

function textField(body, name, max, { required = false, multiline = false } = {}) {
  const value = body[name]
  if (value === undefined && !required) return ''
  if (typeof value !== 'string' || value.length > max || UNSAFE_CONTROLS.test(value)
    || (!multiline && SINGLE_LINE_CONTROLS.test(value))) {
    throw new RequestError(400, `Please check the ${name} field.`)
  }
  const normalized = value.normalize('NFC').replace(/\r\n?/gu, '\n').trim()
  if (normalized.length > max) throw new RequestError(400, `Please check the ${name} field.`)
  return normalized
}

function validate(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some((key) => !FIELDS.has(key))) {
    throw new RequestError(400, 'Please check the feedback fields.')
  }
  const id = textField(body, 'id', 36, { required: true }).toLowerCase()
  const category = textField(body, 'category', 20, { required: true })
  const message = textField(body, 'message', 5000, { required: true, multiline: true })
  const name = textField(body, 'name', 100)
  const email = textField(body, 'email', 254)
  let page = textField(body, 'page', 1000)
  const website = textField(body, 'website', 200)
  if (website) throw new RequestError(400, 'Feedback could not be submitted.')
  if (!UUID.test(id)) throw new RequestError(400, 'Please reload the form and try again.')
  if (!CATEGORIES.has(category)) throw new RequestError(400, 'Please choose a feedback category.')
  if (message.length < 10) throw new RequestError(400, 'Please write at least 10 characters.')
  if (email && !EMAIL.test(email)) throw new RequestError(400, 'Please enter a valid email address.')
  if (page) {
    try {
      const decoded = decodeURIComponent(page)
      const url = new URL(page, PRODUCTION_ORIGIN)
      if (!page.startsWith('/') || page.startsWith('//') || decoded.includes('\\')
        || UNSAFE_CONTROLS.test(decoded) || SINGLE_LINE_CONTROLS.test(decoded)
        || url.origin !== PRODUCTION_ORIGIN) throw new Error('Invalid path')
      // Do not retain query parameters or fragments that might contain secrets.
      page = url.pathname
    } catch { throw new RequestError(400, 'Please use a page path such as /research.') }
  }
  return { id, category, message, name, email, page }
}

function contentHash(feedback) {
  return createHash('sha256').update(JSON.stringify(feedback)).digest('hex')
}

function notificationPayload(record) {
  const f = record.feedback
  return {
    from: record.sender,
    to: [CONTACT_EMAIL],
    ...(f.email ? { reply_to: f.email } : {}),
    subject: `[PRIMES feedback] ${f.category} · ${f.id}`,
    text: [
      'A visitor submitted feedback to the PRIMES Saturn rings website.',
      `Reference: ${f.id}`, `Received: ${record.createdAt}`, `Category: ${f.category}`,
      `Page: ${f.page || '(not specified)'}`, `Name: ${f.name || '(not provided)'}`,
      `Reply email: ${f.email || '(not provided)'}`, '', 'Visitor feedback:', f.message,
    ].join('\n'),
  }
}

async function saveFeedback(store, feedback, sender, now) {
  const path = `feedback/${feedback.id}.json`
  const hash = contentHash(feedback)
  const record = { version: 1, contentHash: hash, createdAt: new Date(now()).toISOString(), sender, feedback }
  try {
    await store.create(path, record)
    return record
  } catch {
    // The upload may have succeeded just before a timeout, or another request
    // may have won the create. Read back; never overwrite an existing record.
    const existing = await store.read(path)
    if (!existing) throw new RequestError(503, 'Feedback was not confirmed saved. Please retry or use email.')
    if (existing.contentHash !== hash) throw new RequestError(409, 'This submission changed. Reload the form and submit again.')
    if (contentHash(existing.feedback) !== hash || !Number.isFinite(Date.parse(existing.createdAt))
      || typeof existing.sender !== 'string') throw new Error('Invalid stored feedback')
    return existing
  }
}

async function notifyFeedback(store, notify, record, now) {
  const id = record.feedback.id
  const path = `feedback-notifications/${id}.json`
  try {
    const existing = await store.read(path)
    if (existing?.contentHash === record.contentHash && existing.accepted === true) return true
    const age = now() - Date.parse(record.createdAt)
    if (age < 0 || age >= NOTIFICATION_RETRY_MS) return false
    const receipt = await notify(notificationPayload(record), `primes-feedback/${id}`)
    try {
      await store.create(path, { accepted: true, contentHash: record.contentHash, providerId: receipt.id })
    } catch {
      // Feedback remains saved. A retry within 23h uses Resend's same key and
      // same stored payload; an older retry will not send another notification.
    }
    return true
  } catch { return false }
}

function respond(res, status, value) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(JSON.stringify(value))
}

export function createFeedbackHandler({ env = process.env, store, notify, now = Date.now, rateLimit } = {}) {
  const allowRequest = rateLimit || createRateLimiter({ now })
  return async function feedbackHandler(req, res) {
    if (req.method === 'GET') return respond(res, 200, { enabled: Boolean(configured(env)) })
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return respond(res, 405, { ok: false, error: 'Method not allowed.' })
    }
    try {
      if (!allowedOrigins(env).has(header(req, 'origin')) || header(req, 'sec-fetch-site') === 'cross-site') {
        throw new RequestError(403, 'Please submit feedback from this website.')
      }
      if (!allowRequest()) {
        res.setHeader('Retry-After', '60')
        throw new RequestError(429, 'Too many submissions. Please wait a minute or use email.')
      }
      const feedback = validate(await readJson(req))
      if (!configured(env)) throw new RequestError(503, 'Direct submission is unavailable. Please use the email option.')
      const storage = store || createPrivateFeedbackStore(env.BLOB_READ_WRITE_TOKEN)
      const record = await saveFeedback(storage, feedback, env.FEEDBACK_FROM_EMAIL.trim(), now)
      const notificationSent = await notifyFeedback(storage, notify || createResendNotifier(env.RESEND_API_KEY), record, now)
      return respond(res, 200, { ok: true, saved: true, id: feedback.id, notificationSent })
    } catch (error) {
      // Never log visitor contents, IP/UA, secrets, Blob URLs, or provider errors.
      const status = error instanceof RequestError ? error.status : 503
      const message = error instanceof RequestError ? error.message : 'Feedback was not confirmed saved. Please retry or use email.'
      return respond(res, status, { ok: false, error: message })
    }
  }
}
