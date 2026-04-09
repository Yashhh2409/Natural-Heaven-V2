import { useEffect } from 'react'

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full card rounded-b-none slide-up max-h-[90vh] overflow-y-auto">
        <div className="pt-3 pb-1 px-4">
          <div className="bottom-sheet-handle" />
          {title && <h2 className="font-semibold text-base mb-4">{title}</h2>}
        </div>
        <div className="px-4 pb-8">{children}</div>
      </div>
    </div>
  )
}
