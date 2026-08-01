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
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Check, Copy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { RichContent } from '@/components/rich-content'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

import { getDocumentationPage } from './api'
import { DocumentationShell } from './documentation-shell'
import {
  extractDocumentationHeadings,
  replaceDocumentationBaseUrl,
} from './lib'
import type { DocumentationPageResult } from './types'

export function DocumentationPageView() {
  const { t } = useTranslation()
  const { slug } = useParams({ from: '/docs/$slug' })
  const query = useQuery({
    queryKey: ['documentation-page', slug],
    queryFn: () => getDocumentationPage(slug),
  })
  const payload = query.data?.data
  const redirect = getDocumentationRedirect(payload)

  useEffect(() => {
    if (!redirect) return
    window.location.replace(redirect)
  }, [redirect])

  if (query.isLoading) {
    return <DocumentationPageSkeleton />
  }

  if (!isDocumentationPageResult(payload) || redirect) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center p-8'>
        <div className='text-muted-foreground text-center'>
          {t('This documentation page could not be found.')}
        </div>
      </div>
    )
  }

  const pageResult = payload
  const baseUrl =
    pageResult.settings.base_url ||
    (typeof window === 'undefined' ? '' : window.location.origin)
  const content = replaceDocumentationBaseUrl(pageResult.page.content, baseUrl)

  return (
    <DocumentationShell
      settings={pageResult.settings}
      categories={pageResult.categories}
      activeSlug={pageResult.page.slug}
    >
      <div className='grid gap-10 xl:grid-cols-[minmax(0,1fr)_180px]'>
        <article className='min-w-0'>
          <header className='border-border/70 mb-8 border-b pb-7'>
            <div className='text-muted-foreground mb-3 flex flex-wrap items-center gap-2 text-sm'>
              {pageResult.page.category && (
                <span>{pageResult.page.category.name}</span>
              )}
              {pageResult.page.category && <span aria-hidden='true'>·</span>}
              <span>{t('Documentation')}</span>
            </div>
            <h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>
              {pageResult.page.title}
            </h1>
            {pageResult.page.summary && (
              <p className='text-muted-foreground mt-3 max-w-3xl text-base leading-7'>
                {pageResult.page.summary}
              </p>
            )}
            <CopyMarkdownButton content={content} />
          </header>

          <RichContent
            mode='markdown'
            content={content}
            className='prose-neutral dark:prose-invert'
          />

          <div className='border-border/70 mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2'>
            <DocumentationPagerLink
              direction='previous'
              item={pageResult.previous_page}
            />
            <DocumentationPagerLink
              direction='next'
              item={pageResult.next_page}
            />
          </div>
        </article>
        <DocumentationTableOfContents content={content} />
      </div>
    </DocumentationShell>
  )
}

function getDocumentationRedirect(
  payload: DocumentationPageResult | { redirect: string } | undefined
): string | undefined {
  if (payload && 'redirect' in payload) return payload.redirect
  return undefined
}

function isDocumentationPageResult(
  payload: DocumentationPageResult | { redirect: string } | undefined
): payload is DocumentationPageResult {
  return Boolean(payload && 'page' in payload)
}

function DocumentationPageSkeleton() {
  return (
    <div className='container grid gap-10 px-4 py-12 lg:grid-cols-[220px_minmax(0,1fr)]'>
      <Skeleton className='hidden h-64 lg:block' />
      <div className='space-y-5'>
        <Skeleton className='h-10 w-2/3' />
        <Skeleton className='h-5 w-1/2' />
        <Skeleton className='h-80' />
      </div>
    </div>
  )
}

function CopyMarkdownButton(props: { content: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(props.content)
      setCopied(true)
      toast.success(t('Documentation copied'))
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error(t('Could not copy documentation'))
    }
  }

  return (
    <Button
      type='button'
      variant='outline'
      size='sm'
      className='mt-5'
      onClick={copyMarkdown}
    >
      {copied ? (
        <Check className='size-3.5' aria-hidden='true' />
      ) : (
        <Copy className='size-3.5' aria-hidden='true' />
      )}
      {copied ? t('Copied') : t('Copy Markdown')}
    </Button>
  )
}

function DocumentationTableOfContents(props: { content: string }) {
  const { t } = useTranslation()
  const headings = useMemo(
    () => extractDocumentationHeadings(props.content),
    [props.content]
  )

  if (headings.length === 0) return null

  return (
    <aside className='hidden xl:block'>
      <div className='sticky top-32'>
        <p className='text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase'>
          {t('On this page')}
        </p>
        <nav aria-label={t('On this page')} className='space-y-2'>
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={
                heading.depth === 3
                  ? 'text-muted-foreground hover:text-foreground block pl-3 text-xs transition-colors'
                  : 'text-muted-foreground hover:text-foreground block text-sm transition-colors'
              }
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

type DocumentationPagerLinkProps = {
  direction: 'previous' | 'next'
  item?: { slug: string; title: string }
}

function DocumentationPagerLink(props: DocumentationPagerLinkProps) {
  const { t } = useTranslation()
  if (!props.item) return <div />

  const isPrevious = props.direction === 'previous'
  return (
    <Link
      to='/docs/$slug'
      params={{ slug: props.item.slug }}
      className={`hover:bg-muted border-border flex items-center gap-3 rounded-xl border p-4 transition-colors ${isPrevious ? '' : 'justify-end text-right'}`}
    >
      {isPrevious && (
        <ArrowLeft className='size-4 shrink-0' aria-hidden='true' />
      )}
      <span className='min-w-0'>
        <span className='text-muted-foreground block text-xs'>
          {isPrevious ? t('Previous page') : t('Next page')}
        </span>
        <span className='mt-1 block truncate text-sm font-medium'>
          {props.item.title}
        </span>
      </span>
      {!isPrevious && (
        <ArrowRight className='size-4 shrink-0' aria-hidden='true' />
      )}
    </Link>
  )
}
