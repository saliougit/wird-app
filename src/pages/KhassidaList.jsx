import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, deleteKhassida, deleteKhassidaBatch } from '../db'
import { isOverdue, daysUntil, daysOverdue, formatDate } from '../utils/dates'
import Layout from '../components/Layout'
import { Plus, Star, Trash, Warning, Clock, Repeat, Moon, Heart, Circle, ListBullets, Flame } from '@phosphor-icons/react'
import { useState } from 'react'

const CATEGORY_ICONS = {
  khassida: Star,
  wird: Moon,
  duaa: Heart,
  autre: Circle,
}

const CATEGORY_LABELS = {
  khassida: 'Khassida',
  wird: 'Wird',
  duaa: 'Duaa',
  autre: 'Autre',
}

const RECURRENCE_LABELS = {
  none: null,
  daily: 'Quotidien',
  weekly: 'Hebdo',
  monthly: 'Mensuel',
}

export default function KhassidaList() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const khassidas = useLiveQuery(() => db.khassidas.orderBy('createdAt').reverse().toArray(), []) || []
  const batches = useLiveQuery(() => db.khassidaBatches.orderBy('createdAt').reverse().toArray(), []) || []
  const logs = useLiveQuery(() => db.khassidaLogs.toArray(), []) || []

  const getProgress = (item) => {
    const totalRead = logs
      .filter(l => l.khassidaId === item.id)
      .reduce((s, l) => s + (l.partsRead || 0), 0)
    const pct = item.targetTotal ? Math.min(Math.round((totalRead / item.targetTotal) * 100), 100) : null
    const done = item.targetTotal ? totalRead >= item.targetTotal : false
    return { totalRead, pct, done }
  }

  const getBatchProgress = (batch) => {
    if (!batch.khassidas) return { totalDone: 0, totalTarget: 0, pct: null }
    const limitedItems = batch.khassidas.filter(k => k.targetCount)
    const totalTarget = limitedItems.reduce((s, k) => s + k.targetCount, 0)
    const totalDoneLimited = limitedItems.reduce((s, k) => s + Math.min(k.currentCount, k.targetCount), 0)
    const totalDone = batch.khassidas.reduce((s, k) => s + k.currentCount, 0)
    const pct = totalTarget > 0 ? Math.round((totalDoneLimited / totalTarget) * 100) : null
    const done = pct !== null ? pct >= 100 : false
    return { totalDone, totalTarget, pct, done }
  }

  // Merge all into one list sorted by createdAt desc
  const allItems = [
    ...khassidas.map(k => ({ ...k, _kind: 'regular' })),
    ...batches.map(b => ({ ...b, _kind: 'batch' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const filtered = allItems.filter(item => {
    const done = item._kind === 'regular' ? getProgress(item).done : getBatchProgress(item).done
    if (filter === 'termines') return done
    if (filter === 'en_cours') return !done
    return true
  })

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (confirm('Supprimer ce Wird/Khassida et toutes ses lectures ?')) {
      await deleteKhassida(id)
    }
  }

  const handleDeleteBatch = async (e, id) => {
    e.stopPropagation()
    if (confirm('Supprimer cette liste de Khassidas ?')) {
      await deleteKhassidaBatch(id)
    }
  }

  return (
    <Layout
      title="Wirds & Khassidas"
      actions={
        <button
          onClick={() => navigate('/khassidas/new')}
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
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
              <Flame size={36} className="text-gold/70" weight="duotone" />
            </div>
            <p className="text-sm text-gray-500 font-body">Aucun wird à afficher</p>
            <button onClick={() => navigate('/khassidas/new')} className="btn-primary mt-6">
              Ajouter un Wird
            </button>
          </div>
        )}

        {filtered.map(item => {
          if (item._kind === 'regular') {
            const { totalRead, pct, done } = getProgress(item)
            const overdue = !done && item.deadline && isOverdue(item.deadline)
            const over = overdue ? daysOverdue(item.deadline) : 0
            const daysLeft = item.deadline && !overdue ? daysUntil(item.deadline) : null
            const IconComp = CATEGORY_ICONS[item.category] || Flame

            return (
              <div
                key={`r-${item.id}`}
                onClick={() => navigate(`/khassidas/${item.id}`)}
                className={`w-full text-left animate-fadeUp card p-4 flex gap-4 items-center transition-all cursor-pointer active:scale-[0.98] hover:shadow-lg ${
                  done ? 'border-l-4 border-l-green-mid bg-green-soft/30'
                  : overdue ? 'border-l-4 border-l-red-500 bg-red-50'
                  : 'border-l-4 border-l-gold'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                  done ? 'bg-green-soft' : overdue ? 'bg-red-100' : 'bg-gold/10'
                }`}>
                  <IconComp
                    size={24}
                    weight="fill"
                    className={done ? 'text-green-mid' : overdue ? 'text-red-500' : 'text-gold'}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-body font-bold text-green-deep text-base truncate flex-1">{item.name}</p>
                    <span className="badge badge-gray shrink-0 text-[10px] font-body">
                      {CATEGORY_LABELS[item.category] || item.category}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 font-body">
                    {totalRead} partie{totalRead !== 1 ? 's' : ''}
                    {item.targetTotal ? ` / ${item.targetTotal}` : ''}
                  </p>

                  {item.deadline && (
                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 font-body">
                      <Clock size={10} weight="fill" />
                      {overdue ? '+' : ''}{formatDate(item.deadline)}
                    </p>
                  )}

                  {RECURRENCE_LABELS[item.recurrence] && (
                    <p className="text-[10px] text-gold font-body font-bold mt-1 flex items-center gap-1">
                      <Repeat size={10} weight="fill" /> {RECURRENCE_LABELS[item.recurrence]}
                    </p>
                  )}

                  {pct !== null && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: done ? '#2D5A3D' : overdue ? '#dc2626' : '#C49A28' }}
                      />
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  {overdue && <span className="badge badge-red text-[10px] font-bold"><Warning size={10} weight="fill" className="inline" /> +{over}j</span>}
                  {!overdue && daysLeft !== null && (
                    <span className={`badge text-[10px] font-bold ${daysLeft <= 3 ? 'badge-gold' : 'badge-gray'}`}>{daysLeft}j</span>
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

          // Batch
          const { totalDone, totalTarget, pct, done } = getBatchProgress(item)
          return (
            <div
              key={`b-${item.id}`}
              onClick={() => navigate(`/khassidas-batch/${item.id}`)}
              className={`w-full text-left animate-fadeUp card p-4 flex gap-4 items-center transition-all cursor-pointer active:scale-[0.98] hover:shadow-lg ${
                done ? 'border-l-4 border-l-green-mid bg-green-soft/30' : 'border-l-4 border-l-purple-400'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${done ? 'bg-green-soft' : 'bg-purple-100'}`}>
                <ListBullets size={24} weight="fill" className={done ? 'text-green-mid' : 'text-purple-500'} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-body font-bold text-green-deep text-base truncate flex-1">{item.periodName}</p>
                  <span className="badge shrink-0 text-[10px] font-body bg-purple-100 text-purple-700">Période</span>
                </div>
                <p className="text-xs text-gray-600 font-body">
                  {pct !== null ? `${totalDone} / ${totalTarget} récitations` : `${totalDone} récitations`}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {formatDate(item.startDate)} → {formatDate(item.endDate)}
                </p>
                {pct !== null && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: done ? '#2D5A3D' : '#7c3aed' }}
                    />
                  </div>
                )}
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                {done && <span className="badge badge-green text-[10px]">Terminé</span>}
                <button
                  onClick={(e) => handleDeleteBatch(e, item.id)}
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
