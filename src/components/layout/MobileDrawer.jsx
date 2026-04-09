import { Link } from 'react-router-dom'
import { Users, BarChart2, Receipt, Settings, LogOut, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const items = [
  { to: '/current', icon: Users, label: 'Current Guests' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function MobileDrawer({ open, onClose }) {
  const { signOut } = useAuth()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full card rounded-b-none slide-up">
        <div className="pt-3 pb-1 px-4 flex items-center justify-between">
          <div className="bottom-sheet-handle flex-1" />
        </div>
        <div className="px-4 pb-8 space-y-1">
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>MORE OPTIONS</p>
          {items.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <Icon size={20} className="text-brand" />
              <span className="font-medium text-sm">{label}</span>
            </Link>
          ))}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => { signOut(); onClose() }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500"
            >
              <LogOut size={20} />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
