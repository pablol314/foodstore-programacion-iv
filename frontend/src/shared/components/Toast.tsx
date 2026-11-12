import { useEffect } from 'react'

import { useNotificationStore } from '@/store/notificationStore'

export function Toast() {
  const message = useNotificationStore((state) => state.message)
  const visible = useNotificationStore((state) => state.visible)
  const hideNotification = useNotificationStore((state) => state.hideNotification)

  useEffect(() => {
    if (!visible) return
    const timeout = window.setTimeout(hideNotification, 3000)
    return () => window.clearTimeout(timeout)
  }, [message, visible, hideNotification])

  if (!visible || !message) return null
  return <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-forest px-5 py-4 text-sm font-semibold text-white shadow-xl">{message}</div>
}
