import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function ProtectedRoute({ children }) {
  const location = useLocation()
  const { loading, session } = useAuth()

  if (loading) {
    return (
      <main className="grid min-h-svh place-items-center bg-stone-50 px-4 text-stone-700">
        <p className="text-sm font-medium">Preparando tu espacio docente...</p>
      </main>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return children
}
