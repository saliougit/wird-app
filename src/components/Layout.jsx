import { useNavigate } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import BottomNav from './BottomNav'
import IslamicDecor from './IslamicDecor'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children, title, back, actions }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  return (
    <div className={`flex flex-col min-h-dvh ${isDark ? 'bg-slate-950' : 'bg-ivory'} relative overflow-hidden`}>
      {/* Islamic decorative elements - background layer */}
      <IslamicDecor />
      
      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-dvh">
        {title && (
          <header
            className={`sticky top-0 z-30 px-4 pb-5 ${isDark ? 'bg-gradient-to-b from-slate-900 to-slate-800 text-gray-100' : 'bg-gradient-to-b from-green-deep to-green-mid text-ivory'}`}
            style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
          >
            <div className="flex items-center gap-3 mt-2">
              {back && (
                <button
                  onClick={() => navigate(-1)}
                  className={`btn-icon ${isDark ? 'text-gray-300 hover:bg-slate-700' : 'text-dark-green hover:bg-gold/10'} -ml-2 transition-colors`}
                >
                  <CaretLeft size={22} weight="bold" />
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h1 className={`font-display text-2xl ${isDark ? 'text-gray-100' : 'text-dark-green'} leading-tight truncate`}>{title}</h1>
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
    </div>
  )
}


