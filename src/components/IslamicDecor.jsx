import { useTheme } from '../context/ThemeContext'

export default function IslamicDecor() {
  const { isDark } = useTheme()
  
  return (
    <>
      <style>{`
        @keyframes rotateContinuous {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .islamic-star-rotate-0 { animation: rotateContinuous 25s linear infinite; }
        .islamic-star-rotate-1 { animation: rotateContinuous 30s linear infinite; }
        .islamic-star-rotate-2 { animation: rotateContinuous 20s linear infinite; }
        .islamic-star-rotate-3 { animation: rotateContinuous 28s linear infinite; }
        .islamic-star-rotate-4 { animation: rotateContinuous 22s linear infinite; }
        .islamic-star-rotate-5 { animation: rotateContinuous 26s linear infinite; }
        .islamic-star-rotate-6 { animation: rotateContinuous 24s linear infinite; }
        .islamic-star-rotate-7 { animation: rotateContinuous 29s linear infinite; }
      `}</style>
      
      {/* Multiple rotating stars scattered around page */}
      {[
        { top: '5%', left: '5%' },
        { top: '5%', right: '5%' },
        { bottom: '5%', left: '5%' },
        { bottom: '5%', right: '5%' },
        { top: '25%', right: '3%' },
        { bottom: '25%', left: '3%' },
        { top: '50%', left: '2%' },
        { top: '50%', right: '2%' },
      ].map((pos, idx) => (
        <svg 
          key={idx}
          className={`absolute w-16 h-16 islamic-star-rotate-${idx} opacity-5`}
          style={pos}
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 8-pointed star */}
          <g transform="translate(100, 100)">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = angle * Math.PI / 180
              const x2 = 90 * Math.cos(rad)
              const y2 = 90 * Math.sin(rad)
              return (
                <line 
                  key={angle}
                  x1="0" y1="0" 
                  x2={x2} y2={y2}
                  stroke={isDark ? '#C49A28' : '#1A3828'}
                  strokeWidth="1"
                  opacity="0.6"
                />
              )
            })}
            <circle cx="0" cy="0" r="30" fill="none" stroke={isDark ? '#C49A28' : '#1A3828'} strokeWidth="1" opacity="0.5"/>
            <circle cx="0" cy="0" r="12" fill={isDark ? '#C49A28' : '#1A3828'} opacity="0.4"/>
          </g>
        </svg>
      ))}
    </>
  )
}
