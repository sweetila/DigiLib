export type DesktopPermission = 'granted' | 'denied' | 'default' | 'unsupported'

export async function requestDesktopPermission(): Promise<DesktopPermission> {
  try {
    if (typeof Notification === 'undefined') return 'unsupported'
    return await Notification.requestPermission()
  } catch {
    return 'unsupported'
  }
}

export function showDesktopNotification(title: string, body: string): void {
  try {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    if (typeof document === 'undefined' || (!document.hidden && document.hasFocus())) return
    new Notification(title, { body })
  } catch {
    return
  }
}
