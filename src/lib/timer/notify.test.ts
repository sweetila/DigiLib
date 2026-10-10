import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestDesktopPermission, showDesktopNotification } from './notify'

describe('desktop notifications', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns unsupported when Notification is unavailable', async () => {
    vi.stubGlobal('Notification', undefined)
    await expect(requestDesktopPermission()).resolves.toBe('unsupported')
    expect(() => showDesktopNotification('Timer', 'Done')).not.toThrow()
  })

  it('requests permission and only shows while the page is not focused', async () => {
    const notify = vi.fn()
    class MockNotification {
      static permission = 'granted'
      static requestPermission = vi.fn(async () => 'granted')
      constructor(...args: ConstructorParameters<typeof Notification>) {
        notify(...args)
      }
    }
    vi.stubGlobal('Notification', MockNotification)
    Object.defineProperty(document, 'hidden', { configurable: true, value: false })
    Object.defineProperty(document, 'hasFocus', { configurable: true, value: () => true })
    expect(await requestDesktopPermission()).toBe('granted')
    showDesktopNotification('Timer', 'Done')
    expect(notify).not.toHaveBeenCalled()
    Object.defineProperty(document, 'hasFocus', { configurable: true, value: () => false })
    showDesktopNotification('Timer', 'Done')
    expect(notify).toHaveBeenCalledOnce()
  })
})
