import { Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function Topbar() {
  const { dark, toggle } = useTheme()

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 h-14 lg:hidden"
      style={{ background: 'var(--bg-card)', borderBottom: '0.5px solid var(--border)' }}
    >
      <div>
        <span className="font-display font-semibold text-base text-brand">Sky View</span>
        <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>Mahabaleshwar</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={toggle} className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Bell size={18} />
        </button>
      </div>
    </header>
  )
}
