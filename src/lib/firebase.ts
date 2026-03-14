import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Reemplazar \n literales si vienen escapados en la variable de entorno
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Firebase admin initialization error', err?.stack ?? err);
  }
}

/** Firestore: puede ser null si la inicialización falló. Las Server Actions lo manejan con try/catch. */
export const db = admin.apps.length ? admin.firestore() : (null as unknown as admin.firestore.Firestore);

/** Auth: puede ser null si la inicialización falló. getUserId() debe verificar antes de usar. */
export const auth: admin.auth.Auth | null = admin.apps.length ? admin.auth() : null;
