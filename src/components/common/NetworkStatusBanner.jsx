import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export function NetworkStatusBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-amber-950">
      <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm font-medium">
        <WifiOff size={16} />
        Sin conexión. Puedes revisar contenido en caché, pero guardar y exportar puede requerir internet.
      </div>
    </div>
  )
}
