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
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import type {
  DocumentationCategory,
  DocumentationPage,
  DocumentationPageInput,
  DocumentationPageStatus,
} from '@/features/documentation/types'

const pageSchema = z.object({
  title: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string(),
  content: z.string().trim().min(1),
  metaTitle: z.string(),
  metaDescription: z.string(),
  status: z.enum(['draft', 'published', 'archived', 'pending_review']),
  categoryId: z.string(),
  parentId: z.string(),
  sortOrder: z.coerce.number().int(),
})

type PageFormValues = z.infer<typeof pageSchema>

type DocumentationPageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: DocumentationPage | null
  pages: DocumentationPage[]
  categories: DocumentationCategory[]
  isSaving: boolean
  onSave: (input: DocumentationPageInput) => Promise<void>
}

const PAGE_FORM_ID = 'documentation-page-form'

export function DocumentationPageDialog(props: DocumentationPageDialogProps) {
  const { t } = useTranslation()
  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema) as unknown as Resolver<PageFormValues>,
    defaultValues: emptyPageValues(),
  })

  useEffect(() => {
    if (!props.open) return
    const page = props.page
    form.reset(
      page
        ? {
            title: page.title,
            slug: page.slug,
            summary: page.summary ?? '',
            content: page.content,
            metaTitle: page.meta_title ?? '',
            metaDescription: page.meta_description ?? '',
            status: page.status,
            categoryId: page.category_id?.toString() ?? '',
            parentId: page.parent_id?.toString() ?? '',
            sortOrder: page.sort_order,
          }
        : emptyPageValues()
    )
  }, [form, props.open, props.page])

  const onSubmit = async (values: PageFormValues) => {
    await props.onSave({
      title: values.title.trim(),
      slug: values.slug.trim().toLowerCase(),
      summary: nullable(values.summary),
      content: values.content,
      meta_title: nullable(values.metaTitle),
      meta_description: nullable(values.metaDescription),
      status: values.status as DocumentationPageStatus,
      category_id: values.categoryId ? Number(values.categoryId) : null,
      parent_id: values.parentId ? Number(values.parentId) : null,
      sort_order: values.sortOrder,
    })
  }

  const availableParents = props.pages.filter(
    (page) => page.id !== props.page?.id
  )

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={
        props.page ? t('Edit documentation page') : t('New documentation page')
      }
      description={t(
        'Write in Markdown. Published pages appear in the public docs and LLM text files.'
      )}
      contentHeight='min(78vh, 820px)'
      contentClassName='sm:max-w-4xl'
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => props.onOpenChange(false)}
            disabled={props.isSaving}
          >
            {t('Cancel')}
          </Button>
          <Button type='submit' form={PAGE_FORM_ID} disabled={props.isSaving}>
            {props.isSaving ? t('Saving...') : t('Save documentation page')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={PAGE_FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5'
        >
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>{t('Page title')}</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='slug'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('URL slug')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoCapitalize='none'
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('Use lowercase letters, numbers, and hyphens only.')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Publication status')}</FormLabel>
                  <FormControl>
                    <NativeSelect
                      className='w-full'
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <NativeSelectOption value='draft'>
                        {t('Draft')}
                      </NativeSelectOption>
                      <NativeSelectOption value='published'>
                        {t('Published')}
                      </NativeSelectOption>
                      <NativeSelectOption value='pending_review'>
                        {t('Pending review')}
                      </NativeSelectOption>
                      <NativeSelectOption value='archived'>
                        {t('Archived')}
                      </NativeSelectOption>
                    </NativeSelect>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Category')}</FormLabel>
                  <FormControl>
                    <NativeSelect
                      className='w-full'
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <NativeSelectOption value=''>
                        {t('Uncategorized')}
                      </NativeSelectOption>
                      {props.categories.map((category) => (
                        <NativeSelectOption
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='parentId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Parent page')}</FormLabel>
                  <FormControl>
                    <NativeSelect
                      className='w-full'
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <NativeSelectOption value=''>
                        {t('Top-level page')}
                      </NativeSelectOption>
                      {availableParents.map((page) => (
                        <NativeSelectOption
                          key={page.id}
                          value={page.id.toString()}
                        >
                          {page.title}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='sortOrder'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Sort order')}</FormLabel>
                  <FormControl>
                    <Input {...field} type='number' step={1} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='summary'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Short summary')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={2} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='content'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Markdown content')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className='min-h-[320px] font-mono text-sm leading-6'
                    spellCheck={false}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'Use the BASE_URL placeholder in examples so the site can fill its own origin.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='metaTitle'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('SEO title')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='metaDescription'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('SEO description')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </Dialog>
  )
}

function emptyPageValues(): PageFormValues {
  return {
    title: '',
    slug: '',
    summary: '',
    content: '# New documentation page\n\nWrite your content here.',
    metaTitle: '',
    metaDescription: '',
    status: 'draft',
    categoryId: '',
    parentId: '',
    sortOrder: 10,
  }
}

function nullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
