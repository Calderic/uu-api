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
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Bot, Code2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { getDocumentationIndex } from './api'
import { DocumentationShell } from './documentation-shell'
import type { DocumentationPage } from './types'

export function DocumentationHome() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['documentation-index'],
    queryFn: getDocumentationIndex,
  })

  if (query.isLoading) {
    return <DocumentationHomeSkeleton />
  }

  const index = query.data?.data
  if (!index) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center p-8'>
        <div className='text-muted-foreground max-w-md text-center'>
          {t('Documentation is temporarily unavailable.')}
        </div>
      </div>
    )
  }

  const quickStart = findPage(index.pages, 'quick-start')
  const apiReference = findPage(index.pages, 'api-reference')

  return (
    <DocumentationShell settings={index.settings} categories={index.categories}>
      <section className='from-primary/10 via-background to-background rounded-2xl border bg-gradient-to-br p-6 md:p-10'>
        <div className='max-w-3xl space-y-5'>
          <div className='bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium'>
            <BookOpen className='size-3.5' aria-hidden='true' />
            {t('Simple, clear API documentation')}
          </div>
          <div className='space-y-3'>
            <h1 className='text-3xl font-semibold tracking-tight md:text-5xl'>
              {index.settings.site_name}
            </h1>
            <p className='text-muted-foreground max-w-2xl text-base leading-7 md:text-lg'>
              {index.settings.site_description}
            </p>
          </div>
          <div className='flex flex-wrap gap-3'>
            {quickStart && (
              <Button
                size='lg'
                render={
                  <Link to='/docs/$slug' params={{ slug: quickStart.slug }} />
                }
              >
                {t('Start here')}
                <ArrowRight className='size-4' aria-hidden='true' />
              </Button>
            )}
            {apiReference && (
              <Button
                size='lg'
                variant='outline'
                render={
                  <Link to='/docs/$slug' params={{ slug: apiReference.slug }} />
                }
              >
                {t('Browse API reference')}
              </Button>
            )}
            <Button
              size='lg'
              variant='ghost'
              render={<a href='/llms-full.txt' />}
            >
              <Bot className='size-4' aria-hidden='true' />
              {t('Read with an LLM')}
            </Button>
          </div>
        </div>
      </section>

      <section className='mt-10 space-y-5'>
        <div>
          <h2 className='text-2xl font-semibold'>
            {t('Browse documentation')}
          </h2>
          <p className='text-muted-foreground mt-1 text-sm'>
            {t(
              'Choose a topic and follow the shortest path to a working request.'
            )}
          </p>
        </div>
        <div className='grid gap-4 md:grid-cols-2'>
          {index.categories
            .filter((category) => category.pages.length > 0)
            .map((category) => (
              <Card key={category.id} className='h-full'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Code2 className='text-primary size-4' aria-hidden='true' />
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='divide-border divide-y'>
                    {category.pages.map((page) => (
                      <Link
                        key={page.id}
                        to='/docs/$slug'
                        params={{ slug: page.slug }}
                        className='hover:bg-muted -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors'
                      >
                        <span className='min-w-0'>
                          <span className='block truncate text-sm font-medium'>
                            {page.title}
                          </span>
                          {page.summary && (
                            <span className='text-muted-foreground mt-1 block truncate text-xs'>
                              {page.summary}
                            </span>
                          )}
                        </span>
                        <ArrowRight
                          className='text-muted-foreground size-4 shrink-0'
                          aria-hidden='true'
                        />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      <section className='bg-muted/40 mt-10 flex flex-col gap-4 rounded-2xl border p-5 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='font-medium'>{t('Need machine-readable context?')}</h2>
          <p className='text-muted-foreground mt-1 text-sm'>
            {t(
              'Give your coding assistant the full documentation in one text file.'
            )}
          </p>
        </div>
        <a
          href='/llms-full.txt'
          className='text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline'
        >
          {t('Open full LLM docs')}
          <ArrowRight className='size-4' aria-hidden='true' />
        </a>
      </section>
    </DocumentationShell>
  )
}

function findPage(pages: DocumentationPage[], slug: string) {
  return pages.find((page) => page.slug === slug)
}

function DocumentationHomeSkeleton() {
  return (
    <div className='container space-y-8 px-4 py-12'>
      <Skeleton className='h-56 rounded-2xl' />
      <div className='grid gap-4 md:grid-cols-2'>
        <Skeleton className='h-48 rounded-xl' />
        <Skeleton className='h-48 rounded-xl' />
      </div>
    </div>
  )
}
