import Dexie from 'dexie'

export const db = new Dexie('WirdDB')

db.version(1).stores({
  // Kamils: personnels et collectifs
  kamils: '++id, type, startDate, endDate, name, createdAt',
  // Lectures de juzz liées à un kamil
  readings: '++id, kamilId, juzzNumber, readDate',
  // Khassidas, Wirds, Duaas libres
  khassidas: '++id, category, name, deadline, recurrence, createdAt',
  // Logs de lectures pour les khassidas
  khassidaLogs: '++id, khassidaId, readDate',
  // Paramètres globaux (clé/valeur)
  settings: 'key',
})

// Version 2: Add daily kamils and khassida batches
db.version(2).stores({
  kamils: '++id, type, startDate, endDate, name, createdAt',
  readings: '++id, kamilId, juzzNumber, readDate',
  khassidas: '++id, category, name, deadline, recurrence, createdAt',
  khassidaLogs: '++id, khassidaId, readDate',
  settings: 'key',
  // Kamils avec suivi quotidien (chaque jour un juzz)
  dailyKamils: '++id, startDate, endDate, name, createdAt',
  // Logs quotidiens pour dailyKamils
  dailyKamilLogs: '++id, dailyKamilId, date',
  // Listes de Khassidas pour une période
  khassidaBatches: '++id, periodName, startDate, endDate, createdAt',
})

// --- Helpers Kamil Daily ---

export async function createDailyKamil(data) {
  return db.dailyKamils.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateDailyKamil(id, data) {
  return db.dailyKamils.update(id, data)
}

export async function deleteDailyKamil(id) {
  await db.dailyKamilLogs.where('dailyKamilId').equals(id).delete()
  return db.dailyKamils.delete(id)
}

export async function logDailyKamilReading(dailyKamilId, juzz, notes = '', date = null) {
  const logDate = date || new Date().toISOString().split('T')[0]
  // Vérifier si existe déjà pour ce jour
  const existing = await db.dailyKamilLogs
    .where('dailyKamilId').equals(dailyKamilId)
    .filter(l => l.date === logDate)
    .first()

  if (existing) {
    return db.dailyKamilLogs.update(existing.id, { juzz, notes, loggedAt: new Date().toISOString() })
  } else {
    return db.dailyKamilLogs.add({ dailyKamilId, date: logDate, juzz, notes, loggedAt: new Date().toISOString() })
  }
}

export async function getDailyKamilLogs(dailyKamilId) {
  return db.dailyKamilLogs.where('dailyKamilId').equals(dailyKamilId).toArray()
}

// --- Helpers Khassida Batch ---

export async function createKhassidaBatch(data) {
  return db.khassidaBatches.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateKhassidaBatch(id, data) {
  return db.khassidaBatches.update(id, data)
}

export async function deleteKhassidaBatch(id) {
  return db.khassidaBatches.delete(id)
}

// --- Helpers Kamil ---

export async function createKamil(data) {
  return db.kamils.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateKamil(id, data) {
  return db.kamils.update(id, data)
}

export async function deleteKamil(id) {
  await db.readings.where('kamilId').equals(id).delete()
  return db.kamils.delete(id)
}

export async function getKamilWithReadings(id) {
  const kamil = await db.kamils.get(id)
  if (!kamil) return null
  const readings = await db.readings.where('kamilId').equals(id).toArray()
  return { ...kamil, readings }
}

// Ajouter ou retirer une lecture de juzz
export async function toggleJuzzReading(kamilId, juzzNumber) {
  const today = new Date().toISOString().split('T')[0]
  // Check if already read today
  const existing = await db.readings
    .where('kamilId').equals(kamilId)
    .filter(r => r.juzzNumber === juzzNumber && r.readDate === today)
    .first()
  
  if (existing) {
    await db.readings.delete(existing.id)
    return false // removed
  } else {
    await db.readings.add({ kamilId, juzzNumber, readDate: today })
    return true // added
  }
}

// Obtenir les juzz lus pour un kamil (déduplication: un juzz peut être lu plusieurs fois)
export async function getReadJuzz(kamilId) {
  const readings = await db.readings.where('kamilId').equals(kamilId).toArray()
  // Return unique juzz numbers that have been read
  return [...new Set(readings.map(r => r.juzzNumber))]
}

// --- Helpers Khassida ---

export async function createKhassida(data) {
  return db.khassidas.add({ ...data, createdAt: new Date().toISOString() })
}

export async function updateKhassida(id, data) {
  return db.khassidas.update(id, data)
}

export async function deleteKhassida(id) {
  await db.khassidaLogs.where('khassidaId').equals(id).delete()
  return db.khassidas.delete(id)
}

export async function logKhassidaReading(khassidaId, partsRead, notes = '') {
  const readDate = new Date().toISOString().split('T')[0]
  return db.khassidaLogs.add({ khassidaId, partsRead: Number(partsRead), readDate, notes, loggedAt: new Date().toISOString() })
}

export async function getKhassidaProgress(khassidaId) {
  const logs = await db.khassidaLogs.where('khassidaId').equals(khassidaId).toArray()
  const totalRead = logs.reduce((sum, l) => sum + (l.partsRead || 0), 0)
  return { totalRead, logs }
}

// --- Settings ---

export async function getSetting(key, defaultValue = null) {
  const row = await db.settings.get(key)
  return row ? row.value : defaultValue
}

export async function setSetting(key, value) {
  return db.settings.put({ key, value })
}

// --- Export / Import ---

export async function exportAllData() {
  const [kamils, readings, khassidas, khassidaLogs, settings] = await Promise.all([
    db.kamils.toArray(),
    db.readings.toArray(),
    db.khassidas.toArray(),
    db.khassidaLogs.toArray(),
    db.settings.toArray(),
  ])
  return { kamils, readings, khassidas, khassidaLogs, settings, exportedAt: new Date().toISOString(), version: 1 }
}

export async function importAllData(data) {
  if (!data || data.version !== 1) throw new Error('Format invalide')
  await db.transaction('rw', db.kamils, db.readings, db.khassidas, db.khassidaLogs, db.settings, async () => {
    await db.kamils.clear()
    await db.readings.clear()
    await db.khassidas.clear()
    await db.khassidaLogs.clear()
    await db.settings.clear()
    if (data.kamils?.length) await db.kamils.bulkAdd(data.kamils)
    if (data.readings?.length) await db.readings.bulkAdd(data.readings)
    if (data.khassidas?.length) await db.khassidas.bulkAdd(data.khassidas)
    if (data.khassidaLogs?.length) await db.khassidaLogs.bulkAdd(data.khassidaLogs)
    if (data.settings?.length) await db.settings.bulkAdd(data.settings)
  })
}
