import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import BottomNav from './BottomNav'
import Logo from './Logo'

export default function Layout({ children, title, back, actions }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-dvh bg-ivory">
      {title && (
        <header className="page-header sticky top-0 z-30">
          <div className="flex items-center gap-3 mt-4">
            {back && (
              <button
                onClick={() => navigate(-1)}
                className="btn-icon text-dark-green hover:bg-gold/10 -ml-2 transition-colors"
              >
                <ArrowLeft size={22} weight="bold" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl text-dark-green leading-tight truncate">{title}</h1>
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </div>
        </header>
      )}

      <main className="flex-1 pb-nav">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
