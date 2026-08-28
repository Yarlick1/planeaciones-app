import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/hooks/useAuth'
import { getTeacherProfile, isTeacherProfileComplete } from '../services/profileService'

const allowedWithoutProfile = ['/perfil']

export function ProfileCompletionGuard() {
  const { user } = useAuth()
  const location = useLocation()
  const [state, setState] = useState({
    checkedPath: '',
    complete: false,
    loading: true,
  })

  useEffect(() => {
    let mounted = true

    async function checkProfile() {
      if (allowedWithoutProfile.includes(location.pathname)) {
        setState({ checkedPath: location.pathname, complete: true, loading: false })
        return
      }

      setState((current) => ({
        ...current,
        checkedPath: location.pathname,
        loading: true,
      }))

      try {
        const profileData = await getTeacherProfile(user.id)

        if (!mounted) return

        setState({
          checkedPath: location.pathname,
          complete: isTeacherProfileComplete(profileData),
          loading: false,
        })
      } catch {
        if (!mounted) return

        setState({
          checkedPath: location.pathname,
          complete: false,
          loading: false,
        })
      }
    }

    checkProfile()

    return () => {
      mounted = false
    }
  }, [location.pathname, user.id])

  if (state.loading || state.checkedPath !== location.pathname) {
    return <p className="text-sm text-stone-600">Validando configuración docente...</p>
  }

  if (!state.complete) {
    return <Navigate to="/perfil" replace state={{ reason: 'profile_required' }} />
  }

  return <Outlet />
}
