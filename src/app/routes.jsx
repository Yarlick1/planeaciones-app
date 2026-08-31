import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PageLoader } from '../components/common/PageLoader'
import { ProtectedRoute } from '../components/common/ProtectedRoute'
import { AppLayout } from '../components/layout/AppLayout'
import { ProfileCompletionGuard } from '../features/profile/components/ProfileCompletionGuard'

const AuthPage = lazy(() => import('../features/auth/pages/AuthPage').then((module) => ({ default: module.AuthPage })))
const DashboardPage = lazy(() =>
  import('../features/planners/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const AiPlannerWizardPage = lazy(() =>
  import('../features/aiPlanner/pages/AiPlannerWizardPage').then((module) => ({ default: module.AiPlannerWizardPage })),
)
const PlannerDetailPage = lazy(() =>
  import('../features/planners/pages/PlannerDetailPage').then((module) => ({ default: module.PlannerDetailPage })),
)
const PlannerFormPage = lazy(() =>
  import('../features/planners/pages/PlannerFormPage').then((module) => ({ default: module.PlannerFormPage })),
)
const ProfilePage = lazy(() =>
  import('../features/profile/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader message="Cargando pantalla..." />}>{children}</Suspense>
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <LazyPage>
              <AuthPage />
            </LazyPage>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route
            path="perfil"
            element={
              <LazyPage>
                <ProfilePage />
              </LazyPage>
            }
          />
          <Route element={<ProfileCompletionGuard />}>
            <Route
              path="dashboard"
              element={
                <LazyPage>
                  <DashboardPage />
                </LazyPage>
              }
            />
            <Route
              path="planeaciones/asistente"
              element={
                <LazyPage>
                  <AiPlannerWizardPage />
                </LazyPage>
              }
            />
            <Route
              path="planeaciones/nueva"
              element={
                <LazyPage>
                  <PlannerFormPage />
                </LazyPage>
              }
            />
            <Route
              path="planeaciones/:id"
              element={
                <LazyPage>
                  <PlannerDetailPage />
                </LazyPage>
              }
            />
            <Route
              path="planeaciones/:id/editar"
              element={
                <LazyPage>
                  <PlannerFormPage />
                </LazyPage>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
