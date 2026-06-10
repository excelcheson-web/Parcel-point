// Creates a Firebase custom token using Web Crypto API — works in Edge/Cloudflare Workers.
// Requires FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars.

const FIREBASE_AUD =
  'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit'

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function b64urlStr(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function importPem(pem: string): Promise<CryptoKey> {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const der = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

export async function createFirebaseCustomToken(
  uid: string,
  claims: Record<string, unknown>
): Promise<string> {
  const email = process.env.FIREBASE_CLIENT_EMAIL
  const rawKey = process.env.FIREBASE_PRIVATE_KEY
  if (!email || !rawKey) {
    throw new Error('FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be set.')
  }

  const pem = rawKey.replace(/\\n/g, '\n')
  const now = Math.floor(Date.now() / 1000)

  const header = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64urlStr(
    JSON.stringify({
      iss: email,
      sub: email,
      aud: FIREBASE_AUD,
      iat: now,
      exp: now + 3600,
      uid,
      claims,
    })
  )

  const key = await importPem(pem)
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(`${header}.${payload}`)
  )

  return `${header}.${payload}.${b64url(sig)}`
}
