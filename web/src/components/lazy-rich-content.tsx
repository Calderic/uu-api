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
import { lazy, Suspense } from 'react'

import { cn } from '@/lib/utils'

import type { HtmlContentProps } from './html-content'
import type { MarkdownProps } from './ui/markdown'

const MarkdownRenderer = lazy(() =>
  import('./ui/markdown').then((module) => ({
    default: module.Markdown,
  }))
)

const HtmlContentRenderer = lazy(() =>
  import('./html-content').then((module) => ({
    default: module.HtmlContent,
  }))
)

function ContentFallback(props: { className?: string }) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'min-h-5 animate-pulse rounded bg-muted/30',
        props.className
      )}
    />
  )
}

export function LazyMarkdown(props: MarkdownProps) {
  if (!props.children.trim()) {
    return null
  }

  return (
    <Suspense fallback={<ContentFallback className={props.className} />}>
      <MarkdownRenderer {...props} />
    </Suspense>
  )
}

export function LazyHtmlContent(props: HtmlContentProps) {
  if (!props.content.trim()) {
    return null
  }

  return (
    <Suspense fallback={<ContentFallback className={props.className} />}>
      <HtmlContentRenderer {...props} />
    </Suspense>
  )
}
