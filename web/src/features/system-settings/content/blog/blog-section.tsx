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
import {
  Add01Icon,
  Archive02Icon,
  Edit02Icon,
  Search01Icon,
  Settings02Icon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { SettingsPageActionsPortal } from '../../components/settings-page-context'
import { SettingsSection } from '../../components/settings-section'
import {
  createBlogArticle,
  getBlogSettings,
  getBlogTaxonomy,
  listBlogArticles,
  saveBlogSettings,
  setBlogArticleStatus,
  updateBlogArticle,
} from './api'
import { BlogArticleDialog } from './blog-article-dialog'
import { BlogSettingsDialog } from './blog-settings-dialog'
import type {
  BlogArticle,
  BlogArticleInput,
  BlogArticleStatus,
  BlogSettings,
} from './types'

const PAGE_SIZE = 20

export function BlogSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [articleDialogOpen, setArticleDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null)

  const articlesQuery = useQuery({
    queryKey: ['blog-articles', search, status, page],
    queryFn: () =>
      listBlogArticles({
        search,
        status,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  })
  const taxonomyQuery = useQuery({
    queryKey: ['blog-taxonomy'],
    queryFn: getBlogTaxonomy,
  })
  const settingsQuery = useQuery({
    queryKey: ['blog-settings'],
    queryFn: getBlogSettings,
  })

  const invalidateBlog = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['blog-articles'] }),
      queryClient.invalidateQueries({ queryKey: ['blog-settings'] }),
    ])

  const articleMutation = useMutation({
    mutationFn: (input: BlogArticleInput) =>
      editingArticle
        ? updateBlogArticle(editingArticle.id, input)
        : createBlogArticle(input),
    onSuccess: async () => {
      await invalidateBlog()
      toast.success(
        editingArticle ? t('Blog article updated') : t('Blog article created')
      )
      setArticleDialogOpen(false)
      setEditingArticle(null)
    },
  })
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: number
      nextStatus: BlogArticleStatus
    }) => setBlogArticleStatus(id, nextStatus),
    onSuccess: async () => {
      await invalidateBlog()
      toast.success(t('Publication status updated'))
    },
  })
  const settingsMutation = useMutation({
    mutationFn: (input: Omit<BlogSettings, 'id' | 'updated_at'>) =>
      saveBlogSettings(input),
    onSuccess: async () => {
      await invalidateBlog()
      toast.success(t('Blog settings updated'))
      setSettingsDialogOpen(false)
    },
  })

  const openNewArticle = () => {
    setEditingArticle(null)
    setArticleDialogOpen(true)
  }
  const openArticle = (article: BlogArticle) => {
    setEditingArticle(article)
    setArticleDialogOpen(true)
  }
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }
  const updateStatusFilter = (nextStatus: string) => {
    setPage(1)
    setStatus(nextStatus)
  }

  const response = articlesQuery.data
  const articles = response?.data ?? []
  const total = response?.pagination.total ?? 0
  const hasPrevious = page > 1
  const hasNext = page * PAGE_SIZE < total
  let articlesContent: ReactNode
  if (articlesQuery.isLoading) {
    articlesContent = (
      <div className='text-muted-foreground p-12 text-center text-sm'>
        {t('Loading blog articles...')}
      </div>
    )
  } else if (articles.length === 0) {
    articlesContent = (
      <div className='text-muted-foreground p-12 text-center text-sm'>
        {t('No blog articles found.')}
      </div>
    )
  } else {
    articlesContent = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Article')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Category')}</TableHead>
            <TableHead>{t('Views')}</TableHead>
            <TableHead>{t('Updated')}</TableHead>
            <TableHead className='text-right'>{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((article) => (
            <BlogArticleRow
              key={article.id}
              article={article}
              statusPending={statusMutation.isPending}
              onEdit={openArticle}
              onStatusChange={(nextStatus) =>
                statusMutation.mutate({ id: article.id, nextStatus })
              }
            />
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <SettingsSection title={t('Blog')}>
      <SettingsPageActionsPortal>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => setSettingsDialogOpen(true)}
        >
          <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />
          {t('Blog settings')}
        </Button>
        <Button type='button' size='sm' onClick={openNewArticle}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          {t('New article')}
        </Button>
      </SettingsPageActionsPortal>

      <div className='bg-card rounded-xl border'>
        <div className='flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between'>
          <form
            className='flex w-full max-w-lg items-center gap-2'
            onSubmit={submitSearch}
          >
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('Search articles by title or slug')}
            />
            <Button type='submit' variant='outline'>
              <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
              {t('Search')}
            </Button>
          </form>
          <NativeSelect
            className='w-full md:w-44'
            value={status}
            onChange={(event) => updateStatusFilter(event.target.value)}
            aria-label={t('Filter by status')}
          >
            <NativeSelectOption value=''>
              {t('All statuses')}
            </NativeSelectOption>
            <NativeSelectOption value='published'>
              {t('Published')}
            </NativeSelectOption>
            <NativeSelectOption value='draft'>{t('Draft')}</NativeSelectOption>
            <NativeSelectOption value='pending_review'>
              {t('Pending review')}
            </NativeSelectOption>
            <NativeSelectOption value='archived'>
              {t('Archived')}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        {articlesContent}

        <div className='flex items-center justify-between border-t p-4'>
          <p className='text-muted-foreground text-sm'>
            {t('{{count}} articles', { count: total })}
          </p>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!hasPrevious}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              {t('Previous')}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!hasNext}
              onClick={() => setPage((current) => current + 1)}
            >
              {t('Next')}
            </Button>
          </div>
        </div>
      </div>

      <BlogArticleDialog
        open={articleDialogOpen}
        onOpenChange={(open) => {
          setArticleDialogOpen(open)
          if (!open) setEditingArticle(null)
        }}
        article={editingArticle}
        taxonomy={taxonomyQuery.data}
        isSaving={articleMutation.isPending}
        onSave={async (input) => {
          await articleMutation.mutateAsync(input)
        }}
      />
      <BlogSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        settings={settingsQuery.data}
        isSaving={settingsMutation.isPending}
        onSave={async (input) => {
          await settingsMutation.mutateAsync(input)
        }}
      />
    </SettingsSection>
  )
}

function BlogStatusBadge({ status }: { status: BlogArticleStatus }) {
  const { t } = useTranslation()
  const labels: Record<BlogArticleStatus, string> = {
    draft: t('Draft'),
    published: t('Published'),
    archived: t('Archived'),
    pending_review: t('Pending review'),
  }
  let variant: 'default' | 'outline' | 'secondary' = 'secondary'
  if (status === 'published') {
    variant = 'default'
  } else if (status === 'archived') {
    variant = 'outline'
  }
  return <Badge variant={variant}>{labels[status]}</Badge>
}

type BlogArticleRowProps = {
  article: BlogArticle
  statusPending: boolean
  onEdit: (article: BlogArticle) => void
  onStatusChange: (status: BlogArticleStatus) => void
}

function BlogArticleRow(props: BlogArticleRowProps) {
  const { t } = useTranslation()
  const { article } = props
  const nextStatus = article.status === 'published' ? 'draft' : 'published'

  return (
    <TableRow>
      <TableCell className='max-w-[360px]'>
        <button
          type='button'
          className='block max-w-full cursor-pointer text-left'
          onClick={() => props.onEdit(article)}
        >
          <span className='block truncate font-medium'>{article.title}</span>
          <span className='text-muted-foreground block truncate font-mono text-xs'>
            /blog/{article.slug}
          </span>
        </button>
      </TableCell>
      <TableCell>
        <BlogStatusBadge status={article.status} />
      </TableCell>
      <TableCell>{article.category?.name ?? '—'}</TableCell>
      <TableCell>{article.view_count.toLocaleString()}</TableCell>
      <TableCell>{new Date(article.updated_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <div className='flex justify-end gap-1'>
          {article.status === 'published' && (
            <Button
              variant='ghost'
              size='sm'
              render={
                <a
                  href={`/blog/${encodeURIComponent(article.slug)}`}
                  target='_blank'
                  rel='noreferrer'
                />
              }
            >
              <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
              {t('View')}
            </Button>
          )}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => props.onEdit(article)}
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            {t('Edit')}
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={props.statusPending}
            onClick={() => props.onStatusChange(nextStatus)}
          >
            {article.status === 'published' ? t('Unpublish') : t('Publish')}
          </Button>
          {article.status !== 'archived' && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={props.statusPending}
              onClick={() => props.onStatusChange('archived')}
            >
              <HugeiconsIcon icon={Archive02Icon} strokeWidth={2} />
              {t('Archive')}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
