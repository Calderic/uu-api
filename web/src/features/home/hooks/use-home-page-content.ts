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
import i18next from 'i18next'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { isHttpUrl } from '@/lib/content-format'

import { getHomePageContent } from '../api'
import {
  readCachedHomePageContent,
  writeCachedHomePageContent,
} from '../lib/home-page-cache'
import type { HomePageContentResult } from '../types'

/**
 * Hook to load and manage custom home page content
 * Supports both Markdown/HTML content and iframe URLs
 */
export function useHomePageContent(): HomePageContentResult {
  const storage =
    typeof window === 'undefined' ? undefined : window.localStorage
  const [content, setContent] = useState(() =>
    readCachedHomePageContent(storage)
  )

  useEffect(() => {
    let mounted = true

    const loadContent = async () => {
      try {
        const response = await getHomePageContent()
        const { success, data } = response

        if (!mounted) return

        if (success && data) {
          setContent(data)
          writeCachedHomePageContent(storage, data)
        } else {
          setContent('')
          writeCachedHomePageContent(storage, '')
        }
      } catch (error) {
        if (!mounted) return
        // eslint-disable-next-line no-console
        console.error('Failed to load home page content:', error)
        toast.error(i18next.t('Failed to load home page content'))
      }
    }

    void loadContent()

    return () => {
      mounted = false
    }
  }, [storage])

  const isUrl = isHttpUrl(content)

  return { content, isUrl }
}
