// Oddiy, tashqi kutubxonasiz IndexedDB wrapper.
// Ombor nomlari: products, customers, pendingOrders

const DB_NAME = 'shopflow-offline'
const DB_VERSION = 2

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('debts')) {
        db.createObjectStore('debts', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('pendingOrders')) {
        db.createObjectStore('pendingOrders', { keyPath: 'localId' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

async function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = fn(store)

    transaction.oncomplete = () => resolve((request as IDBRequest<T>)?.result as T)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export const offlineDb = {
  async putAll(storeName: 'products' | 'customers' | 'debts', items: any[]) {
    const db = await openDb()
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      store.clear()
      for (const item of items) store.put(item)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  },

  async getAll<T = any>(storeName: 'products' | 'customers' | 'debts'): Promise<T[]> {
    return tx(storeName, 'readonly', store => store.getAll())
  },

  async put(storeName: 'products' | 'customers' | 'debts', item: any) {
    return tx(storeName, 'readwrite', store => store.put(item))
  },

  async queueOrder(order: any) {
    return tx('pendingOrders', 'readwrite', store => store.put(order))
  },

  async listPendingOrders(): Promise<any[]> {
    return tx('pendingOrders', 'readonly', store => store.getAll())
  },

  async removePendingOrder(localId: string) {
    return tx('pendingOrders', 'readwrite', store => store.delete(localId))
  },

  async updatePendingOrder(order: any) {
    return tx('pendingOrders', 'readwrite', store => store.put(order))
  },
}
