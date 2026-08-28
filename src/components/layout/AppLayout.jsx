import { BookOpenCheck, Download, LayoutDashboard, LogOut, UserRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { NetworkStatusBanner } from '../common/NetworkStatusBanner'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { signOut } from '../../features/auth/services/authService'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Planeaciones', icon: LayoutDashboard },
  { to: '/perfil', label: 'Perfil docente', icon: UserRound },
]

export function AppLayout() {
  const { user } = useAuth()
  const { canInstall, install } = usePwaInstall()

  return (
    <div className="min-h-svh bg-stone-50 text-stone-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-stone-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-stone-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-emerald-700 text-white">
                <BookOpenCheck size={22} />
              </span>
              <div>
                <p className="text-sm font-semibold">PlaneaDoc</p>
                <p className="text-xs text-stone-500">Gestión didáctica</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950',
                    isActive && 'bg-emerald-50 text-emerald-800',
                  )
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-stone-200 p-4">
            <p className="mb-3 truncate text-xs text-stone-500">{user?.email}</p>
            {canInstall && (
              <button
                type="button"
                onClick={install}
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                <Download size={16} />
                Instalar app
              </button>
            )}
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              <LogOut size={16} />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpenCheck size={22} className="text-emerald-700" />
              <span className="text-sm font-semibold">PlaneaDoc</span>
            </div>
            <div className="flex items-center gap-1">
              {canInstall && (
                <button type="button" onClick={install} className="rounded-md p-2 text-emerald-700" aria-label="Instalar app">
                  <Download size={18} />
                </button>
              )}
              <button type="button" onClick={signOut} className="rounded-md p-2 text-stone-600" aria-label="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <nav className="mt-3 grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-stone-600',
                    isActive ? 'bg-emerald-700 text-white' : 'bg-stone-100',
                  )
                }
              >
                <item.icon size={15} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <NetworkStatusBanner />

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
