import { Link } from 'react-router-dom'
import { Home, MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl font-display font-semibold text-brand opacity-30">404</div>
      <MapPin size={40} className="text-brand opacity-40" />
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary flex items-center gap-2">
        <Home size={16} /> Back to Dashboard
      </Link>
    </div>
  )
}
