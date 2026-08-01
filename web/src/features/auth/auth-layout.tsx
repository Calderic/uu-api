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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeSwitch } from '@/components/theme-switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/context/theme-provider'
import { useSystemConfig } from '@/hooks/use-system-config'
import { cn } from '@/lib/utils'

import { splitAuthLayoutClasses } from './auth-layout-styles'
import { getAuthVisualSource } from './auth-visual'

type AuthLayoutProps = {
  children: React.ReactNode
  variant?: 'default' | 'split'
  visualSrc?: string
  darkVisualSrc?: string
  formSize?: 'default' | 'wide'
  showVisualOnMobile?: boolean
}

export function AuthLayout({
  children,
  variant = 'default',
  visualSrc,
  darkVisualSrc,
  formSize = 'default',
  showVisualOnMobile = true,
}: AuthLayoutProps) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const { systemName, logo, loading } = useSystemConfig()

  if (variant === 'split' && visualSrc) {
    const activeVisualSrc = getAuthVisualSource(
      visualSrc,
      darkVisualSrc,
      resolvedTheme
    )

    return (
      <main className={splitAuthLayoutClasses.root}>
        <div className={splitAuthLayoutClasses.shell}>
          <section className={splitAuthLayoutClasses.panel}>
            <header className={splitAuthLayoutClasses.header}>
              <Link
                to='/'
                className='flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80'
              >
                <div className='relative size-8 shrink-0'>
                  {loading ? (
                    <Skeleton className='absolute inset-0 rounded-full' />
                  ) : (
                    <img
                      src={logo}
                      alt={t('Logo')}
                      className='size-8 rounded-full object-cover'
                      decoding='async'
                      fetchPriority='high'
                    />
                  )}
                </div>
                {loading ? (
                  <Skeleton className='h-5 w-24' />
                ) : (
                  <h1 className='truncate text-lg font-semibold'>
                    {systemName}
                  </h1>
                )}
              </Link>
              <div className='flex shrink-0 items-center gap-1'>
                <LanguageSwitcher />
                <ThemeSwitch />
              </div>
            </header>

            <div className={splitAuthLayoutClasses.content}>
              <div
                className={cn(
                  splitAuthLayoutClasses.form,
                  formSize === 'wide'
                    ? splitAuthLayoutClasses.formWide
                    : undefined
                )}
              >
                {children}
              </div>
            </div>
          </section>

          <aside
            className={cn(
              splitAuthLayoutClasses.visual,
              showVisualOnMobile
                ? undefined
                : splitAuthLayoutClasses.visualDesktopOnly
            )}
            aria-hidden='true'
          >
            <img
              src={activeVisualSrc}
              alt=''
              className={splitAuthLayoutClasses.image}
              decoding='async'
              fetchPriority='high'
            />
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5' />
          </aside>
        </div>
      </main>
    )
  }

  return (
    <div className='relative grid h-svh max-w-none'>
      <Link
        to='/'
        className='absolute top-4 left-4 z-10 flex items-center gap-2 transition-opacity hover:opacity-80 sm:top-8 sm:left-8'
      >
        <div className='relative h-8 w-8'>
          {loading ? (
            <Skeleton className='absolute inset-0 rounded-full' />
          ) : (
            <img
              src={logo}
              alt={t('Logo')}
              className='h-8 w-8 rounded-full object-cover'
              decoding='async'
              fetchPriority='high'
            />
          )}
        </div>
        {loading ? (
          <Skeleton className='h-6 w-24' />
        ) : (
          <h1 className='text-xl font-medium'>{systemName}</h1>
        )}
      </Link>
      <div className='container flex items-center pt-16 sm:pt-0'>
        <div className='mx-auto flex w-full flex-col justify-center gap-2 px-4 py-8 sm:w-[480px] sm:p-8'>
          {children}
        </div>
      </div>
    </div>
  )
}
