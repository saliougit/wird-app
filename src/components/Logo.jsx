export default function Logo({ size = 'sm' }) {
  const sizeClass = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
  }[size]

  const textSize = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }[size]

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-ivory font-display font-bold`}>
      <span className={`${textSize} leading-none`}>وird</span>
    </div>
  )
}
