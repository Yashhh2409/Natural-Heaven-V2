export default function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 fade-in">
      {Icon && <Icon size={40} className="opacity-20" />}
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
      {action}
    </div>
  )
}
