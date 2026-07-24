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
import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useStatus } from '@/hooks/use-status'

import { homeLayoutClasses } from './home-layout'

const API_PATHS = [
  'chat/completions',
  'responses',
  'images/generations',
  'audio/transcriptions',
] as const

export function HeroEndpoint() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })
  const [activePathIndex, setActivePathIndex] = useState(0)

  const serverAddress = useMemo(() => {
    const configuredAddress =
      (status?.server_address as string | undefined) ??
      (status?.serverAddress as string | undefined) ??
      status?.data?.server_address ??
      (status?.data as Record<string, unknown> | undefined)?.serverAddress

    if (typeof configuredAddress === 'string' && configuredAddress.trim()) {
      return configuredAddress.trim().replace(/\/+$/, '')
    }
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }, [status])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    const intervalId = window.setInterval(() => {
      setActivePathIndex((current) => (current + 1) % API_PATHS.length)
    }, 2800)

    return () => window.clearInterval(intervalId)
  }, [])

  const isCopied = copiedText === serverAddress

  return (
    <div>
      <div className='mb-4 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--home-muted)] uppercase'>
        <span
          aria-hidden='true'
          className='size-1.5 rounded-full bg-[var(--home-accent)] shadow-[0_0_0_4px_color-mix(in_oklch,var(--home-accent)_14%,transparent)]'
        />
        {t('Global API endpoint')}
      </div>

      <div className={homeLayoutClasses.endpoint}>
        <div className='flex min-w-0 items-center gap-2 px-4 py-3 sm:py-0'>
          <code className='min-w-0 flex-1 truncate font-mono text-xs font-medium sm:max-w-[25rem]'>
            {serverAddress}
          </code>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='shrink-0 rounded-md'
            aria-label={t('Copy API endpoint')}
            onClick={() => void copyToClipboard(serverAddress)}
          >
            <HugeiconsIcon
              data-icon='inline-start'
              icon={isCopied ? Tick02Icon : Copy01Icon}
              strokeWidth={2}
            />
            {isCopied ? t('Copied') : t('Copy')}
          </Button>
        </div>

        <div className='flex min-h-11 items-center border-t border-[var(--home-line)] bg-[var(--home-tint)] px-4 font-mono text-xs sm:min-w-48 sm:border-t-0 sm:border-l'>
          <span className='text-[var(--home-muted)]'>/v1/</span>
          <span className='ml-1 truncate'>{API_PATHS[activePathIndex]}</span>
          <span
            aria-hidden='true'
            className='home-terminal-caret ml-0.5 text-[var(--home-accent)]'
          >
            |
          </span>
        </div>
      </div>
    </div>
  )
}
