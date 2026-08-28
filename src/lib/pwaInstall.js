let deferredInstallPrompt = null

export function setupInstallPromptListener(onChange) {
  function handleBeforeInstallPrompt(event) {
    event.preventDefault()
    deferredInstallPrompt = event
    onChange?.(true)
  }

  function handleAppInstalled() {
    deferredInstallPrompt = null
    onChange?.(false)
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
  }
}

export async function promptPwaInstall() {
  if (!deferredInstallPrompt) return false

  deferredInstallPrompt.prompt()
  const result = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null

  return result.outcome === 'accepted'
}
