import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import MobileDrawer from './MobileDrawer'
import Topbar from './Topbar'

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <Topbar />
     <main className="lg:ml-[220px] flex-1 flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>

        <p className="text-center text-sm text-gray-500 py-3 opacity-70">
          Designed & Built by © 2026 Yash Dhande
        </p>
      </main>
      <BottomNav onMore={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
