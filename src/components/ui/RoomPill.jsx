const colors = {
  vacant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
  occupied: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  cleaning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  maintenance: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
}

export default function RoomPill({ room, onClick }) {
  const cls = colors[room.status] || colors.vacant
  return (
    <button
      onClick={() => onClick?.(room)}
      className={`${cls} border rounded-xl px-3 py-2 text-xs font-medium flex flex-col items-center gap-0.5 min-w-[60px] active:scale-95 transition-transform`}
    >
      <span className="font-semibold text-sm">{room.room_number}</span>
      <span className="capitalize text-[10px] opacity-80">{room.status}</span>
    </button>
  )
}
