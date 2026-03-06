import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePrivacyMode } from '@/hooks/usePrivacyMode'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Resumen' },
  { href: '/income', label: 'Ingresos' },
  { href: '/expenses', label: 'Egresos' },
  { href: '/providers', label: 'Clientes' },
]

export function TopBar() {
  const { isPrivate, toggle } = usePrivacyMode()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const supabase = createClient()

  const isLogin = pathname === '/login'

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" aria-label="Inicio">
            <svg viewBox="0 0 40 40" width="32" height="32" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="white" stroke="#e5e7eb" strokeWidth="1"/>
              <text x="20" y="29" fontFamily="Georgia, serif" fontSize="28" fontWeight="bold" fill="black" textAnchor="middle">$</text>
            </svg>
          </Link>

          {/* Desktop nav */}
          {!isLogin && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ href, label }) => {
                const active = pathname.startsWith(href)
                return (
                  <Link
                    key={href}
                    to={href}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {label}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>

        {!isLogin && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={isPrivate ? 'Mostrar números' : 'Ocultar números'}
            >
              {isPrivate ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
