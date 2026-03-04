'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart2, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Resumen', icon: BarChart2 },
  { href: '/income', label: 'Ingresos', icon: TrendingUp },
  { href: '/expenses', label: 'Egresos', icon: TrendingDown },
  { href: '/providers', label: 'Clientes', icon: Users },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md border-t border-border" />
      <div className="relative flex items-center justify-around h-[62px] max-w-lg mx-auto px-6">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 min-w-[52px] min-h-[44px] justify-center"
            >
              <div className={cn(
                'flex items-center justify-center w-10 h-6 rounded-full transition-all duration-200',
                active ? 'bg-primary/15' : ''
              )}>
                <Icon className={cn(
                  'h-[18px] w-[18px] transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium transition-colors leading-none',
                active ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
      {/* Safe area for iPhone home indicator */}
      <div className="h-safe-area-inset-bottom bg-background/80" />
    </nav>
  )
}
