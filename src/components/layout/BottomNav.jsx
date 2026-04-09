import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UserPlus, BedDouble, Users, Menu } from 'lucide-react'

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/checkin', icon: UserPlus, label: 'Check-in' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/guests', icon: Users, label: 'Guests' },
]

export default function BottomNav({ onMore }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 lg:hidden flex items-center"
      style={{
        background: 'var(--bg-card)',
        borderTop: '0.5px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[56px] justify-center transition-colors ${
              isActive ? 'text-brand' : ''
            }`
          }
          style={({ isActive }) => ({ color: isActive ? '#6C8EF7' : 'var(--text-muted)' })}
        >
          <Icon size={22} />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
      <button
        onClick={onMore}
        className="flex-1 flex flex-col items-center gap-0.5 py-2 min-h-[56px] justify-center transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <Menu size={22} />
        <span className="text-[10px] font-medium">More</span>
      </button>
    </nav>
  )
}
