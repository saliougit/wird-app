import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, logDailyKamilReading, getDailyKamilLogs, deleteDailyKamil, updateDailyKamil } from '../db'
import { formatDate } from '../utils/dates'
import Layout from '../components/Layout'
import ProgressRing from '../components/ProgressRing'
import { Plus, Trash, CheckCircle, PencilSimple, X, CalendarBlank } from '@phosphor-icons/react'

export default function KamilDailyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dailyKamilId = parseInt(id)

  const [selectedJuzz, setSelectedJuzz] = useState(null)
  const [notes, setNotes] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Edit period state
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editDefaultJuzz, setEditDefaultJuzz] = useState('1')
  const [editSaving, setEditSaving] = useState(false)

  const kamila = useLiveQuery(() => db.dailyKamils.get(dailyKamilId), [dailyKamilId])
  const logs = useLiveQuery(() => getDailyKamilLogs(dailyKamilId), [dailyKamilId]) || []

  useEffect(() => {
    if (kamila) {
      if (selectedJuzz === null) setSelectedJuzz(kamila.defaultJuzz)
      setEditName(kamila.name)
      setEditStart(kamila.startDate)
      setEditEnd(kamila.endDate)
      setEditDefaultJuzz(String(kamila.defaultJuzz))
    }
  }, [kamila])

  // Quand on change de date de log, on pré-remplit avec le juzz déjà enregistré ce jour ou le juzz par défaut
  useEffect(() => {
    if (!kamila) return
    const existing = logs.find(l => l.date === logDate)
    setSelectedJuzz(existing ? existing.juzz : kamila.defaultJuzz)
    setNotes(existing ? (existing.notes || '') : '')
  }, [logDate, kamila])

  if (!kamila) {
    return (
      <Layout title="Kamil Quotidien" back>
        <div className="p-4 text-center text-gray-400 py-16">Chargement...</div>
      </Layout>
    )
  }

  const today = new Date().toISOString().split('T')[0]
  const selectedDayLog = logs.find(l => l.date === logDate)
  const isToday = logDate === today

  const handleLog = async () => {
    if (!selectedJuzz) return
    setSaving(true)
    try {
      await logDailyKamilReading(dailyKamilId, selectedJuzz, notes, logDate)
      setNotes('')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000)
      return
    }
    await deleteDailyKamil(dailyKamilId)
    navigate('/kamils', { replace: true })
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editStart || !editEnd) return
    if (new Date(editEnd) < new Date(editStart)) return
    setEditSaving(true)
    try {
      await updateDailyKamil(dailyKamilId, {
        name: editName.trim(),
        startDate: editStart,
        endDate: editEnd,
        defaultJuzz: parseInt(editDefaultJuzz),
      })
      setShowEdit(false)
    } finally {
      setEditSaving(false)
    }
  }

  const daysInPeriod = Math.ceil((new Date(kamila.endDate) - new Date(kamila.startDate)) / (1000 * 60 * 60 * 24)) + 1
  const daysLogged = logs.length
  const pct = daysInPeriod > 0 ? Math.round((daysLogged / daysInPeriod) * 100) : 0

  return (
    <Layout title={kamila.name} back actions={
      <div className="flex gap-2">
        <button
          onClick={() => setShowEdit(v => !v)}
          className="btn-icon text-gold hover:bg-gold/10 w-10 h-10"
          title="Modifier la période"
        >
          <PencilSimple size={20} weight="bold" />
        </button>
        <button
          onClick={handleDelete}
          className={`btn-icon w-10 h-10 transition-colors ${showDeleteConfirm ? 'text-white bg-red-600 hover:bg-red-700' : 'text-red-400 hover:bg-red-50'}`}
          title={showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer'}
        >
          <Trash size={20} weight="bold" />
        </button>
      </div>
    }>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">

        {/* Edit Period Form */}
        {showEdit && (
          <div className="card rounded-2xl p-5 border-2 border-gold bg-gradient-to-br from-gold-pale to-white animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gold-dark text-sm uppercase tracking-wider">Modifier la période</p>
              <button onClick={() => setShowEdit(false)} className="btn-icon text-gray-400 hover:text-gray-600 w-8 h-8">
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label text-green-deep font-bold mb-1">Nom</label>
                <input
                  className="input w-full rounded-xl border-2 border-gold-light"
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-green-deep font-bold mb-1">Début</label>
                  <input
                    className="input w-full rounded-xl border-2 border-green-200"
                    type="date"
                    value={editStart}
                    onChange={e => setEditStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label text-red-600 font-bold mb-1">Fin</label>
                  <input
                    className="input w-full rounded-xl border-2 border-red-200"
                    type="date"
                    value={editEnd}
                    onChange={e => setEditEnd(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="label text-blue-700 font-bold mb-1">Juzz par défaut</label>
                <select
                  className="input w-full rounded-xl border-2 border-blue-200"
                  value={editDefaultJuzz}
                  onChange={e => setEditDefaultJuzz(e.target.value)}
                >
                  {Array.from({ length: 30 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Juzz {i + 1}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving}
                className="btn-primary w-full rounded-xl py-2.5 font-bold text-sm"
              >
                {editSaving ? 'Enregistrement...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        )}

        {/* Header Card */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-green-deep to-green-mid text-ivory">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80 font-body">Période</p>
              <p className="font-display text-lg font-bold">{formatDate(kamila.startDate)} → {formatDate(kamila.endDate)}</p>
              <p className="text-xs opacity-70 mt-1">Juzz par défaut : <strong>Juzz {kamila.defaultJuzz}</strong></p>
            </div>
            <ProgressRing percent={pct} size={80} stroke={6} color="#C49A28" bg="rgba(255,255,255,0.2)">
              <span className="text-sm font-bold text-ivory">{pct}%</span>
            </ProgressRing>
          </div>
          <p className="text-sm text-ivory/90">{daysLogged} jour{daysLogged !== 1 ? 's' : ''} enregistré{daysLogged !== 1 ? 's' : ''} / {daysInPeriod}</p>
        </div>

        {/* Reading card — any day */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-gold-pale to-white border-2 border-gold-light">
          {/* Date selector */}
          <div className="flex items-center gap-3 mb-4">
            <CalendarBlank size={18} className="text-gold-dark shrink-0" weight="fill" />
            <div className="flex-1">
              <label className="label text-xs text-gold-dark font-bold uppercase tracking-wider mb-1">
                {isToday ? "Aujourd'hui" : formatDate(logDate)}
              </label>
              <input
                className="input w-full rounded-lg border-2 border-gold-light text-sm"
                type="date"
                value={logDate}
                min={kamila.startDate}
                max={today}
                onChange={e => setLogDate(e.target.value)}
              />
            </div>
          </div>

          {selectedDayLog && (
            <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3">
              <CheckCircle size={20} className="text-green-mid shrink-0" weight="fill" />
              <p className="text-sm text-green-deep font-semibold">
                Juzz {selectedDayLog.juzz} déjà enregistré — tu peux modifier ci-dessous
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label text-green-deep font-bold">Quel Juzz as-tu lu ?</label>
                {selectedJuzz && (
                  <span className="badge bg-gold/20 text-gold-dark font-bold px-3 py-1 rounded-full text-xs">
                    Juzz {selectedJuzz}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 30 }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSelectedJuzz(n)}
                    className={`text-sm font-bold rounded-lg border-2 transition-all h-11 flex items-center justify-center ${
                      selectedJuzz === n
                        ? 'bg-gold text-green-deep border-gold-dark shadow-md scale-105'
                        : 'border-gold-light bg-white text-gold-dark hover:border-gold'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label text-green-deep font-bold mb-3">Notes (optionnel)</label>
              <input
                className="input w-full rounded-xl border-2 border-gold-light"
                type="text"
                placeholder="ex: avant Fajr, avec le groupe..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button
              onClick={handleLog}
              disabled={saving || !selectedJuzz}
              className="btn-primary w-full rounded-xl py-3 font-bold flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              {saving ? 'Enregistrement...' : selectedDayLog ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* History */}
        {logs.length > 0 && (
          <div className="space-y-3">
            <p className="font-display text-lg text-green-deep font-bold">
              Historique
              <span className="text-sm font-body font-normal text-gray-400 ml-2 bg-ivory rounded-full px-3 py-1">({logs.length})</span>
            </p>
            <div className="space-y-2">
              {[...logs].sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                <div
                  key={log.id}
                  onClick={() => setLogDate(log.date)}
                  className={`card rounded-2xl p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.98] ${log.date === logDate ? 'border-2 border-gold bg-gold-pale/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-display text-2xl font-bold text-green-deep">Juzz {log.juzz}</p>
                      <p className="text-sm text-gray-600 mt-1">{formatDate(log.date)}{log.date === today ? ' — Aujourd\'hui' : ''}</p>
                      {log.notes && <p className="text-xs text-gray-500 mt-2 italic">"{log.notes}"</p>}
                    </div>
                    <CheckCircle size={24} className="text-green-mid mt-1 shrink-0" weight="fill" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
