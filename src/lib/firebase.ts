// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
} as const;

const missingFirebaseEnvKeys = Object.entries(firebaseEnv)
  .filter(([, value]) => value.trim() === "")
  .map(([key]) => key);

const firebaseConfig = {
  apiKey: firebaseEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: firebaseEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (missingFirebaseEnvKeys.length > 0) {
  console.error(
    `[firebase] Missing environment configuration keys: ${missingFirebaseEnvKeys.join(", ")}`
  );
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export const firebaseConfigState = {
  isConfigured: missingFirebaseEnvKeys.length === 0,
  missingKeys: missingFirebaseEnvKeys,
} as const;
