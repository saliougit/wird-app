import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, deleteKamil, deleteDailyKamil } from '../db'
import { isOverdue, daysUntil, daysOverdue, formatDate } from '../utils/dates'
import Layout from '../components/Layout'
import ProgressRing from '../components/ProgressRing'
import { Plus, BookOpen, Trash, Users, Warning, Check, CalendarBlank } from '@phosphor-icons/react'
import { useState } from 'react'

export default function KamilList() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const kamils = useLiveQuery(() => db.kamils.orderBy('createdAt').reverse().toArray(), []) || []
  const dailyKamils = useLiveQuery(() => db.dailyKamils.orderBy('createdAt').reverse().toArray(), []) || []
  const readings = useLiveQuery(() => db.readings.toArray(), []) || []
  const dailyLogs = useLiveQuery(() => db.dailyKamilLogs.toArray(), []) || []

  const todayStr = new Date().toISOString().split('T')[0]

  const getProgress = (kamil) => {
    const readJuzz = [...new Set(readings.filter(r => r.kamilId === kamil.id).map(r => r.juzzNumber))]
    const total = kamil.type === 'collectif' ? (kamil.assignedJuzz?.length || 0) : 30
    const pct = total > 0 ? Math.round((readJuzz.length / total) * 100) : 0
    return { readCount: readJuzz.length, total, pct, done: readJuzz.length >= total }
  }

  const getDailyProgress = (dk) => {
    const logs = dailyLogs.filter(l => l.dailyKamilId === dk.id)
    const daysInPeriod = Math.ceil((new Date(dk.endDate) - new Date(dk.startDate)) / (1000 * 60 * 60 * 24)) + 1
    const pct = daysInPeriod > 0 ? Math.round((logs.length / daysInPeriod) * 100) : 0
    return { logged: logs.length, total: daysInPeriod, pct, done: logs.length >= daysInPeriod }
  }

  // Merge all kamils into one list
  const allItems = [
    ...kamils.map(k => ({ ...k, _kind: 'regular' })),
    ...dailyKamils.map(dk => ({ ...dk, _kind: 'daily' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const filtered = allItems.filter(item => {
    const done = item._kind === 'regular' ? getProgress(item).done : getDailyProgress(item).done
    if (filter === 'termines') return done
    if (filter === 'en_cours') return !done
    return true
  })

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (confirm('Supprimer ce Kamil et toutes ses lectures ?')) await deleteKamil(id)
  }

  const handleDeleteDaily = async (e, id) => {
    e.stopPropagation()
    if (confirm('Supprimer ce Kamil quotidien et tous ses logs ?')) await deleteDailyKamil(id)
  }

  return (
    <Layout
      title="Kamils"
      actions={
        <button
          onClick={() => navigate('/kamils/new')}
          className="btn-icon bg-gold text-green-deep hover:brightness-90 w-12 h-12"
        >
          <Plus size={28} weight="bold" />
        </button>
      }
    >
      {/* Filter tabs */}
      <div className="px-4 pt-5 pb-2">
        <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
          {[
            { key: 'all',      label: 'Tous' },
            { key: 'en_cours', label: 'En cours' },
            { key: 'termines', label: 'Terminés' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 text-xs font-bold py-2 px-2 rounded-md transition-all ${
                filter === key
                  ? 'bg-green-deep text-ivory shadow-md'
                  : 'text-green-mid dark:text-gray-400 hover:text-green-deep dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-soft flex items-center justify-center mx-auto mb-4">
              <BookOpen size={36} className="text-green-mid" weight="duotone" />
            </div>
            <p className="text-sm text-gray-500 font-body">Aucun kamil à afficher</p>
            <button onClick={() => navigate('/kamils/new')} className="btn-primary mt-6">
              Créer un Kamil
            </button>
          </div>
        )}

        {filtered.map(item => {
          if (item._kind === 'regular') {
            const { readCount, total, pct, done } = getProgress(item)
            const overdue = !done && isOverdue(item.endDate)
            const daysLeft = item.endDate ? daysUntil(item.endDate) : null
            const over = overdue ? daysOverdue(item.endDate) : 0

            return (
              <div
                key={`r-${item.id}`}
                onClick={() => navigate(`/kamils/${item.id}`)}
                className={`w-full text-left animate-fadeUp card p-4 flex gap-4 items-center transition-all cursor-pointer active:scale-[0.98] hover:shadow-lg ${
                  done ? 'border-l-4 border-l-green-mid bg-green-soft/30'
                  : overdue ? 'border-l-4 border-l-red-500 bg-red-50'
                  : 'border-l-4 border-l-gold'
                }`}
              >
                <ProgressRing
                  percent={pct}
                  size={64}
                  stroke={5}
                  color={done ? '#2D5A3D' : overdue ? '#dc2626' : '#C49A28'}
                  bg="#E8DCC4"
                >
                  {done
                    ? <Check size={18} weight="bold" className="text-green-mid" />
                    : <span className="text-xs font-bold text-green-deep">{pct}%</span>
                  }
                </ProgressRing>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <p className="font-body font-bold text-green-deep text-base truncate flex-1">{item.name}</p>
                    {item.type === 'collectif' && (
                      <span className="inline-flex items-center gap-1 badge badge-gray shrink-0 text-[10px]">
                        <Users size={10} weight="fill" /> Collectif
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 font-body">{readCount} / {total} Juzz</p>
                  {item.startDate && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDate(item.startDate)} → {item.endDate ? formatDate(item.endDate) : 'En cours'}
                    </p>
                  )}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: done ? '#2D5A3D' : overdue ? '#dc2626' : '#C49A28' }}
                    />
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  {overdue && (
                    <span className="inline-flex items-center gap-1 badge badge-red text-[10px]">
                      <Warning size={10} weight="fill" /> +{over}j
                    </span>
                  )}
                  {!overdue && daysLeft !== null && !done && (
                    <span className={`badge text-[10px] font-bold ${daysLeft <= 3 ? 'badge-gold' : 'badge-gray'}`}>
                      {daysLeft}j
                    </span>
                  )}
                  {done && <span className="badge badge-green text-[10px]">Terminé</span>}
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="btn-icon text-gray-300 hover:text-red-600 hover:bg-red-50 w-8 h-8 transition-colors mt-1"
                  >
                    <Trash size={16} weight="regular" />
                  </button>
                </div>
              </div>
            )
          }

          // Kamil quotidien
          const { logged, total, pct, done } = getDailyProgress(item)
          const todayLogged = dailyLogs.some(l => l.dailyKamilId === item.id && l.date === todayStr)

          return (
            <div
              key={`d-${item.id}`}
              onClick={() => navigate(`/kamils-daily/${item.id}`)}
              className={`w-full text-left animate-fadeUp card p-4 flex gap-4 items-center transition-all cursor-pointer active:scale-[0.98] hover:shadow-lg ${
                done ? 'border-l-4 border-l-green-mid bg-green-soft/30' : 'border-l-4 border-l-gold-dark'
              }`}
            >
              <ProgressRing
                percent={pct}
                size={64}
                stroke={5}
                color={done ? '#2D5A3D' : '#1A3828'}
                bg="#E8DCC4"
              >
                {done
                  ? <Check size={18} weight="bold" className="text-green-mid" />
                  : <span className="text-xs font-bold text-green-deep">{pct}%</span>
                }
              </ProgressRing>

              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <p className="font-body font-bold text-green-deep text-base truncate flex-1">{item.name}</p>
                  <span className="inline-flex items-center gap-1 badge bg-gold-pale text-gold-dark shrink-0 text-[10px]">
                    <CalendarBlank size={10} weight="fill" /> Quotidien
                  </span>
                </div>
                <p className="text-xs text-gray-600 font-body">
                  {logged} / {total} jours · Juzz {item.defaultJuzz}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {formatDate(item.startDate)} → {formatDate(item.endDate)}
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gold-dark"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                {!done && (
                  <span className={`badge text-[10px] font-bold ${todayLogged ? 'badge-green' : 'badge-gold'}`}>
                    {todayLogged ? '✓ Aujourd\'hui' : 'À faire'}
                  </span>
                )}
                {done && <span className="badge badge-green text-[10px]">Terminé</span>}
                <button
                  onClick={(e) => handleDeleteDaily(e, item.id)}
                  className="btn-icon text-gray-300 hover:text-red-600 hover:bg-red-50 w-8 h-8 transition-colors mt-1"
                >
                  <Trash size={16} weight="regular" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}
