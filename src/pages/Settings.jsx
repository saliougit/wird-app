import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, exportAllData, importAllData, getSetting, setSetting } from '../db'
import { requestNotificationPermission, getNotificationPermission, scheduleReminder } from '../utils/notifications'
import Layout from '../components/Layout'
import {
  Bell, BellSlash, Export, Upload, Trash, Warning,
  CheckCircle, Info, GearSix, Moon, Sun
} from '@phosphor-icons/react'

export default function Settings() {
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission())
  const [remindersEnabled, setRemindersEnabled] = useState(true)
  const [reminderTime, setReminderTime] = useState('20:00')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    getSetting('remindersEnabled', true).then(setRemindersEnabled)
    getSetting('reminderTime', '20:00').then(setReminderTime)
  }, [])

  const kamilCount = useLiveQuery(() => db.kamils.count(), []) || 0
  const khassidaCount = useLiveQuery(() => db.khassidas.count(), []) || 0
  const readingsCount = useLiveQuery(() => db.readings.count(), []) || 0
  const logsCount = useLiveQuery(() => db.khassidaLogs.count(), []) || 0

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission()
    setNotifPermission(result)
  }

  const handleReminderToggle = async () => {
    const newVal = !remindersEnabled
    setRemindersEnabled(newVal)
    await setSetting('remindersEnabled', newVal)
  }

  const handleTimeChange = async (val) => {
    setReminderTime(val)
    await setSetting('reminderTime', val)
  }

  const handleExport = async () => {
    const data = await exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wird-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    setImportSuccess(false)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAllData(data)
      setImportSuccess(true)
      setTimeout(() => setImportSuccess(false), 3000)
    } catch (err) {
      setImportError('Fichier invalide ou corrompu')
    }
    e.target.value = ''
  }

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 5000)
      return
    }
    await db.kamils.clear()
    await db.readings.clear()
    await db.khassidas.clear()
    await db.khassidaLogs.clear()
    setConfirmClear(false)
  }

  const testNotification = () => {
    if (notifPermission === 'granted') {
      new Notification('Wird — Test', {
        body: 'Vos rappels fonctionnent correctement',
        icon: '/icon-192.svg',
      })
    }
  }

  return (
    <Layout title="Réglages">
      <div className="px-4 py-6 space-y-8 max-w-2xl mx-auto pb-20">

        {/* Notifications Section */}
        <section className="space-y-4">
          <h2 className="section-title flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Bell size={22} className="text-blue-600" weight="fill" />
            </span>
            <span>Notifications</span>
          </h2>

          {/* Permission status card */}
          <div className={`card rounded-2xl p-5 border-2 transition-all ${
            notifPermission === 'granted' ? 'border-green-300 bg-green-50' :
            notifPermission === 'denied' ? 'border-red-300 bg-red-50' :
            'border-gold-light bg-gold-pale'
          }`}>
            <div className="flex items-start gap-4">
              {notifPermission === 'granted' ? (
                <CheckCircle size={24} className="text-green-600 shrink-0 mt-0.5" weight="fill" />
              ) : notifPermission === 'denied' ? (
                <BellSlash size={24} className="text-red-600 shrink-0 mt-0.5" weight="fill" />
              ) : (
                <Bell size={24} className="text-gold-dark shrink-0 mt-0.5" weight="fill" />
              )}
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">
                  {notifPermission === 'granted' ? 'Notifications activées ✓' :
                   notifPermission === 'denied' ? 'Notifications bloquées' :
                   notifPermission === 'unsupported' ? 'Non supporté' :
                   'Notifications désactivées'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {notifPermission === 'granted'
                    ? 'Vous recevrez des rappels quotidiens'
                    : notifPermission === 'denied'
                    ? 'Autoriser dans les paramètres du navigateur'
                    : 'Activez les notifications pour les rappels'}
                </p>
              </div>
              {notifPermission !== 'granted' && notifPermission !== 'denied' && notifPermission !== 'unsupported' && (
                <button onClick={handleRequestPermission} className="btn-primary text-sm px-4 py-2 rounded-lg shrink-0 font-bold">
                  Activer
                </button>
              )}
            </div>
          </div>

          {notifPermission === 'granted' && (
            <div className="space-y-3 mt-4">
              {/* Enable toggle */}
              <div className="card rounded-2xl p-5 flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
                <div>
                  <p className="font-bold text-green-deep">Rappels quotidiens</p>
                  <p className="text-xs text-gray-500 mt-1">Un rappel chaque soir</p>
                </div>
                <button
                  onClick={handleReminderToggle}
                  className={`relative w-14 h-8 rounded-full transition-all ${
                    remindersEnabled ? 'bg-green-mid' : 'bg-gray-300'
                  } shadow-md`}
                  title={remindersEnabled ? 'Désactiver' : 'Activer'}
                >
                  <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg transition-transform ${
                    remindersEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {remindersEnabled && (
                <div className="card rounded-2xl p-5 bg-gradient-to-r from-gold-pale to-white animate-slideUp">
                  <label className="label text-green-deep font-bold mb-3">Heure du rappel</label>
                  <input
                    className="input w-full text-center text-lg font-bold rounded-xl border-2 border-gold-light focus:border-gold-dark"
                    type="time"
                    value={reminderTime}
                    onChange={e => handleTimeChange(e.target.value)}
                  />
                </div>
              )}

              <button
                onClick={testNotification}
                className="btn-secondary w-full text-sm font-bold rounded-xl py-3 transition-all hover:shadow-md"
              >
                🔔 Tester la notification
              </button>

              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" weight="fill" />
                <p>Les notifications fonctionnent quand l'app est ouverte. Idéal sur mobile ou en écran d'accueil.</p>
              </div>
            </div>
          )}
        </section>

        <div className="h-1 bg-gradient-to-r from-transparent via-ivory-darker to-transparent rounded-full" />

        {/* Data Section */}
        <section className="space-y-4">
          <h2 className="section-title flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <GearSix size={22} className="text-purple-600" weight="fill" />
            </span>
            <span>Mes données</span>
          </h2>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card rounded-2xl p-5 text-center bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-lg transition-all">
              <p className="font-display text-4xl font-bold text-green-deep mb-1">{kamilCount}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kamil{kamilCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="card rounded-2xl p-5 text-center bg-gradient-to-br from-gold-pale to-white border border-gold-light hover:shadow-lg transition-all">
              <p className="font-display text-4xl font-bold text-gold-dark mb-1">{khassidaCount}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Wird{khassidaCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="card rounded-2xl p-5 text-center bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-lg transition-all">
              <p className="font-display text-4xl font-bold text-blue-600 mb-1">{readingsCount}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lectures Juzz</p>
            </div>
            <div className="card rounded-2xl p-5 text-center bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-lg transition-all">
              <p className="font-display text-4xl font-bold text-red-500 mb-1">{logsCount}</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Entrées Wird</p>
            </div>
          </div>

          {/* Backup Actions */}
          <div className="space-y-3 mt-6">
            <button
              onClick={handleExport}
              className="btn-secondary w-full flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-sm hover:shadow-md transition-all"
            >
              <Export size={20} weight="bold" />
              Exporter les données
            </button>

            {/* Import */}
            <div>
              <label className="btn-secondary w-full flex items-center justify-center gap-2 cursor-pointer rounded-xl py-3 font-bold text-sm hover:shadow-md transition-all">
                <Upload size={20} weight="bold" />
                Importer une sauvegarde
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
              {importError && (
                <p className="text-sm text-red-600 font-semibold mt-3 text-center bg-red-50 p-3 rounded-xl">❌ {importError}</p>
              )}
              {importSuccess && (
                <p className="text-sm text-green-600 font-semibold mt-3 text-center bg-green-50 p-3 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle size={16} weight="fill" /> Import réussi
                </p>
              )}
            </div>

            {/* Clear all */}
            <button
              onClick={handleClearAll}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                confirmClear
                  ? 'bg-red-600 text-white border-red-700 shadow-lg'
                  : 'bg-red-50 text-red-600 border-red-200 hover:border-red-400'
              }`}
            >
              <Trash size={18} weight={confirmClear ? 'fill' : 'bold'} />
              {confirmClear ? 'Confirmer suppression ?' : 'Tout effacer'}
            </button>
            {confirmClear && (
              <p className="text-xs text-red-600 font-semibold text-center bg-red-100 p-3 rounded-lg">
                ⚠️ Deuxième clic pour confirmer — irréversible
              </p>
            )}
          </div>
        </section>

        <div className="h-1 bg-gradient-to-r from-transparent via-ivory-darker to-transparent rounded-full" />

        {/* About Section */}
        <section className="text-center py-6 px-4 rounded-2xl bg-gradient-to-br from-green-50 to-gold-pale border border-gold-light">
          <div className="font-display text-2xl font-bold text-green-deep mb-1">📖 Wird</div>
          <p className="text-sm text-gray-600 mb-2">Suivi de lecture du Coran & Wirds</p>
          <p className="text-xs text-gray-500">v1.0 • Données stockées localement • Privacy-first ✓</p>
        </section>

      </div>
    </Layout>
  )
}
