export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { createFirebaseCustomToken } from '@/lib/firebaseCustomToken'

const ADMIN_UID = 'parcelpoint-admin'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    const submittedUsername = typeof username === 'string' ? username.trim() : ''
    const submittedPassword = typeof password === 'string' ? password : ''

    const adminUsername = process.env.ADMIN_USERNAME?.trim()
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: 'Server configuration error. ADMIN_USERNAME and ADMIN_PASSWORD must be set.' },
        { status: 500 }
      )
    }

    const isValid = submittedUsername === adminUsername && submittedPassword === adminPassword

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
