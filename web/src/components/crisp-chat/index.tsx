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
import { useLocation } from '@tanstack/react-router'
import { useEffect } from 'react'

import {
  isCrispChatSuppressedPath,
  loadCrispChat,
  scheduleCrispChatLoad,
  setCrispChatVisibility,
} from './crisp-chat'

type CrispChatProps = {
  enabled: boolean
  websiteId: string
}

export function CrispChat(props: CrispChatProps) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const websiteId = props.websiteId.trim()

  useEffect(() => {
    const shouldHide =
      !props.enabled || !websiteId || isCrispChatSuppressedPath(pathname)

    if (shouldHide) {
      setCrispChatVisibility(false)
      return
    }

    return scheduleCrispChatLoad(() => {
      loadCrispChat(websiteId)
    })
  }, [pathname, props.enabled, websiteId])

  return null
}
