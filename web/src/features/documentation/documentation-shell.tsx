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
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { cn } from '@/lib/utils'

import type {
  DocumentationCategoryWithPages,
  DocumentationSettings,
} from './types'

type DocumentationShellProps = {
  children: ReactNode
  settings: DocumentationSettings
  categories: DocumentationCategoryWithPages[]
  activeSlug?: string
}

export function DocumentationShell(props: DocumentationShellProps) {
  const { t } = useTranslation()

  return (
    <PublicLayout showMainContainer={false} siteName={props.settings.site_name}>
      <div className='pt-16'>
        <div className='border-border/70 bg-background/95 sticky top-14 z-20 border-b backdrop-blur'>
          <div className='container flex min-h-14 items-center justify-between gap-4 px-4'>
            <Link
              to='/docs'
              className='hover:text-primary min-w-0 truncate text-sm font-semibold transition-colors'
            >
              {props.settings.site_name}
            </Link>
            <nav
              aria-label={t('Documentation tools')}
              className='flex shrink-0 items-center gap-2 text-sm'
            >
              <a
                href='/llms.txt'
                className='text-muted-foreground hover:text-foreground hidden transition-colors sm:inline'
              >
                {t('LLM index')}
              </a>
              <a
                href='/llms-full.txt'
                className='text-primary hover:text-primary/80 transition-colors'
              >
                {t('Full LLM docs')}
              </a>
            </nav>
          </div>
        </div>

        <div className='container px-4 py-8 md:py-10'>
          <div className='mb-6 lg:hidden'>
            <details className='bg-card rounded-xl border p-4'>
              <summary className='cursor-pointer text-sm font-medium'>
                {t('Documentation menu')}
              </summary>
              <div className='mt-4'>
                <DocumentationNavigation
                  categories={props.categories}
                  activeSlug={props.activeSlug}
                />
              </div>
            </details>
          </div>

          <div className='grid gap-10 lg:grid-cols-[minmax(180px,220px)_minmax(0,1fr)]'>
            <aside className='hidden lg:block'>
              <div className='sticky top-32'>
                <DocumentationNavigation
                  categories={props.categories}
                  activeSlug={props.activeSlug}
                />
              </div>
            </aside>
            <main className='min-w-0'>{props.children}</main>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

type DocumentationNavigationProps = {
  categories: DocumentationCategoryWithPages[]
  activeSlug?: string
}

function DocumentationNavigation(props: DocumentationNavigationProps) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('Documentation navigation')} className='space-y-6'>
      <Link
        to='/docs'
        activeOptions={{ exact: true }}
        className={cn(
          'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          props.activeSlug
            ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
            : 'bg-primary/10 text-primary'
        )}
      >
        {t('Documentation home')}
      </Link>
      {props.categories
        .filter((category) => category.pages.length > 0)
        .map((category) => (
          <div key={category.id} className='space-y-2'>
            <p className='text-muted-foreground px-3 text-xs font-semibold tracking-wide uppercase'>
              {category.name}
            </p>
            <div className='space-y-0.5'>
              {category.pages.map((page) => (
                <Link
                  key={page.id}
                  to='/docs/$slug'
                  params={{ slug: page.slug }}
                  className={cn(
                    'text-muted-foreground hover:bg-muted hover:text-foreground block rounded-lg px-3 py-2 text-sm transition-colors',
                    page.slug === props.activeSlug &&
                      'bg-primary/10 text-primary font-medium'
                  )}
                >
                  {page.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
    </nav>
  )
}
