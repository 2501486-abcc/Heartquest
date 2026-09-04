import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const requiredEnvironmentVariable = (name: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`${name} is not configured. Copy .env.example to .env and set the Firebase web app values.`)
  }
  return value
}

const firebaseConfig = {
  apiKey: requiredEnvironmentVariable('VITE_FIREBASE_API_KEY', import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: requiredEnvironmentVariable(
    'VITE_FIREBASE_AUTH_DOMAIN',
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  ),
  projectId: requiredEnvironmentVariable(
    'VITE_FIREBASE_PROJECT_ID',
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
  ),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnvironmentVariable('VITE_FIREBASE_APP_ID', import.meta.env.VITE_FIREBASE_APP_ID),
}

const firebaseApp = initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
