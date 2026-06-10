import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

function createAdminApp() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.')
  }
  return initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
}

const adminApp = getApps().length ? getApps()[0] : createAdminApp()

export const adminAuth = getAuth(adminApp)
