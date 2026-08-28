import { zodResolver } from '@hookform/resolvers/zod'
import { BookOpenCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../hooks/useAuth'
import { signInWithEmail, signUpWithEmail } from '../services/authService'

const authSchema = z.object({
  email: z.email('Ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export function AuthPage() {
  const [mode, setMode] = useState('login')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  })

  if (session) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(values) {
    setFormError('')
    setNotice('')

    try {
      if (mode === 'login') {
        await signInWithEmail(values)
        navigate(from, { replace: true })
        return
      }

      const data = await signUpWithEmail(values)

      if (data.session) {
        navigate('/perfil', { replace: true })
      } else {
        setNotice('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.')
      }
    } catch (error) {
      setFormError(error.message || 'No pudimos completar la autenticación.')
    }
  }

  return (
    <main className="grid min-h-svh bg-stone-50 px-4 py-8 text-stone-950 lg:grid-cols-[1fr_460px] lg:p-0">
      <section className="hidden min-h-svh flex-col justify-between bg-emerald-800 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-md bg-white text-emerald-800">
            <BookOpenCheck size={24} />
          </span>
          <span className="text-lg font-semibold">PlaneaDoc</span>
        </div>
        <div className="max-w-2xl">
          <p className="mb-5 text-sm font-medium uppercase tracking-wide text-emerald-100">
            Planeaciones didácticas
          </p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">
            Organiza tu práctica docente desde un solo lugar.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-emerald-50">
            Crea perfiles, guarda datos institucionales y prepara la información para generar
            planeaciones listas para exportar.
          </p>
        </div>
        <p className="text-sm text-emerald-100">Supabase Auth + React + Tailwind CSS</p>
      </section>

      <section className="mx-auto flex w-full max-w-md flex-col justify-center lg:px-10">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <BookOpenCheck size={28} className="text-emerald-700" />
          <span className="text-lg font-semibold">PlaneaDoc</span>
        </div>

        <div className="rounded-md border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </h1>
            <p className="mt-2 text-sm text-stone-500">Accede con tu correo institucional o personal.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="block">
              <span className="text-sm font-medium text-stone-700">Correo electrónico</span>
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                {...register('email')}
              />
              {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email.message}</span>}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">Contraseña</span>
              <input
                type="password"
                className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                {...register('password')}
              />
              {errors.password && (
                <span className="mt-1 block text-xs text-red-600">{errors.password.message}</span>
              )}
            </label>

            {formError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
            {notice && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((current) => (current === 'login' ? 'signup' : 'login'))
              setFormError('')
              setNotice('')
            }}
            className="mt-5 w-full text-sm font-medium text-emerald-800 hover:text-emerald-950"
          >
            {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}
          </button>
        </div>
      </section>
    </main>
  )
}
