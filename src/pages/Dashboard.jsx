import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { db } from '../db'
import { today, daysUntil, isOverdue, daysOverdue } from '../utils/dates'
import ProgressRing from '../components/ProgressRing'
import Logo from '../components/Logo'
import BottomNav from '../components/BottomNav'
import { useTheme } from '../context/ThemeContext'
import {
  BookOpen, Flame, Warning, CheckCircle, ArrowRight,
  Hourglass, Plus, Clock, Compass
} from '@phosphor-icons/react'

const ARABIC_GREETINGS = {
  morning: 'صباح الخير',
  afternoon: 'مساء الخير',
  evening: 'تصبح على خير'
}

const ARABIC_DAYS = {
  0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
  4: 'الخميس', 5: 'الجمعة', 6: 'السبت'
}

const ARABIC_MONTHS = {
  0: 'جانفي', 1: 'فيفري', 2: 'مارس', 3: 'أفريل',
  4: 'ماي', 5: 'جوان', 6: 'جويلية', 7: 'أوت',
  8: 'سبتمبر', 9: 'أكتوبر', 10: 'نوفمبر', 11: 'ديسمبر'
}

const HIJRI_MONTHS = {
  1: 'محرم', 2: 'صفر', 3: 'ربيع الأول', 4: 'ربيع الثاني',
  5: 'جمادى الأولى', 6: 'جمادى الثانية', 7: 'رجب', 8: 'شعبان',
  9: 'رمضان', 10: 'شوال', 11: 'ذو القعدة', 12: 'ذو الحجة'
}

// Convert Gregorian to Hijri date - 2026 accurate lookup 
function toHijri(date) {
  const g = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  // 2026 Hijri calendar month start dates (verified: 20 Feb 2026 = 2 Rajab 1447)
  // 1 Muharram 1447 = 24 Aug 2025
  const hijri2026 = {
    1: { start: [8, 24], days: 30 },   // 1 Muharram
    2: { start: [9, 23], days: 29 },   // 1 Safar
    3: { start: [10, 22], days: 30 },  // 1 Rabi' al-Awwal
    4: { start: [11, 21], days: 29 },  // 1 Rabi' al-Thani
    5: { start: [12, 20], days: 30 },  // 1 Jumada al-Awwal
    6: { start: [1, 19], days: 29 },   // 1 Jumada al-Thani (Jan 2026)
    7: { start: [2, 19], days: 30 },   // 1 Rajab (19 Feb = 1 Rajab)
    8: { start: [3, 20], days: 29 },   // 1 Sha'ban
    9: { start: [4, 18], days: 30 },   // 1 Ramadan
    10: { start: [5, 18], days: 29 },  // 1 Shawwal
    11: { start: [6, 16], days: 30 },  // 1 Dhu al-Qi'dah
    12: { start: [7, 16], days: 29 },  // 1 Dhu al-Hijjah
  }

  // Determine current Hijri month
  let hijriMonth = 1
  let hijriYear = 1447
  let monthStart = [8, 24]

  for (let hm = 1; hm <= 12; hm++) {
    const current = hijri2026[hm]
    const [hm_month, hm_day] = current.start
    
    // Check if date is after this month's start
    const isAfter = (m > hm_month) || (m === hm_month && d >= hm_day)
    
    if (isAfter) {
      hijriMonth = hm
      monthStart = current.start
      
      // Check if it's before next month
      const nextMonth = hm + 1
      if (nextMonth <= 12) {
        const next = hijri2026[nextMonth]
        const [nm_month, nm_day] = next.start
        const isBeforeNext = (m < nm_month) || (m === nm_month && d < nm_day)
        if (isBeforeNext) break
      }
    }
  }

  // Calculate day within month
  const [start_month, start_day] = monthStart
  let hijriDay = 1

  if (m === start_month) {
    hijriDay = d - start_day + 1
  } else {
    // Calculate days from month start
    const startDate = new Date(g, start_month - 1, start_day)
    const currentDate = new Date(g, m - 1, d)
    const diff = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24))
    hijriDay = diff + 1
  }

  return { 
    day: Math.max(1, Math.min(30, hijriDay)), 
    month: hijriMonth, 
    year: hijriYear 
  }
}

function DashboardHeader() {
  const { isDark } = useTheme()
  const [time, setTime] = useState(new Date())
  const [qibla, setQibla] = useState(null)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate Qibla direction using Great Circle bearing to Kaaba
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          // Kaaba (Mecca): 21.4225° N, 39.8262° E (verified coordinates)
          const kaabLat = 21.4225
          const kaabLng = 39.8262
          
          // Convert to radians
          const lat1 = lat * Math.PI / 180
          const lat2 = kaabLat * Math.PI / 180
          const dLng = (kaabLng - lng) * Math.PI / 180
          
          // Great Circle bearing formula
          const y = Math.sin(dLng) * Math.cos(lat2)
          const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
          
          // Calculate bearing from North (0°)
          let bearing = Math.atan2(y, x) * 180 / Math.PI
          // Normalize to 0-360 degrees
          bearing = (bearing + 360) % 360
          
          setQibla(Math.round(bearing))
        },
        (error) => {
          // Fallback coordinates (approximate for Algeria/North Africa)
          setQibla(62) // Approximate bearing from North Africa region
        }
      )
    } else {
      setQibla(62) // Fallback for North Africa
    }
  }, [])

  const heure = time.getHours()
  const minutes = String(time.getMinutes()).padStart(2, '0')
  const heureStr = `${heure}:${minutes}`

  let salutAr = 'تصبح على خير'
  let salutFr = 'Bonsoir'
  if (heure < 12) {
    salutAr = 'السلام عليكم ورحمة الله وبركاته'
    salutFr = 'Bonjour'
  }
  else if (heure < 18) {
    salutAr = 'السلام عليكم ورحمة الله'
    salutFr = 'Bon après-midi'
  }

  const dayNum = time.getDay()
  const gregorianDate = `${time.getDate().toString().padStart(2, '0')}/${(time.getMonth() + 1).toString().padStart(2, '0')}/${time.getFullYear()}`
  
  const hijri = toHijri(time)
  const hijriDateStr = `${hijri.day} ${HIJRI_MONTHS[hijri.month]} ${hijri.year} ه`
  const arabicDate = `${ARABIC_DAYS[dayNum]} ${time.getDate()} ${ARABIC_MONTHS[time.getMonth()]}`

  return (
    <div className={`px-4 pt-12 pb-6 ${isDark ? 'bg-slate-900/85' : 'bg-gradient-to-br from-green-deep via-green-deep to-green-mid'} text-ivory relative overflow-hidden`}>
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/3 rounded-full blur-3xl" />
      
      <div className="relative z-10 animate-fadeUp space-y-2.5 overflow-y-auto max-h-screen">
        {/* Logo + Greeting - Expanded */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="sm" />
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold">وird</h1>
              <p className="text-ivory/80 text-xs font-body truncate">القراءة الروحية</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display text-lg font-bold leading-snug">{salutAr}</p>
            <p className="text-ivory/80 text-xs mt-1">{salutFr}</p>
          </div>
        </div>

        {/* Dates: Gregorian + Arabic + Time - Expanded */}
        <div className="grid grid-cols-3 gap-2">
          {/* Gregorian Date */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center animate-slideUp">
            <p className="text-ivory/70 text-[10px] uppercase font-bold mb-1">الميلاد</p>
            <p className="font-display text-sm font-bold text-ivory truncate">{gregorianDate}</p>
          </div>

          {/* Hijri Date */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center animate-slideUp" style={{animationDelay: '0.05s'}}>
            <p className="text-ivory/70 text-[10px] uppercase font-bold mb-1">الهجري</p>
            <p className="font-display text-sm font-bold text-ivory truncate text-right">{hijriDateStr}</p>
          </div>

          {/* Clock */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center animate-slideUp" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
              <Clock size={12} className="text-gold flex-shrink-0" />
              <p className="text-ivory/70 text-[10px] uppercase font-bold flex-shrink-0">الوقت</p>
            </div>
            <p className="font-display text-lg font-bold text-gold">{heureStr}</p>
          </div>
        </div>

        {/* Qibla Compass - Compact */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center animate-slideUp" style={{animationDelay: '0.15s'}}>
          <p className="text-ivory/70 text-[10px] uppercase font-bold mb-2">القبلة</p>
          <div className="flex items-center justify-center">
            <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
              {/* Compass circle */}
              <div className="absolute inset-0 rounded-full border-2 border-gold/40" />
              {/* Cardinal directions */}
              <span className="absolute top-1 text-[7px] text-gold/60 font-bold">N</span>
              <span className="absolute bottom-1 text-[7px] text-gold/60 font-bold">S</span>
              <span className="absolute left-1 text-[7px] text-gold/60 font-bold">W</span>
              <span className="absolute right-1 text-[7px] text-gold/60 font-bold">E</span>
              
              {/* Arrow pointing to Qibla */}
              {qibla !== null && (
                <div 
                  className="absolute transition-transform duration-500"
                  style={{ transform: `rotate(${qibla}deg)` }}
                >
                  <svg width="12" height="22" viewBox="0 0 12 22" style={{marginLeft: '-6px', marginTop: '-11px'}}>
                    {/* Arrow shaft */}
                    <line x1="6" y1="8" x2="6" y2="20" stroke="#C49A28" strokeWidth="2" strokeLinecap="round" />
                    {/* Arrow head - triangle pointing up */}
                    <polygon points="6,3 2,10 10,10" fill="#C49A28" />
                    {/* Center dot */}
                    <circle cx="6" cy="11" r="1.5" fill="#C49A28" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          <p className="text-gold text-sm font-bold mt-2">{qibla ? `${qibla}°` : '...'}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const kamils = useLiveQuery(() => db.kamils.toArray(), []) || []
  const dailyKamils = useLiveQuery(() => db.dailyKamils.toArray(), []) || []
  const readings = useLiveQuery(() => db.readings.toArray(), []) || []
  const dailyKamilLogs = useLiveQuery(() => db.dailyKamilLogs.toArray(), []) || []
  const khassidas = useLiveQuery(() => db.khassidas.toArray(), []) || []
  const khassidaLogs = useLiveQuery(() => db.khassidaLogs.toArray(), []) || []

  const todayStr = new Date().toISOString().split('T')[0]

  // Active kamils (réguliers)
  const activeKamils = kamils.filter(k => {
    const readJuzz = [...new Set(readings.filter(r => r.kamilId === k.id).map(r => r.juzzNumber))]
    const total = k.type === 'collectif' ? (k.assignedJuzz?.length || 0) : 30
    return readJuzz.length < total
  })

  // Active kamils quotidiens
  const activeDailyKamils = dailyKamils.filter(dk => {
    const daysInPeriod = Math.ceil((new Date(dk.endDate) - new Date(dk.startDate)) / (1000 * 60 * 60 * 24)) + 1
    const logged = dailyKamilLogs.filter(l => l.dailyKamilId === dk.id).length
    return logged < daysInPeriod && dk.startDate <= todayStr
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

  const totalTasks = activeKamils.length + activeDailyKamils.length + activeKhassidas.length
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

        {/* Active Kamils (réguliers + quotidiens) */}
        {(activeKamils.filter(k => !isOverdue(k.endDate) && daysUntil(k.endDate) > 3).length > 0 || activeDailyKamils.length > 0) && (
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
              {activeKamils.filter(k => !isOverdue(k.endDate) && daysUntil(k.endDate) > 3).slice(0, 2).map(k => {
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
              {activeDailyKamils.slice(0, 2).map(dk => {
                const logs = dailyKamilLogs.filter(l => l.dailyKamilId === dk.id)
                const daysInPeriod = Math.ceil((new Date(dk.endDate) - new Date(dk.startDate)) / (1000 * 60 * 60 * 24)) + 1
                const pct = daysInPeriod > 0 ? Math.round((logs.length / daysInPeriod) * 100) : 0
                const todayLogged = logs.some(l => l.date === todayStr)
                return (
                  <DailyKamilCard
                    key={`daily-${dk.id}`}
                    kamil={dk}
                    logged={logs.length}
                    total={daysInPeriod}
                    pct={pct}
                    todayLogged={todayLogged}
                    onClick={() => navigate(`/kamils-daily/${dk.id}`)}
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
      
      <BottomNav />
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

function DailyKamilCard({ kamil, logged, total, pct, todayLogged, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left card p-4 flex items-center gap-4 transition-all active:scale-[0.98] border-l-4 border-gold-dark"
    >
      <ProgressRing percent={pct} size={56} stroke={4} color="#1A3828" bg="#E8DCC4">
        <span className="text-xs font-bold text-green-deep">{pct}%</span>
      </ProgressRing>
      <div className="flex-1 min-w-0">
        <p className="font-body font-bold text-green-deep truncate">{kamil.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{logged} / {total} jours · Juzz {kamil.defaultJuzz}</p>
        <span className="inline-block mt-1 px-2 py-0.5 bg-gold/20 text-gold-dark text-[10px] rounded-full">Quotidien</span>
      </div>
      <span className={`badge text-[10px] font-bold shrink-0 ${todayLogged ? 'badge-green' : 'badge-gold'}`}>
        {todayLogged ? '✓ Fait' : 'À faire'}
      </span>
    </button>
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
