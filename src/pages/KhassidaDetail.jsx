import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, logKhassidaReading } from '../db'
import { today, formatDate, isOverdue, daysUntil, daysOverdue } from '../utils/dates'
import Layout from '../components/Layout'
import ProgressRing from '../components/ProgressRing'
import Modal from '../components/Modal'
import { Plus, Star, Warning, CheckCircle, Clock, Repeat, CalendarBlank, Trash } from '@phosphor-icons/react'

const CATEGORY_LABELS = {
  khassida: 'Khassida',
  wird: 'Wird',
  duaa: 'Duaa',
  autre: 'Autre',
}

const RECURRENCE_LABELS = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
}

export default function KhassidaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = parseInt(id)

  const [showLogModal, setShowLogModal] = useState(false)
  const [partsRead, setPartsRead] = useState('1')
  const [logNotes, setLogNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const item = useLiveQuery(() => db.khassidas.get(itemId), [itemId])
  const logs = useLiveQuery(
    () => db.khassidaLogs.where('khassidaId').equals(itemId).reverse().toArray(),
    [itemId]
  ) || []

  if (!item) {
    return (
      <Layout title="Wird" back>
        <div className="p-4 text-center text-gray-400 py-16">Chargement...</div>
      </Layout>
    )
  }

  const totalRead = logs.reduce((s, l) => s + (l.partsRead || 0), 0)
  const pct = item.targetTotal ? Math.min(Math.round((totalRead / item.targetTotal) * 100), 100) : null
  const done = item.targetTotal ? totalRead >= item.targetTotal : false
  const overdue = !done && item.deadline && isOverdue(item.deadline)
  const daysLeft = item.deadline && !overdue ? daysUntil(item.deadline) : null
  const over = overdue ? daysOverdue(item.deadline) : 0
  const remaining = item.targetTotal ? Math.max(item.targetTotal - totalRead, 0) : null

  const handleLog = async () => {
    const parts = parseInt(partsRead)
    if (!parts || parts < 1) return
    
    // Validation: ne pas dépasser targetTotal
    if (item.targetTotal && totalRead + parts > item.targetTotal) {
      alert(`❌ Limite dépassée!\n\nDéjà lu: ${totalRead}\nVous voulez ajouter: +${parts}\nLimite: ${item.targetTotal}\n\nMax possible: ${item.targetTotal - totalRead}`)
      return
    }
    
    setSaving(true)
    try {
      await logKhassidaReading(itemId, parts, logNotes)
      setShowLogModal(false)
      setPartsRead('1')
      setLogNotes('')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLog = async (logId) => {
    if (confirm('Supprimer cette entrée ?')) {
      await db.khassidaLogs.delete(logId)
    }
  }

  // Group logs by date
  const byDate = logs.reduce((acc, l) => {
    const date = l.readDate || today()
    if (!acc[date]) acc[date] = []
    acc[date].push(l)
    return acc
  }, {})

  return (
    <Layout title={item.name} back>
      <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto pb-20">

        {/* Alert banners */}
        {overdue && !done && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl text-sm font-medium animate-slideUp">
            <Warning size={20} weight="fill" className="text-red-500 shrink-0" />
            <span>Délai dépassé de <strong>{over} jour{over > 1 ? 's' : ''}</strong></span>
          </div>
        )}
        {done && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl text-sm font-medium animate-slideUp">
            <CheckCircle size={20} weight="fill" className="text-green-600 shrink-0" />
            <span>Objectif atteint — <strong>Alhamdulillah !</strong></span>
          </div>
        )}

        {/* Main Progress Card */}
        <div className="card rounded-2xl p-6 bg-gradient-to-br from-ivory to-white">
          <div className="flex items-center justify-center mb-6">
            {pct !== null ? (
              <ProgressRing
                percent={pct}
                size={84}
                stroke={7}
                color={done ? '#2D5A3D' : overdue ? '#dc2626' : '#C49A28'}
                bg="#DDD0B0"
              >
                <span className="text-xl font-bold text-green-deep">{pct}%</span>
              </ProgressRing>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-pale to-gold-light flex items-center justify-center shadow-md">
                <Star size={32} weight="fill" className="text-gold-dark" />
              </div>
            )}
          </div>

          <div className="text-center mb-4">
            <p className="font-display text-3xl font-bold text-green-deep mb-1">
              {totalRead}
              {item.targetTotal && (
                <span className="text-gray-400 text-lg font-normal"> / {item.targetTotal}</span>
              )}
            </p>
            <p className="text-sm text-gray-600">
              partie{totalRead !== 1 ? 's' : ''} lue{totalRead !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-ivory-darker">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Catégorie</p>
              <p className="text-sm font-bold text-green-deep">{CATEGORY_LABELS[item.category] || item.category}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Récurrence</p>
              <p className="text-sm font-bold text-gold-dark">{RECURRENCE_LABELS[item.recurrence] || '—'}</p>
            </div>
            {remaining !== null && remaining > 0 && (
              <>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Restant</p>
                  <p className="text-sm font-bold text-gold-dark">{remaining} partie{remaining !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Complétés</p>
                  <p className="text-sm font-bold text-green-mid">{Math.round((totalRead / item.targetTotal) * 100)}%</p>
                </div>
              </>
            )}
            {item.deadline && (
              <div className="text-center col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Échéance</p>
                <div className="flex items-center justify-center gap-2">
                  <CalendarBlank size={14} className="text-gold-dark" />
                  <p className="text-sm font-bold text-gray-600">{formatDate(item.deadline)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {pct !== null && (
            <div className="mt-5 progress-track rounded-full overflow-hidden h-3 bg-ivory-darker">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: done ? '#2D5A3D' : overdue ? '#dc2626' : '#C49A28'
                }}
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="btn-icon bg-gold-dark text-white hover:brightness-90 w-12 h-12 shadow-lg"
            disabled={done}
            title="Ajouter une lecture"
          >
            <Plus size={28} weight="bold" />
          </button>
        </div>

        {/* Notes */}
        {item.notes && (
          <div className="card rounded-2xl p-5 bg-blue-50 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm">📝</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Notes</p>
                <p className="text-sm text-gray-700 leading-relaxed">{item.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        <div>
          <h2 className="section-title mb-4">
            Historique de lecture
            <span className="text-sm font-body font-normal text-gray-400 ml-2 bg-ivory rounded-full px-3 py-1">({logs.length})</span>
          </h2>

          {logs.length === 0 && (
            <div className="card rounded-2xl p-8 text-center bg-ivory-darker">
              <p className="text-sm text-gray-500">Aucune lecture enregistrée</p>
            </div>
          )}

          <div className="space-y-3">
            {Object.entries(byDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, dayLogs]) => {
                const dayTotal = dayLogs.reduce((s, l) => s + (l.partsRead || 0), 0)
                return (
                  <div key={date} className="card rounded-2xl p-4 bg-gradient-to-r from-green-50 to-white border border-green-100">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-green-100">
                      <p className="text-sm font-bold text-green-deep flex items-center gap-2">
                        <CalendarBlank size={16} className="text-gold-dark" />
                        {formatDate(date)}
                      </p>
                      <span className="badge badge-green font-bold">{dayTotal}</span>
                    </div>
                    <div className="space-y-2">
                      {dayLogs.map(l => (
                        <div key={l.id} className="flex items-start justify-between gap-3 py-2 px-2 hover:bg-white rounded-lg transition-colors">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-700">
                              <span className="text-gold-dark font-bold">{l.partsRead}</span> partie{l.partsRead !== 1 ? 's' : ''}
                            </p>
                            {l.notes && (
                              <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">&quot;{l.notes}&quot;</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteLog(l.id)}
                            className="btn-icon text-red-300 hover:text-red-600 hover:bg-red-50 w-7 h-7 shrink-0 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>

      {/* Log Modal */}
      <Modal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        title="Ajouter une lecture"
        footer={
          <>
            <button onClick={() => setShowLogModal(false)} className="btn-secondary rounded-lg">Annuler</button>
            <button onClick={handleLog} disabled={saving} className="btn-primary rounded-lg font-bold">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label text-green-deep font-bold">Nombre de parties lues</label>
            <input
              className="input text-2xl text-center font-bold text-gold-dark rounded-xl border-2 border-gold-light focus:border-gold-dark"
              type="number"
              min="1"
              max={remaining !== null ? remaining : undefined}
              value={partsRead}
              onChange={e => {
                const val = parseInt(e.target.value)
                // Ne pas autoriser plus que le remaining
                if (remaining !== null && val > remaining) return
                setPartsRead(e.target.value)
              }}
              autoFocus
            />
            {remaining !== null && (
              <p className="text-xs text-gold-dark font-semibold mt-2 text-center bg-gold-pale rounded-lg py-2">
                ✓ Il reste <strong>{remaining}</strong> partie{remaining !== 1 ? 's' : ''} max
              </p>
            )}
            {item.targetTotal && (
              <p className="text-xs text-gray-500 font-normal mt-1 text-center">
                Déjà lu: <strong>{totalRead}</strong> / Objectif: <strong>{item.targetTotal}</strong>
              </p>
            )}
          </div>

          {/* Quick select buttons - only show valid values */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Raccourcis rapides</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5, 7, 10, 11, 15]
                .filter(n => !remaining || n <= remaining) // Filtrer par le remaining
                .map(n => (
                <button
                  key={n}
                  onClick={() => setPartsRead(String(n))}
                  className={`py-2.5 text-sm font-bold rounded-lg border-2 transition-all ${
                    partsRead === String(n)
                      ? 'bg-green-deep text-white border-green-deep shadow-md'
                      : 'border-ivory-darker bg-ivory text-green-deep hover:border-green-mid'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label text-green-deep font-bold">Notes (optionnel)</label>
            <input
              className="input rounded-xl border-2 border-gold-light focus:border-gold-dark placeholder-gray-400"
              type="text"
              placeholder="ex: après Fajr, au zikr du jeudi..."
              value={logNotes}
              onChange={e => setLogNotes(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
