const firebaseConfig = {
  apiKey: 'AIzaSyACaAIt_pq-74MEB7cZxVUXquAy_cEMZOU',
  authDomain: 'ghousia-78c14.firebaseapp.com',
  projectId: 'ghousia-78c14',
  storageBucket: 'ghousia-78c14.firebasestorage.app',
  messagingSenderId: '577501946021',
  appId: '1:577501946021:web:55930ef15d9d3698092d4c',
  measurementId: 'G-6TY023FV0L'
};

let firebaseCache = null;
let firebaseInitPromise = null;

async function ensureFirebase() {
  if (firebaseCache) {
    return firebaseCache;
  }
  if (firebaseInitPromise) {
    return firebaseInitPromise;
  }

  firebaseInitPromise = (async () => {
    const [{ initializeApp }, firestore] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore')
    ]);

    const app = initializeApp(firebaseConfig);
    let db;

    if (typeof firestore.initializeFirestore === 'function' &&
        typeof firestore.persistentLocalCache === 'function' &&
        typeof firestore.persistentMultipleTabManager === 'function') {
      try {
        db = firestore.initializeFirestore(app, {
          localCache: firestore.persistentLocalCache({
            tabManager: firestore.persistentMultipleTabManager(),
          }),
        });
      } catch (error) {
        console.warn('Could not initialize Firestore local cache, falling back to standard Firestore.', error);
      }
    }

    if (!db) {
      db = firestore.getFirestore(app);
      if (typeof firestore.enableIndexedDbPersistence === 'function') {
        try {
          await firestore.enableIndexedDbPersistence(db);
        } catch (error) {
          console.warn('Firestore persistence could not be enabled.', error);
        }
      }
    }

    firebaseCache = { app, db, ...firestore };
    return firebaseCache;
  })();

  return firebaseInitPromise;
}

export async function getDb() {
  return (await ensureFirebase()).db;
}

export async function getFirestoreHelpers() {
  return ensureFirebase();
}
