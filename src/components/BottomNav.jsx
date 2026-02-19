import { NavLink } from 'react-router-dom'
import { House, BookOpen, Flame, GearSix } from '@phosphor-icons/react'

const NAV_ITEMS = [
  { to: '/',          label: 'Accueil',   Icon: House      },
  { to: '/kamils',    label: 'Kamils',    Icon: BookOpen   },
  { to: '/khassidas', label: 'Wirds',     Icon: Flame      },
  { to: '/settings',  label: 'Réglages',  Icon: GearSix    },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-ivory border-t border-gold/20 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all ${
                isActive 
                  ? 'text-gold bg-gold/5 border-t-2 border-gold' 
                  : 'text-dark-green/60 hover:text-dark-green hover:bg-gold/3'
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
      </div>
    </nav>
  )
}
