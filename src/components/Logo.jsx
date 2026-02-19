export default function Logo({ size = 'sm' }) {
  const sizeClass = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-4xl',
  }[size]

  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-dark text-ivory font-display font-bold`}>
       و
    </div>
  )
}
