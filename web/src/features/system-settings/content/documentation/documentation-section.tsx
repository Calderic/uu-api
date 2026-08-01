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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Archive,
  ExternalLink,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import {
  createDocumentationCategory,
  createDocumentationPage,
  deleteDocumentationCategory,
  deleteDocumentationPage,
  getDocumentationCategories,
  getDocumentationSettings,
  listDocumentationPages,
  saveDocumentationSettings,
  setDocumentationPageStatus,
  updateDocumentationCategory,
  updateDocumentationPage,
} from '@/features/documentation/api'
import type {
  DocumentationCategory,
  DocumentationCategoryInput,
  DocumentationPage,
  DocumentationPageInput,
  DocumentationPageStatus,
  DocumentationSettingsInput,
} from '@/features/documentation/types'

import { SettingsPageActionsPortal } from '../../components/settings-page-context'
import { SettingsSection } from '../../components/settings-section'
import { DocumentationCategoryDialog } from './documentation-category-dialog'
import { DocumentationPageDialog } from './documentation-page-dialog'
import { DocumentationSettingsDialog } from './documentation-settings-dialog'

const PAGE_SIZE = 20

type DeleteTarget = {
  kind: 'page' | 'category'
  id: number
  label: string
}

export function DocumentationSection() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [editingPage, setEditingPage] = useState<DocumentationPage | null>(null)
  const [editingCategory, setEditingCategory] =
    useState<DocumentationCategory | null>(null)
  const [pageDialogOpen, setPageDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const pagesQuery = useQuery({
    queryKey: ['documentation-pages', search, status, pageNumber],
    queryFn: () =>
      listDocumentationPages({
        search,
        status,
        limit: PAGE_SIZE,
        offset: (pageNumber - 1) * PAGE_SIZE,
      }),
  })
  const categoriesQuery = useQuery({
    queryKey: ['documentation-categories'],
    queryFn: getDocumentationCategories,
  })
  const settingsQuery = useQuery({
    queryKey: ['documentation-settings'],
    queryFn: getDocumentationSettings,
  })

  const invalidateDocumentation = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['documentation-pages'] }),
      queryClient.invalidateQueries({ queryKey: ['documentation-categories'] }),
      queryClient.invalidateQueries({ queryKey: ['documentation-settings'] }),
      queryClient.invalidateQueries({ queryKey: ['documentation-index'] }),
    ])
  }

  const pageMutation = useMutation({
    mutationFn: (input: DocumentationPageInput) =>
      editingPage
        ? updateDocumentationPage(editingPage.id, input)
        : createDocumentationPage(input),
    onSuccess: async () => {
      await invalidateDocumentation()
      toast.success(
        editingPage
          ? t('Documentation page updated')
          : t('Documentation page created')
      )
      setPageDialogOpen(false)
      setEditingPage(null)
    },
  })
  const statusMutation = useMutation({
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: number
      nextStatus: DocumentationPageStatus
    }) => setDocumentationPageStatus(id, nextStatus),
    onSuccess: async () => {
      await invalidateDocumentation()
      toast.success(t('Publication status updated'))
    },
  })
  const settingsMutation = useMutation({
    mutationFn: (input: DocumentationSettingsInput) =>
      saveDocumentationSettings(input),
    onSuccess: async () => {
      await invalidateDocumentation()
      toast.success(t('Documentation settings updated'))
      setSettingsDialogOpen(false)
    },
  })
  const categoryMutation = useMutation({
    mutationFn: (input: DocumentationCategoryInput) =>
      editingCategory
        ? updateDocumentationCategory(editingCategory.id, input)
        : createDocumentationCategory(input),
    onSuccess: async () => {
      await invalidateDocumentation()
      toast.success(
        editingCategory
          ? t('Documentation category updated')
          : t('Documentation category created')
      )
      setCategoryDialogOpen(false)
      setEditingCategory(null)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (target: DeleteTarget) =>
      target.kind === 'page'
        ? deleteDocumentationPage(target.id)
        : deleteDocumentationCategory(target.id),
    onSuccess: async () => {
      await invalidateDocumentation()
      toast.success(t('Documentation item deleted'))
      setDeleteTarget(null)
    },
  })

  const pages = pagesQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []
  const total = pagesQuery.data?.pagination.total ?? 0
  const hasPrevious = pageNumber > 1
  const hasNext = pageNumber * PAGE_SIZE < total

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPageNumber(1)
    setSearch(searchInput.trim())
  }

  const openNewPage = () => {
    setEditingPage(null)
    setPageDialogOpen(true)
  }
  const openNewCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  let pagesContent: ReactNode
  if (pagesQuery.isLoading) {
    pagesContent = (
      <div className='text-muted-foreground p-12 text-center text-sm'>
        {t('Loading documentation pages...')}
      </div>
    )
  } else if (pages.length === 0) {
    pagesContent = (
      <div className='text-muted-foreground p-12 text-center text-sm'>
        {t('No documentation pages found.')}
      </div>
    )
  } else {
    pagesContent = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Page')}</TableHead>
            <TableHead>{t('Status')}</TableHead>
            <TableHead>{t('Category')}</TableHead>
            <TableHead>{t('Updated')}</TableHead>
            <TableHead className='text-right'>{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((documentationPage) => (
            <DocumentationPageRow
              key={documentationPage.id}
              page={documentationPage}
              statusPending={statusMutation.isPending}
              onEdit={() => {
                setEditingPage(documentationPage)
                setPageDialogOpen(true)
              }}
              onStatusChange={(nextStatus) =>
                statusMutation.mutate({
                  id: documentationPage.id,
                  nextStatus,
                })
              }
              onDelete={() =>
                setDeleteTarget({
                  kind: 'page',
                  id: documentationPage.id,
                  label: documentationPage.title,
                })
              }
            />
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <SettingsSection title={t('Documentation')}>
      <SettingsPageActionsPortal>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={() => setSettingsDialogOpen(true)}
        >
          <Settings className='size-4' aria-hidden='true' />
          {t('Documentation settings')}
        </Button>
        <Button
          type='button'
          size='sm'
          variant='outline'
          onClick={openNewCategory}
        >
          <FolderTree className='size-4' aria-hidden='true' />
          {t('Manage categories')}
        </Button>
        <Button type='button' size='sm' onClick={openNewPage}>
          <Plus className='size-4' aria-hidden='true' />
          {t('New documentation page')}
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
              placeholder={t('Search documentation by title or slug')}
            />
            <Button type='submit' variant='outline'>
              <Search className='size-4' aria-hidden='true' />
              {t('Search')}
            </Button>
          </form>
          <NativeSelect
            className='w-full md:w-44'
            value={status}
            onChange={(event) => {
              setPageNumber(1)
              setStatus(event.target.value)
            }}
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

        {pagesContent}

        <div className='flex items-center justify-between border-t p-4'>
          <p className='text-muted-foreground text-sm'>
            {t('{{count}} documentation pages', { count: total })}
          </p>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!hasPrevious}
              onClick={() =>
                setPageNumber((current) => Math.max(1, current - 1))
              }
            >
              {t('Previous')}
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={!hasNext}
              onClick={() => setPageNumber((current) => current + 1)}
            >
              {t('Next')}
            </Button>
          </div>
        </div>
      </div>

      <div className='bg-card mt-6 rounded-xl border'>
        <div className='flex items-center justify-between border-b p-4'>
          <div>
            <h3 className='font-medium'>{t('Documentation categories')}</h3>
            <p className='text-muted-foreground mt-1 text-sm'>
              {t(
                'Use categories to keep the public sidebar short and easy to scan.'
              )}
            </p>
          </div>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={openNewCategory}
          >
            <Plus className='size-4' aria-hidden='true' />
            {t('Add category')}
          </Button>
        </div>
        {categories.length === 0 ? (
          <p className='text-muted-foreground p-6 text-sm'>
            {t('No documentation categories found.')}
          </p>
        ) : (
          <div className='divide-border divide-y'>
            {categories.map((category) => (
              <div
                key={category.id}
                className='flex items-center justify-between gap-3 p-4'
              >
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>
                    {category.name}
                  </p>
                  <p className='text-muted-foreground truncate font-mono text-xs'>
                    {category.slug}
                  </p>
                </div>
                <div className='flex shrink-0 gap-1'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setEditingCategory(category)
                      setCategoryDialogOpen(true)
                    }}
                  >
                    <Pencil className='size-4' aria-hidden='true' />
                    {t('Edit')}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() =>
                      setDeleteTarget({
                        kind: 'category',
                        id: category.id,
                        label: category.name,
                      })
                    }
                  >
                    <Trash2 className='size-4' aria-hidden='true' />
                    {t('Delete')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DocumentationPageDialog
        open={pageDialogOpen}
        onOpenChange={(open) => {
          setPageDialogOpen(open)
          if (!open) setEditingPage(null)
        }}
        page={editingPage}
        pages={pages}
        categories={categories}
        isSaving={pageMutation.isPending}
        onSave={(input) =>
          pageMutation.mutateAsync(input).then(() => undefined)
        }
      />
      <DocumentationCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open)
          if (!open) setEditingCategory(null)
        }}
        category={editingCategory}
        isSaving={categoryMutation.isPending}
        onSave={(input) =>
          categoryMutation.mutateAsync(input).then(() => undefined)
        }
      />
      <DocumentationSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        settings={settingsQuery.data?.data}
        isSaving={settingsMutation.isPending}
        onSave={(input) =>
          settingsMutation.mutateAsync(input).then(() => undefined)
        }
      />
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('Delete documentation item?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('This cannot be undone. The selected item is: {{item}}', {
                item: deleteTarget?.label ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={!deleteTarget || deleteMutation.isPending}
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget)
              }}
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  )
}

type DocumentationPageRowProps = {
  page: DocumentationPage
  statusPending: boolean
  onEdit: () => void
  onStatusChange: (status: DocumentationPageStatus) => void
  onDelete: () => void
}

function DocumentationPageRow(props: DocumentationPageRowProps) {
  const { t } = useTranslation()
  const nextStatus: DocumentationPageStatus =
    props.page.status === 'published' ? 'draft' : 'published'

  return (
    <TableRow>
      <TableCell className='max-w-[360px]'>
        <button
          type='button'
          className='block max-w-full cursor-pointer text-left'
          onClick={props.onEdit}
        >
          <span className='block truncate font-medium'>{props.page.title}</span>
          <span className='text-muted-foreground block truncate font-mono text-xs'>
            /docs/{props.page.slug}
          </span>
        </button>
      </TableCell>
      <TableCell>
        <DocumentationStatusBadge status={props.page.status} />
      </TableCell>
      <TableCell>{props.page.category?.name ?? t('Uncategorized')}</TableCell>
      <TableCell>
        {new Date(props.page.updated_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className='flex justify-end gap-1'>
          {props.page.status === 'published' && (
            <Button
              variant='ghost'
              size='sm'
              render={
                <a
                  href={`/docs/${encodeURIComponent(props.page.slug)}`}
                  target='_blank'
                  rel='noreferrer'
                />
              }
            >
              <ExternalLink className='size-4' aria-hidden='true' />
              {t('View')}
            </Button>
          )}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={props.onEdit}
          >
            <Pencil className='size-4' aria-hidden='true' />
            {t('Edit')}
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            disabled={props.statusPending}
            onClick={() => props.onStatusChange(nextStatus)}
          >
            {props.page.status === 'published' ? t('Unpublish') : t('Publish')}
          </Button>
          {props.page.status !== 'archived' && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              disabled={props.statusPending}
              onClick={() => props.onStatusChange('archived')}
            >
              <Archive className='size-4' aria-hidden='true' />
              {t('Archive')}
            </Button>
          )}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={props.onDelete}
          >
            <Trash2 className='size-4' aria-hidden='true' />
            {t('Delete')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function DocumentationStatusBadge({
  status,
}: {
  status: DocumentationPageStatus
}) {
  const { t } = useTranslation()
  const labels: Record<DocumentationPageStatus, string> = {
    draft: t('Draft'),
    published: t('Published'),
    archived: t('Archived'),
    pending_review: t('Pending review'),
  }
  let variant: 'default' | 'outline' | 'secondary' = 'secondary'
  if (status === 'published') variant = 'default'
  if (status === 'archived') variant = 'outline'
  return <Badge variant={variant}>{labels[status]}</Badge>
}
