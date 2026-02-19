import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'

export default function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-green-deep/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-parchment rounded-t-2xl sm:rounded-sm shadow-2xl animate-fadeUp max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ivory-darker shrink-0">
          <h2 className="font-display text-lg text-green-deep font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="btn-icon text-green-mid hover:text-green-deep hover:bg-green-soft"
          >
            <X size={20} weight="bold" />
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-ivory-darker shrink-0 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
