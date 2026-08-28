import { useEffect, useState } from 'react'
import { promptPwaInstall, setupInstallPromptListener } from '../lib/pwaInstall'

export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => setupInstallPromptListener(setCanInstall), [])

  async function install() {
    const accepted = await promptPwaInstall()
    setCanInstall(false)
    return accepted
  }

  return { canInstall, install }
}
