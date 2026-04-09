import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, trend, trendLabel, icon: Icon, color = 'text-brand' }) {
  const isPositive = trend >= 0
  return (
    <div className="card p-4 min-w-[150px] flex-1 fade-in">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
        {Icon && <Icon size={16} className={color} />}
      </div>
      <p className="text-3xl font-display font-semibold">{value}</p>
      {trendLabel && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? 'text-green-500' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  )
}
