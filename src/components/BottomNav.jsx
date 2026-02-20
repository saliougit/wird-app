import { NavLink } from 'react-router-dom'
import { House, BookOpen, Flame, GearSix, Moon, Sun } from '@phosphor-icons/react'
import { useTheme } from '../context/ThemeContext'

const NAV_ITEMS = [
  { to: '/',          label: 'Accueil',   Icon: House      },
  { to: '/kamils',    label: 'Kamils',    Icon: BookOpen   },
  { to: '/khassidas', label: 'Wirds',     Icon: Flame      },
  { to: '/settings',  label: 'Réglages',  Icon: GearSix    },
]

export default function BottomNav() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-ivory/85 dark:bg-slate-900/85 backdrop-blur-xl border-t border-gold/20 dark:border-gold/10" />
      
      <div className="relative flex items-stretch max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all duration-300 ${
                isActive 
                  ? 'text-gold dark:text-gold bg-gold/10 dark:bg-gold/5 border-t-2 border-gold' 
                  : 'text-green-deep/60 dark:text-gray-400 hover:text-green-mid dark:hover:text-gray-200 hover:bg-gold/5 dark:hover:bg-gold/10'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
                <span className="text-[10px] tracking-wider font-medium mt-0.5">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex-1 flex flex-col items-center justify-center py-3 px-2 text-green-deep/60 dark:text-gray-400 hover:text-green-mid dark:hover:text-gray-200 transition-all duration-300"
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          {isDark ? (
            <Sun size={24} weight="fill" className="text-yellow-400" />
          ) : (
            <Moon size={24} weight="fill" className="text-slate-600" />
          )}
          <span className="text-[10px] tracking-wider font-medium mt-0.5">{isDark ? 'Jour' : 'Nuit'}</span>
        </button>
      </div>
    </nav>
  )
}
