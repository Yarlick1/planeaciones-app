import { AppRoutes } from './app/routes'
import { AuthProvider } from './features/auth/hooks/AuthProvider'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
