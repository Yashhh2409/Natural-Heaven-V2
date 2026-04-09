import { X } from 'lucide-react'

export default function Lightbox({ src, alt, onClose }) {
  if (!src) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white p-2" onClick={onClose}>
        <X size={24} />
      </button>
      <img
        src={src}
        alt={alt || 'Image'}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}
