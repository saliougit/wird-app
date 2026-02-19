import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import { today, daysUntil, isOverdue, daysOverdue } from '../utils/dates'
import Layout from '../components/Layout'
import ProgressRing from '../components/ProgressRing'
import Logo from '../components/Logo'
import {
  BookOpen, Flame, Warning, CheckCircle, ArrowRight,
  Hourglass, Plus
} from '@phosphor-icons/react'

function DashboardHeader() {
  const now = new Date()
  const heure = now.getHours()
  let salut = 'Bonsoir'
  if (heure < 12) salut = 'Bonjour'
  else if (heure < 18) salut = 'Bon après-midi'

  const dateLabel = now.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  return (
    <div className="px-4 pt-6 pb-7 bg-gradient-to-br from-green-deep via-green-deep to-green-mid text-ivory relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/3 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div>
              <h1 className="font-display text-xl font-bold">Wird</h1>
              <p className="text-ivory/80 text-xs font-body">Suivi de Lecture Spirituelle</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-ivory/80 text-xs tracking-wider uppercase font-body">{salut},</p>
          <p className="font-body text-base text-ivory/95 mt-1.5">{dateLabel}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const kamils = useLiveQuery(() => db.kamils.toArray(), []) || []
  const readings = useLiveQuery(() => db.readings.toArray(), []) || []
  const khassidas = useLiveQuery(() => db.khassidas.toArray(), []) || []
  const khassidaLogs = useLiveQuery(() => db.khassidaLogs.toArray(), []) || []

  // Active kamils
  const activeKamils = kamils.filter(k => {
    const readJuzz = [...new Set(readings.filter(r => r.kamilId === k.id).map(r => r.juzzNumber))]
    const total = k.type === 'collectif' ? (k.assignedJuzz?.length || 0) : 30
    return readJuzz.length < total
  })

  const overdueKamils = activeKamils.filter(k => isOverdue(k.endDate))
  const soonKamils = activeKamils.filter(k => {
    const days = daysUntil(k.endDate)
    return !isOverdue(k.endDate) && days >= 0 && days <= 3
  })

  // Active khassidas
  const activeKhassidas = khassidas.filter(k => {
    if (k.deadline && isOverdue(k.deadline)) {
      const totalRead = khassidaLogs.filter(l => l.khassidaId === k.id).reduce((s, l) => s + (l.partsRead || 0), 0)
      return totalRead < (k.targetTotal || 1)
    }
    return true
  })

  const urgentKhassidas = activeKhassidas.filter(k => {
    if (!k.deadline) return k.recurrence !== 'none'
    return isOverdue(k.deadline) || daysUntil(k.deadline) <= 1
  })

  const totalTasks = activeKamils.length + activeKhassidas.length
  const completed = kamils.filter(k => {
    const readJuzz = [...new Set(readings.filter(r => r.kamilId === k.id).map(r => r.juzzNumber))]
    const total = k.type === 'collectif' ? (k.assignedJuzz?.length || 0) : 30
    return readJuzz.length >= total
  }).length

  return (
    <div className="flex flex-col min-h-dvh bg-ivory">
      <DashboardHeader />

      <main className="flex-1 px-4 py-7 pb-nav space-y-7">

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 animate-fadeUp">
          <StatCard
            label="En cours"
            value={totalTasks}
            Icon={BookOpen}
            color="green"
          />
          <StatCard
            label="Retard"
            value={overdueKamils.length}
            Icon={Warning}
            color={overdueKamils.length > 0 ? 'red' : 'green'}
          />
          <StatCard
            label="Terminés"
            value={completed}
            Icon={CheckCircle}
            color="gold"
          />
        </div>

        {/* Priority Section */}
        {(overdueKamils.length > 0 || urgentKhassidas.length > 0) && (
          <section>
            <h2 className="section-title mb-3 flex items-center gap-2">
              <Warning size={18} weight="fill" className="text-red-500" />
              À traiter en priorité
            </h2>
            <div className="space-y-2">
              {/* Overdue Kamils */}
              {overdueKamils.map(k => {
                const readJuzz = [...new Set(readings.filter(r => r.kamilId === k.id).map(r => r.juzzNumber))]
                const total = k.type === 'collectif' ? (k.assignedJuzz?.length || 0) : 30
                const pct = Math.round((readJuzz.length / total) * 100)
                return (
                  <KamilCard
                    key={`overdue-${k.id}`}
                    kamil={k}
                    readCount={readJuzz.length}
                    total={total}
                    pct={pct}
                    status="overdue"
                    statusText={`+${daysOverdue(k.endDate)}j en retard`}
                    onClick={() => navigate(`/kamils/${k.id}`)}
                  />
                )
              })}
              {/* Urgent Khassidas */}
              {urgentKhassidas.slice(0, 2).map(k => {
                const totalRead = khassidaLogs.filter(l => l.khassidaId === k.id).reduce((s, l) => s + (l.partsRead || 0), 0)
                const pct = k.targetTotal ? Math.min(Math.round((totalRead / k.targetTotal) * 100), 100) : null
                const overdue = k.deadline && isOverdue(k.deadline)
                return (
                  <KhassidaCard 
                    key={`urgent-${k.id}`}
                    item={k}
                    totalRead={totalRead}
                    pct={pct}
                    overdue={overdue}
                    onClick={() => navigate(`/khassidas/${k.id}`)}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* Kamils Due Soon */}
        {soonKamils.length > 0 && (
          <section>
            <h2 className="section-title mb-3 flex items-center gap-2">
              <Hourglass size={18} weight="fill" className="text-gold/70" />
              À venir (3 jours)
            </h2>
            <div className="space-y-2">
              {soonKamils.map(k => {
                const readJuzz = [...new Set(readings.filter(r => r.kamilId === k.id).map(r => r.juzzNumber))]
                const total = k.type === 'collectif' ? (k.assignedJuzz?.length || 0) : 30
                const pct = Math.round((readJuzz.length / total) * 100)
                const daysLeft = daysUntil(k.endDate)
                return (
                  <KamilCard
                    key={`soon-${k.id}`}
                    kamil={k}
                    readCount={readJuzz.length}
                    total={total}
                    pct={pct}
                    status="soon"
                    statusText={`${daysLeft} jour${daysLeft !== 1 ? 's' : ''}`}
                    onClick={() => navigate(`/kamils/${k.id}`)}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* Active Kamils */}
        {activeKamils.filter(k => !isOverdue(k.endDate) && daysUntil(k.endDate) > 3).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2">
                <BookOpen size={18} weight="fill" className="text-green-mid" />
                Kamils en cours
              </h2>
              <button
                onClick={() => navigate('/kamils')}
                className="text-xs text-gold-dark font-bold hover:underline"
              >
                Voir tout
              </button>
            </div>
            <div className="space-y-2">
              {activeKamils.filter(k => !isOverdue(k.endDate) && daysUntil(k.endDate) > 3).slice(0, 3).map(k => {
                const readJuzz = [...new Set(readings.filter(r => r.kamilId === k.id).map(r => r.juzzNumber))]
                const total = k.type === 'collectif' ? (k.assignedJuzz?.length || 0) : 30
                const pct = Math.round((readJuzz.length / total) * 100)
                return (
                  <KamilCard
                    key={`active-${k.id}`}
                    kamil={k}
                    readCount={readJuzz.length}
                    total={total}
                    pct={pct}
                    onClick={() => navigate(`/kamils/${k.id}`)}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* Wirds / Khassidas */}
        {activeKhassidas.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title flex items-center gap-2">
                <Flame size={18} weight="fill" className="text-gold/70" />
                Wirds & Khassidas
              </h2>
              <button
                onClick={() => navigate('/khassidas')}
                className="text-xs text-gold-dark font-bold hover:underline"
              >
                Voir tout
              </button>
            </div>
            <div className="space-y-2">
              {activeKhassidas.slice(0, 4).map(k => {
                const totalRead = khassidaLogs.filter(l => l.khassidaId === k.id).reduce((s, l) => s + (l.partsRead || 0), 0)
                const pct = k.targetTotal ? Math.min(Math.round((totalRead / k.targetTotal) * 100), 100) : null
                const overdue = k.deadline && isOverdue(k.deadline)
                return (
                  <KhassidaCard 
                    key={`kh-${k.id}`} 
                    item={k} 
                    totalRead={totalRead}
                    pct={pct}
                    overdue={overdue}
                    onClick={() => navigate(`/khassidas/${k.id}`)} 
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {totalTasks === 0 && (
          <EmptyState navigate={navigate} />
        )}

      </main>
    </div>
  )
}

function StatCard({ label, value, Icon, color }) {
  const colorClass = {
    green: 'bg-green-soft text-green-deep',
    red: 'bg-red-100 text-red-600',
    gold: 'bg-gold/10 text-gold-dark',
  }[color]

  return (
    <div className={`${colorClass} card p-4 flex flex-col items-center justify-center gap-2 rounded-2xl`}>
      <Icon size={20} weight="fill" />
      <span className="font-display text-2xl font-bold">{value}</span>
      <span className="text-[10px] opacity-70 text-center leading-tight">{label}</span>
    </div>
  )
}

function KamilCard({ kamil, readCount, total, pct, status, statusText, onClick }) {
  const statusStyles = {
    overdue: 'bg-red-50 border-l-4 border-red-500',
    soon: 'bg-gold/5 border-l-4 border-gold',
    default: 'bg-green/5 border-l-4 border-green-mid',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left card p-4 flex items-center gap-4 transition-all active:scale-[0.98] ${statusStyles[status] || statusStyles.default}`}
    >
      <ProgressRing
        percent={pct}
        size={56}
        stroke={4}
        color={status === 'overdue' ? '#dc2626' : '#2D5A3D'}
        bg="#E8DCC4"
      >
        <span className="text-xs font-bold text-green-deep">{pct}%</span>
      </ProgressRing>

      <div className="flex-1 min-w-0">
        <p className="font-body font-bold text-green-deep truncate">{kamil.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {readCount} / {total} Juzz
        </p>
        {kamil.type === 'collectif' && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-green-deep/10 text-green-deep text-[10px] rounded-full">
            Collectif
          </span>
        )}
      </div>

      <div className="shrink-0 text-right">
        {statusText && (
          <span className={`badge text-[10px] font-bold ${
            status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-gold/20 text-gold-dark'
          }`}>
            {statusText}
          </span>
        )}
      </div>
    </button>
  )
}

function EmptyState({ navigate }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-24 h-24 rounded-full bg-green-soft flex items-center justify-center mb-4">
        <BookOpen size={48} className="text-green-mid" weight="duotone" />
      </div>
      <h3 className="font-display text-2xl text-green-deep font-bold">Commencez</h3>
      <p className="text-sm text-gray-500 mt-3 max-w-xs">
        Créez votre première lecture pour commencer à suivre vos progrès
      </p>
      <div className="flex gap-2 mt-6 flex-wrap justify-center">
        <button 
          onClick={() => navigate('/kamils/new')} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Kamil
        </button>
        <button 
          onClick={() => navigate('/khassidas/new')} 
          className="btn-secondary flex items-center gap-2"
        >
          <Plus size={16} /> Wird
        </button>
      </div>
    </div>
  )
}

function KhassidaCard({ item, totalRead, pct, overdue, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`text-left card p-4 cursor-pointer transition-all active:scale-[0.98] hover:shadow-lg ${
        overdue ? 'border-l-4 border-l-red-500 bg-red-50' : 'border-l-4 border-l-gold'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-bold text-green-deep truncate">{item.name}</p>
          <p className="text-sm text-gray-600 mt-1">{totalRead} partie{totalRead !== 1 ? 's' : ''}</p>
          {pct !== null && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className={overdue ? 'h-full bg-red-500' : 'h-full bg-gold'} 
                style={{ width: `${pct}%` }} 
              />
            </div>
          )}
        </div>
        {overdue && (
          <span className="badge bg-red-100 text-red-600 text-[10px] font-bold shrink-0 whitespace-nowrap">Retard</span>
        )}
      </div>
    </div>
  )
}
