/**
 * Simple stats chart component using CSS bars
 */
export default function StatsChart({ title, data, color = 'gold' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  const colorClass = {
    gold: 'bg-gold',
    green: 'bg-green-mid',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
  }[color] || 'bg-gold'

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h3 className="section-title">{title}</h3>
      </div>

      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="animate-fadeUp" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="flex items-end justify-between mb-1">
              <span className="text-xs font-body font-bold text-green-deep">{item.label}</span>
              <span className="text-sm font-bold text-gold">{item.value}{item.unit || ''}</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Weekly activity sparkline chart
 */
export function WeeklyChart({ title, data }) {
  const max = Math.max(...data, 1)
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="card p-5">
      <h3 className="section-title mb-4">{title}</h3>
      <div className="flex items-end justify-between h-24 gap-2">
        {data.map((count, idx) => (
          <div
            key={idx}
            className="flex-1 flex flex-col items-center justify-end"
            title={`${days[idx]}: ${count} activités`}
          >
            <div
              className="w-full bg-gradient-to-t from-gold to-gold/60 rounded-t transition-all hover:brightness-110 cursor-default"
              style={{
                height: `${count > 0 ? (count / max) * 100 : 8}%`,
                minHeight: count === 0 ? '4px' : 'auto'
              }}
            />
            <span className="text-[9px] text-gray-500 mt-1 font-bold">{days[idx]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Category breakdown pie-like chart
 */
export function CategoryChart({ title, categories }) {
  const total = Object.values(categories).reduce((a, b) => a + b, 0) || 1
  const colors = {
    Personnel: 'bg-blue-500',
    Collectif: 'bg-purple-500',
    Wirds: 'bg-gold',
    Terminés: 'bg-green-mid',
  }

  return (
    <div className="card p-5">
      <h3 className="section-title mb-4">{title}</h3>
      <div className="space-y-3">
        {Object.entries(categories).map(([name, count], idx) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const colorClass = colors[name] || 'bg-gray-400'

          return (
            <div key={idx} className="animate-fadeUp" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                  <span className="text-xs font-body font-bold text-gray-700">{name}</span>
                </div>
                <span className="text-sm font-bold text-green-deep">{count}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
