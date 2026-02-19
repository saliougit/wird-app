import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, deleteKhassida } from '../db'
import { isOverdue, daysUntil, daysOverdue, formatDate } from '../utils/dates'
import Layout from '../components/Layout'
import { Plus, Star, Trash, Warning, ArrowRight, Clock, Repeat, Moon, Flame } from '@phosphor-icons/react'
import { useState } from 'react'

const CATEGORY_ICONS = {
  khassida: Star,
  wird: Moon,
  duaa: Star,
  autre: Star,
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
  const logs = useLiveQuery(() => db.khassidaLogs.toArray(), []) || []

  const getProgress = (item) => {
    const totalRead = logs
      .filter(l => l.khassidaId === item.id)
      .reduce((s, l) => s + (l.partsRead || 0), 0)
    const pct = item.targetTotal ? Math.min(Math.round((totalRead / item.targetTotal) * 100), 100) : null
    const done = item.targetTotal ? totalRead >= item.targetTotal : false
    return { totalRead, pct, done }
  }

  const filtered = khassidas.filter(k => {
    const { done } = getProgress(k)
    if (filter === 'done') return done
    if (filter === 'urgent') {
      if (!k.deadline) return k.recurrence !== 'none'
      return isOverdue(k.deadline) || daysUntil(k.deadline) <= 2
    }
    return !done
  })

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (confirm('Supprimer ce Wird/Khassida et toutes ses lectures ?')) {
      await deleteKhassida(id)
    }
  }

  const urgentCount = khassidas.filter(k => {
    if (!k.deadline) return k.recurrence !== 'none'
    return isOverdue(k.deadline) || daysUntil(k.deadline) <= 2
  }).length

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
      <div className="px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all',    label: 'Tous' },
            { key: 'urgent', label: `Urgent${urgentCount ? ` (${urgentCount})` : ''}` },
            { key: 'done',   label: 'Terminés' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 text-xs font-bold py-2 px-2 rounded-md transition-all ${
                filter === key ? 'bg-gold text-green-deep shadow-md' : 'text-dark-green/70 hover:text-dark-green'
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
            <button
              onClick={() => navigate('/khassidas/new')}
              className="btn-primary mt-6"
            >
              Ajouter un Wird
            </button>
          </div>
        )}

        {filtered.map(k => {
          const { totalRead, pct, done } = getProgress(k)
          const overdue = !done && k.deadline && isOverdue(k.deadline)
          const over = overdue ? daysOverdue(k.deadline) : 0
          const daysLeft = k.deadline && !overdue ? daysUntil(k.deadline) : null
          const IconComp = CATEGORY_ICONS[k.category] || Flame

          return (
            <div
              key={k.id}
              onClick={() => navigate(`/khassidas/${k.id}`)}
              className={`w-full text-left animate-fadeUp card p-4 flex gap-4 items-center transition-all cursor-pointer active:scale-[0.98] hover:shadow-lg ${
                done ? 'border-l-4 border-l-green-mid bg-green-soft/30' : overdue ? 'border-l-4 border-l-red-500 bg-red-50' : 'border-l-4 border-l-gold'
              }`}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                done ? 'bg-green-soft' : overdue ? 'bg-red-100' : 'bg-gold/10'
              }`}>
                <IconComp
                  size={24}
                  weight="fill"
                  className={done ? 'text-green-mid' : overdue ? 'text-red-500' : 'text-gold'}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-body font-bold text-green-deep text-base truncate flex-1">{k.name}</p>
                  <span className="badge badge-gray shrink-0 text-[10px] font-body">
                    {CATEGORY_LABELS[k.category] || k.category}
                  </span>
                </div>

                <p className="text-xs text-gray-600 font-body">
                  {totalRead} partie{totalRead !== 1 ? 's' : ''}
                  {k.targetTotal ? ` / ${k.targetTotal}` : ''}
                </p>

                {k.deadline && (
                  <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 font-body">
                    <Clock size={10} weight="fill" />
                    {overdue ? '+' : ''}{formatDate(k.deadline)}
                  </p>
                )}

                {RECURRENCE_LABELS[k.recurrence] && (
                  <p className="text-[10px] text-gold font-body font-bold mt-1 flex items-center gap-1">
                    <Repeat size={10} weight="fill" /> {RECURRENCE_LABELS[k.recurrence]}
                  </p>
                )}

                {pct !== null && (
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: done ? '#2D5A3D' : overdue ? '#dc2626' : '#C49A28'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                {overdue && <span className="badge badge-red text-[10px] font-bold">+{over}j</span>}
                {!overdue && daysLeft !== null && (
                  <span className={`badge text-[10px] font-bold ${daysLeft <= 3 ? 'badge-gold' : 'badge-gray'}`}>{daysLeft}j</span>
                )}
                {done && <span className="badge badge-green text-[10px]">✓</span>}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(e, k.id)
                  }}
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
