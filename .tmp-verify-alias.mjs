// Temporary verification — simulates a stale tracking-number alias doc.
// Usage: node .tmp-verify-alias.mjs create|delete
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { getAuth, signInWithCustomToken } from 'firebase/auth'

const PRIMARY_ID = 'PP-AWB-TEST-9999'
const ALIAS_ID = 'PP-TRK-TEST-9999'
const mode = process.argv[2]

const env = {}
for (const line of readFileSync('.env.local', 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
})
const db = getFirestore(app)

const authRes = await fetch('http://localhost:3000/api/admin-auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }),
})
if (!authRes.ok) { console.error('admin-auth failed:', authRes.status); process.exit(1) }
const { token } = await authRes.json()
await signInWithCustomToken(getAuth(app), token)
console.log('signed in as admin')

if (mode === 'create') {
  const h = 60 * 60 * 1000
  const now = Date.now()
  const base = {
    waybillNumber: PRIMARY_ID,
    trackingNumber: ALIAS_ID,
    transportMode: 'AIR',
    origin: 'Singapore/SIN',
    destination: 'London/LHR',
    senderName: 'Test Shipper Ltd',
    receiverName: 'Test Consignee Ltd',
    totalWeight: 12.5,
    estimatedDeliveryDate: new Date(now + 48 * h).toISOString(),
    bookingDate: new Date(now - 48 * h).toISOString(),
    createdAt: new Date(now - 48 * h).toISOString(),
  }
  // PRIMARY: updated by admin timeline — Departed Origin Airport
  await setDoc(doc(db, 'waybills', PRIMARY_ID), {
    ...base,
    currentStatus: 'Departed Origin Airport',
    currentLocation: 'Singapore Changi, SG',
    updatedAt: new Date(now - 6 * h).toISOString(),
    trackingEvents: [
      { status: 'Shipment Created', location: 'Singapore/SIN', eventTime: new Date(now - 48 * h).toISOString(), isHold: false },
      { status: 'Departed Origin Airport', location: 'Singapore Changi, SG', eventTime: new Date(now - 6 * h).toISOString(), isHold: false },
      { status: 'Arrived at Destination Hub', location: 'London Heathrow, UK', eventTime: new Date(now + 24 * h).toISOString(), isHold: false },
    ],
  })
  // ALIAS: stale day-one snapshot (pre-fix behaviour of updateWaybillTimeline)
  await setDoc(doc(db, 'waybills', ALIAS_ID), {
    ...base,
    currentStatus: 'Shipment Created',
    currentLocation: 'Singapore/SIN',
    updatedAt: new Date(now - 48 * h).toISOString(),
    trackingEvents: [
      { status: 'Shipment Created', location: 'Singapore/SIN', eventTime: new Date(now - 48 * h).toISOString(), isHold: false },
    ],
  })
  console.log('created primary', PRIMARY_ID, 'and STALE alias', ALIAS_ID)
} else if (mode === 'delete') {
  await deleteDoc(doc(db, 'waybills', PRIMARY_ID))
  await deleteDoc(doc(db, 'waybills', ALIAS_ID))
  console.log('deleted both test docs')
} else {
  console.error('usage: node .tmp-verify-alias.mjs create|delete')
  process.exit(1)
}
process.exit(0)
