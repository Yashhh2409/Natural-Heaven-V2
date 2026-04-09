import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UserPlus, BedDouble, Users, UserCheck, BarChart2, Settings, LogOut, Sun, Moon, Leaf } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/checkin', icon: UserPlus, label: 'Check-in' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/guests', icon: Users, label: 'Guests' },
  { to: '/current', icon: UserCheck, label: 'Current Guests' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { signOut } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[220px] z-30"
      style={{ background: 'var(--bg-card)', borderRight: '0.5px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
            <Leaf size={18} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold text-lg leading-tight">Sky View</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Mahabaleshwar</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand text-white'
                  : 'hover:bg-black/5 dark:hover:bg-white/5'
              }`
            }
            style={({ isActive }) => ({ color: isActive ? '#fff' : 'var(--text)' })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t space-y-0.5" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          style={{ color: 'var(--text)' }}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
