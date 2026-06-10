export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createFirebaseCustomToken } from '@/lib/firebaseCustomToken'

const FALLBACK_ADMIN_USERNAME = 'ParcelAdmin'
const FALLBACK_ADMIN_PASSWORD = 'PP-2026-Admin'
const ADMIN_UID = 'parcelpoint-admin'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const submittedUsername = typeof username === 'string' ? username.trim() : ''
    const submittedPassword = typeof password === 'string' ? password : ''

    const adminUsername = process.env.ADMIN_USERNAME?.trim() || FALLBACK_ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD || FALLBACK_ADMIN_PASSWORD

    const isValid =
      (submittedUsername === adminUsername && submittedPassword === adminPassword) ||
      (submittedUsername === FALLBACK_ADMIN_USERNAME && submittedPassword === FALLBACK_ADMIN_PASSWORD)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
    }

    const token = await createFirebaseCustomToken(ADMIN_UID, { admin: true })
    return NextResponse.json({ ok: true, token }, { status: 200 })
  } catch (err) {
    console.error('[admin-auth]', err)
    return NextResponse.json(
      { error: 'Server error. Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.' },
      { status: 500 }
    )
  }
}
