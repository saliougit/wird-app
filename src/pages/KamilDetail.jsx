import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, toggleJuzzReading, getReadJuzz } from '../db'
import { today, formatDate, isOverdue, daysUntil, daysOverdue } from '../utils/dates'
import Layout from '../components/Layout'
import ProgressRing from '../components/ProgressRing'
import { CalendarBlank, Warning, CheckCircle, Clock, Pencil, Check, BookOpen, Flame, CheckFat } from '@phosphor-icons/react'

const JUZZ_NAMES = [
  'الم', 'سيقول', 'تلك الرسل', 'لن تنالوا', 'والمحصنات',
  'لا يحب الله', 'وإذا سمعوا', 'ولو أننا', 'قال الملأ', 'واعلموا',
  'يعتذرون', 'وما من دابة', 'وما أبرئ', 'ربما', 'سبحان الذي',
  'قال ألم', 'اقترب', 'قد أفلح', 'وقال الذين', 'أمن خلق',
  'اتل ما أوحي', 'ومن يقنت', 'وما لي', 'فمن أظلم', 'إليه يرد',
  'حم', 'قال فما خطبكم', 'قد سمع الله', 'تبارك الذي', 'عم'
]

export default function KamilDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const kamilId = parseInt(id)

  const [readJuzz, setReadJuzz] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  const kamil = useLiveQuery(() => db.kamils.get(kamilId), [kamilId])
  const readings = useLiveQuery(
    () => db.readings.where('kamilId').equals(kamilId).toArray(),
    [kamilId]
  ) || []

  useEffect(() => {
    // Compute unique read juzz
    const unique = [...new Set(readings.map(r => r.juzzNumber))]
    setReadJuzz(unique)
  }, [readings])

  if (!kamil) {
    return (
      <Layout title="Kamil" back>
        <div className="p-4 text-center text-gray-400 py-16">Chargement...</div>
      </Layout>
    )
  }

  const isCollectif = kamil.type === 'collectif'
  const availableJuzz = isCollectif ? (kamil.assignedJuzz || []) : Array.from({ length: 30 }, (_, i) => i + 1)
  const total = availableJuzz.length
  const doneCount = readJuzz.filter(j => availableJuzz.includes(j)).length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const overdue = isOverdue(kamil.endDate)
  const daysLeft = kamil.endDate ? daysUntil(kamil.endDate) : null
  const over = overdue ? daysOverdue(kamil.endDate) : 0
  const done = doneCount >= total && total > 0

  // Group readings by date for history
  const byDate = readings.reduce((acc, r) => {
    const date = r.readDate || today()
    if (!acc[date]) acc[date] = []
    acc[date].push(r.juzzNumber)
    return acc
  }, {})

  const handleToggle = async (juzzNum) => {
    await toggleJuzzReading(kamilId, juzzNum)
  }

  return (
    <Layout
      title={kamil.name}
      back
    >
      <div className="px-4 py-5 space-y-6 max-w-lg mx-auto pb-6">

        {/* Status banner */}
        {overdue && !done && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg text-sm animate-slideFromRight">
            <Warning size={20} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Délai dépassé</p>
              <p className="text-red-700 text-xs mt-1">+{over} jour{over > 1 ? 's' : ''} — Continuez, ne baissez pas les bras!</p>
            </div>
          </div>
        )}

        {done && (
          <div className="flex items-start gap-3 bg-green-soft border border-green-light text-green-deep px-4 py-4 rounded-lg text-sm animate-scaleIn">
            <CheckCircle size={20} weight="fill" className="text-green-mid shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Kamil terminé</p>
              <p className="text-green-deep/70 text-xs mt-1">Alhamdulillah wa shukran!</p>
            </div>
          </div>
        )}

        {/* Progress Card - Enhanced */}
        <div className="card p-6 animate-scaleIn">
          <div className="flex items-center gap-6">
            <ProgressRing
              percent={pct}
              size={84}
              stroke={7}
              color={done ? '#2D5A3D' : overdue ? '#dc2626' : '#C49A28'}
              bg="#E8DCC4"
            >
              {done
                ? <CheckFat size={28} weight="fill" className="text-green-mid" />
                : <span className="text-lg font-bold text-green-deep">{pct}%</span>
              }
            </ProgressRing>

            <div className="flex-1">
              <div className="mb-1">
                <p className="font-display text-3xl font-bold text-green-deep">{doneCount}</p>
                <p className="text-xs text-gray-500">sur {total} Juzz</p>
              </div>
              
              {kamil.startDate && (
                <div className="mt-3 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarBlank size={14} className="text-gold" weight="fill" />
                    <span>{formatDate(kamil.startDate)} → {kamil.endDate ? formatDate(kamil.endDate) : '∞'}</span>
                  </div>
                  {!overdue && daysLeft !== null && !done && (
                    <div className="flex items-center gap-2 text-green-700">
                      <Clock size={14} className="text-green-mid" weight="fill" />
                      {daysLeft} jour{daysLeft !== 1 ? 's' : ''} restant
                    </div>
                  )}
                  {overdue && !done && (
                    <div className="flex items-center gap-2 text-red-600">
                      <Warning size={14} weight="fill" />
                      +{over} jour{over > 1 ? 's' : ''} de retard
                    </div>
                  )}
                </div>
              )}

              {isCollectif && (
                <span className="inline-block mt-3 badge badge-gray text-xs">Collectif</span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background: done ? '#2D5A3D' : overdue ? '#dc2626' : '#C49A28'
                }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-2 text-right">{doneCount} Juzz lus</p>
          </div>
        </div>

        {/* Juzz stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            <p className="text-2xl font-bold text-gold-dark">{doneCount}</p>
            <p className="text-xs text-gray-500 mt-1 font-body">Complétés</p>
          </div>
          <div className="card p-4 text-center animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            <p className="text-2xl font-bold text-gold">{total - doneCount}</p>
            <p className="text-xs text-gray-500 mt-1 font-body">Restants</p>
          </div>
          <div className="card p-4 text-center animate-fadeUp" style={{ animationDelay: '0.3s' }}>
            <p className="text-2xl font-bold text-green-deep">{Object.keys(byDate).length}</p>
            <p className="text-xs text-gray-500 mt-1 font-body">Jours actifs</p>
          </div>
        </div>

        {/* Juzz Grid */}
        <div className="animate-fadeUp">
          <h2 className="section-title mb-4">
            {isCollectif ? 'Vos Juzz assignés' : 'Grille des 30 Juzz'}
          </h2>
          <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-10">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((n, idx) => {
              const available = availableJuzz.includes(n)
              const isRead = readJuzz.includes(n)

              if (!available && isCollectif) {
                return (
                  <div
                    key={n}
                    className="aspect-square flex items-center justify-center rounded-lg bg-gray-100 opacity-40"
                  >
                    <span className="text-[10px] font-bold text-gray-400">J{n}</span>
                  </div>
                )
              }

              return (
                <button
                  key={n}
                  onClick={() => handleToggle(n)}
                  className={`aspect-square flex flex-col items-center justify-center font-bold rounded-lg transition-all active:scale-90 ${
                    isRead
                      ? 'bg-gradient-to-br from-green-mid to-green-deep text-ivory shadow-md'
                      : 'bg-white border-2 border-gray-200 text-green-deep hover:border-gold hover:bg-gold/5'
                  }`}
                  title={`Juzz ${n} - ${JUZZ_NAMES[n - 1]}`}
                >
                  {isRead && <CheckFat size={16} weight="fill" />}
                  <span className="text-sm leading-tight">{n}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center font-body">Appuyez sur un Juzz pour marquer / démarquer</p>
        </div>

        {/* Reading history */}
        <div className="animate-fadeUp">
          <button
            onClick={() => setShowHistory(h => !h)}
            className="flex items-center gap-2 text-sm font-bold text-green-mid hover:text-green-deep transition-colors"
          >
            <BookOpen size={18} weight="fill" />
            Historique des lectures
            <span className="badge badge-gray text-[10px]">{Object.keys(byDate).length} jour{Object.keys(byDate).length !== 1 ? 's' : ''}</span>
          </button>

          {showHistory && (
            <div className="mt-4 space-y-2">
              {Object.entries(byDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([date, juzzList], idx) => (
                  <div 
                    key={date} 
                    className="card p-4 flex items-start gap-4 animate-fadeUp"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="shrink-0 text-center">
                      <p className="text-sm font-bold text-green-deep">{formatDate(date)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Set(juzzList).size} Juzz</p>
                    </div>
                    <div className="flex-1 flex flex-wrap gap-1.5">
                      {[...new Set(juzzList)].sort((a, b) => a - b).map(j => (
                        <span 
                          key={j} 
                          className="badge badge-green text-xs font-bold"
                        >
                          J{j}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              }
              {Object.keys(byDate).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">Aucune lecture enregistrée</p>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {kamil.notes && (
          <div className="card p-5 animate-fadeUp border-l-4 border-l-gold">
            <p className="text-xs font-bold text-green-mid uppercase tracking-wider mb-2">Notes personnelles</p>
            <p className="text-sm text-gray-600">{kamil.notes}</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
