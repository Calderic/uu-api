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
import { toast } from 'sonner'
import { z } from 'zod'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  BlogArticle,
  BlogArticleInput,
  BlogArticleStatus,
  BlogTaxonomy,
} from './types'

const articleSchema = z.object({
  title: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().trim().min(1),
  excerpt: z.string(),
  coverImageUrl: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  canonicalUrl: z.string(),
  status: z.enum(['draft', 'published', 'archived', 'pending_review']),
  categoryId: z.string(),
  tagSlugs: z.string(),
  sortOrder: z.coerce.number().int(),
  isFeatured: z.boolean(),
})

type ArticleFormValues = z.infer<typeof articleSchema>

type BlogArticleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: BlogArticle | null
  taxonomy?: BlogTaxonomy
  isSaving: boolean
  onSave: (input: BlogArticleInput) => Promise<void>
}

const ARTICLE_FORM_ID = 'blog-article-form'

export function BlogArticleDialog(props: BlogArticleDialogProps) {
  const { t } = useTranslation()
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(
      articleSchema
    ) as unknown as Resolver<ArticleFormValues>,
    defaultValues: emptyArticleValues(),
  })

  useEffect(() => {
    if (!props.open) return
    const article = props.article
    form.reset(
      article
        ? {
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt ?? '',
            coverImageUrl: article.cover_image_url ?? '',
            metaTitle: article.meta_title ?? '',
            metaDescription: article.meta_description ?? '',
            canonicalUrl: article.canonical_url ?? '',
            status: article.status,
            categoryId: article.category_id?.toString() ?? '',
            tagSlugs: article.tags.map((tag) => tag.slug).join(', '),
            sortOrder: article.sort_order,
            isFeatured: article.is_featured,
          }
        : emptyArticleValues()
    )
  }, [props.open, props.article, form])

  const onSubmit = async (values: ArticleFormValues) => {
    const requestedTags = [
      ...new Set(
        values.tagSlugs
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean)
      ),
    ]
    const tagsBySlug = new Map(
      (props.taxonomy?.tags ?? []).map((tag) => [tag.slug.toLowerCase(), tag])
    )
    const unknownTags = requestedTags.filter((tag) => !tagsBySlug.has(tag))
    if (unknownTags.length > 0) {
      toast.error(
        t('Unknown blog tags: {{tags}}', { tags: unknownTags.join(', ') })
      )
      return
    }
    const tagIds = requestedTags
      .map((tag) => tagsBySlug.get(tag)?.id)
      .filter((id): id is number => id !== undefined)

    const existing = props.article
    await props.onSave({
      title: values.title.trim(),
      slug: values.slug.trim(),
      content: values.content,
      excerpt: nullable(values.excerpt),
      cover_image_url: nullable(values.coverImageUrl),
      meta_title: nullable(values.metaTitle),
      meta_description: nullable(values.metaDescription),
      canonical_url: nullable(values.canonicalUrl),
      status: values.status as BlogArticleStatus,
      category_id: values.categoryId ? Number(values.categoryId) : null,
      tag_ids: tagIds,
      cta_config: existing?.cta_config ?? {},
      structured_data: existing?.structured_data ?? {},
      metadata: existing?.metadata ?? {},
      sort_order: values.sortOrder,
      is_featured: values.isFeatured,
    })
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.article ? t('Edit blog article') : t('New blog article')}
      description={t(
        'Published articles are rendered by the server so search engines receive complete HTML.'
      )}
      contentHeight='min(72vh, 760px)'
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
          <Button
            type='submit'
            form={ARTICLE_FORM_ID}
            disabled={props.isSaving}
          >
            {props.isSaving ? t('Saving...') : t('Save article')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={ARTICLE_FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5'
        >
          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>{t('Article title')}</FormLabel>
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
                      placeholder='my-article-slug'
                      autoCapitalize='none'
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Keep an existing slug unchanged to preserve its search ranking.'
                    )}
                  </FormDescription>
                  <FormMessage>
                    {form.formState.errors.slug
                      ? t('Use lowercase letters, numbers, and hyphens only.')
                      : null}
                  </FormMessage>
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
          </div>

          <FormField
            control={form.control}
            name='excerpt'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Excerpt')}</FormLabel>
                <FormControl>
                  <Textarea {...field} className='min-h-20' />
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
                    className='min-h-80 resize-y font-mono text-sm'
                    spellCheck={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid gap-4 md:grid-cols-2'>
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
                        {t('No category')}
                      </NativeSelectOption>
                      {(props.taxonomy?.categories ?? []).map((category) => (
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
              name='tagSlugs'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Tag slugs')}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder='ai, openai, tools' />
                  </FormControl>
                  <FormDescription>
                    {t('Separate existing tag slugs with commas.')}
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='coverImageUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Cover image URL')}</FormLabel>
                  <FormControl>
                    <Input {...field} type='url' />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='canonicalUrl'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Canonical URL override')}</FormLabel>
                  <FormControl>
                    <Input {...field} type='url' />
                  </FormControl>
                  <FormDescription>
                    {t('Leave empty to use the article URL automatically.')}
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='metaTitle'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('SEO title')}</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={120} />
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
                    <Textarea {...field} maxLength={320} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className='grid gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='sortOrder'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Sort order')}</FormLabel>
                  <FormControl>
                    <Input {...field} type='number' />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='isFeatured'
              render={({ field }) => (
                <FormItem className='flex items-center gap-3 pt-7'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <FormLabel className='m-0'>{t('Featured article')}</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </Dialog>
  )
}

function emptyArticleValues(): ArticleFormValues {
  return {
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    coverImageUrl: '',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    status: 'draft',
    categoryId: '',
    tagSlugs: '',
    sortOrder: 0,
    isFeatured: false,
  }
}

function nullable(value: string): string | null {
  const trimmed = value.trim()
  return trimmed || null
}
