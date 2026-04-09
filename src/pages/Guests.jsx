import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Users, ChevronRight, ShieldCheck, ShieldX } from 'lucide-react'
import { useGuests } from '../hooks/useGuests'
import Spinner from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { formatDate } from '../lib/formatters'

function getInitials(name) {
  return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

const PAGE_SIZE = 10

export default function Guests() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const { guests, loading } = useGuests(query)

  const paginated = guests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(guests.length / PAGE_SIZE)

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(search)
    setPage(1)
  }

  return (
    <div className="page-container">
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold">Guests</h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{guests.length} total guests</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="input-field pl-9 pr-20"
          placeholder="Search name, mobile, ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1.5 px-3 text-xs">
          Search
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size={28} /></div>
      ) : guests.length === 0 ? (
        <EmptyState icon={Users} message={query ? 'No guests found for your search' : 'No guests yet'} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {['Guest', 'Mobile', 'ID Type', 'City', 'Verified', 'Since'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map(g => (
                  <tr key={g.id} className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors" style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-xs font-semibold">
                          {getInitials(g.full_name)}
                        </div>
                        <span className="font-medium">{g.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{g.mobile}</td>
                    <td className="px-4 py-3"><span className="badge badge-active capitalize">{g.id_type?.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{g.city || '—'}</td>
                    <td className="px-4 py-3">
                      {g.is_mobile_verified
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><ShieldCheck size={10} /> Yes</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><ShieldX size={10} /> No</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>{formatDate(g.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/guests/${g.id}`} className="p-1.5 rounded-lg hover:bg-brand/10 text-brand flex items-center justify-center w-8 h-8">
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {paginated.map(g => (
              <Link key={g.id} to={`/guests/${g.id}`} className="card p-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform block">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {getInitials(g.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{g.full_name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {g.mobile} · {g.city || 'India'}
                  </p>
                  <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
                    {g.id_type?.replace('_', ' ')} · {formatDate(g.created_at)}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">← Prev</button>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
