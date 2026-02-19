import { getSetting, setSetting } from '../db'

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export function showNotification(title, body, icon = '/icon-192.svg') {
  if (Notification.permission !== 'granted') return
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      title,
      body,
      icon,
    })
  } else {
    new Notification(title, { body, icon })
  }
}

// Planifie des rappels locaux via setTimeout (fonctionne si l'app est ouverte)
// Pour chaque rappel: { id, title, body, time (HH:MM), days (array 0-6 ou []) }
let scheduledTimers = []

export function clearAllTimers() {
  scheduledTimers.forEach(t => clearTimeout(t))
  scheduledTimers = []
}

export function scheduleReminder(title, body, timeStr) {
  if (Notification.permission !== 'granted') return
  const [h, m] = timeStr.split(':').map(Number)
  const now = new Date()
  const target = new Date()
  target.setHours(h, m, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  const delay = target.getTime() - now.getTime()
  const timer = setTimeout(() => {
    showNotification(title, body)
    // Re-schedule for next day
    scheduleReminder(title, body, timeStr)
  }, delay)
  scheduledTimers.push(timer)
}

export async function initReminders(kamils = [], khassidas = []) {
  clearAllTimers()
  const reminderTime = await getSetting('reminderTime', '20:00')
  const remindersEnabled = await getSetting('remindersEnabled', true)
  if (!remindersEnabled) return

  // Compte les tâches actives
  const today = new Date().toISOString().split('T')[0]
  const activeKamils = kamils.filter(k => !k.endDate || k.endDate >= today)
  const activeKhassidas = khassidas.filter(k => {
    if (!k.deadline) return k.recurrence !== 'none'
    return k.deadline >= today
  })

  const total = activeKamils.length + activeKhassidas.length
  if (total === 0) return

  scheduleReminder(
    'Wird — Rappel de lecture',
    `Vous avez ${total} lecture${total > 1 ? 's' : ''} en attente aujourd'hui`,
    reminderTime
  )
}
