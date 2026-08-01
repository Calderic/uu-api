/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
const CRISP_SCRIPT_ID = 'crisp-chat-script'
const CRISP_SCRIPT_SRC = 'https://client.crisp.chat/l.js'

type CrispCommand = [string, string, ...unknown[]]

declare global {
  interface Window {
    $crisp?: CrispCommand[]
    CRISP_WEBSITE_ID?: string
  }
}

export function isCrispChatSuppressedPath(pathname: string): boolean {
  return pathname === '/'
}

export function setCrispChatVisibility(visible: boolean): void {
  if (typeof window === 'undefined' || !Array.isArray(window.$crisp)) return

  window.$crisp.push(['do', visible ? 'chat:show' : 'chat:hide'])
}

function resetCrispChat(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  setCrispChatVisibility(false)
  document.querySelector(`#${CRISP_SCRIPT_ID}`)?.remove()
  document.querySelector('#crisp-client')?.remove()
  window.$crisp = []
  delete window.CRISP_WEBSITE_ID
}

export function loadCrispChat(websiteId: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const normalizedWebsiteId = websiteId.trim()
  if (!normalizedWebsiteId) return

  const script = document.querySelector(`#${CRISP_SCRIPT_ID}`)
  if (script && window.CRISP_WEBSITE_ID === normalizedWebsiteId) {
    setCrispChatVisibility(true)
    return
  }

  if (script || window.CRISP_WEBSITE_ID) {
    resetCrispChat()
  }

  window.$crisp = Array.isArray(window.$crisp) ? window.$crisp : []
  window.CRISP_WEBSITE_ID = normalizedWebsiteId

  const crispScript = document.createElement('script')
  crispScript.id = CRISP_SCRIPT_ID
  crispScript.src = CRISP_SCRIPT_SRC
  crispScript.async = true
  document.head.appendChild(crispScript)
}

type IdleCallback = () => void

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleCallback,
    options?: { timeout: number }
  ) => number
  cancelIdleCallback?: (handle: number) => void
}

export function scheduleCrispChatLoad(callback: IdleCallback): () => void {
  if (typeof window === 'undefined') return () => undefined

  const idleWindow = window as IdleWindow
  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(callback, { timeout: 2000 })
    return () => idleWindow.cancelIdleCallback?.(handle)
  }

  const handle = window.setTimeout(callback, 0)
  return () => window.clearTimeout(handle)
}
