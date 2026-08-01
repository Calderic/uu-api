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
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type {
  DocumentationCategory,
  DocumentationCategoryInput,
} from '@/features/documentation/types'

const categorySchema = z.object({
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string(),
  sortOrder: z.coerce.number().int(),
})

type CategoryFormValues = z.infer<typeof categorySchema>

type DocumentationCategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: DocumentationCategory | null
  isSaving: boolean
  onSave: (input: DocumentationCategoryInput) => Promise<void>
}

const CATEGORY_FORM_ID = 'documentation-category-form'

export function DocumentationCategoryDialog(
  props: DocumentationCategoryDialogProps
) {
  const { t } = useTranslation()
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(
      categorySchema
    ) as unknown as Resolver<CategoryFormValues>,
    defaultValues: emptyCategoryValues(),
  })

  useEffect(() => {
    if (!props.open) return
    form.reset(
      props.category
        ? {
            name: props.category.name,
            slug: props.category.slug,
            description: props.category.description ?? '',
            sortOrder: props.category.sort_order,
          }
        : emptyCategoryValues()
    )
  }, [form, props.category, props.open])

  const onSubmit = async (values: CategoryFormValues) => {
    await props.onSave({
      name: values.name.trim(),
      slug: values.slug.trim().toLowerCase(),
      description: values.description.trim() || null,
      sort_order: values.sortOrder,
    })
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={
        props.category
          ? t('Edit documentation category')
          : t('New documentation category')
      }
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
            form={CATEGORY_FORM_ID}
            disabled={props.isSaving}
          >
            {props.isSaving ? t('Saving...') : t('Save category')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={CATEGORY_FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Category name')}</FormLabel>
                <FormControl>
                  <Input {...field} autoFocus />
                </FormControl>
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
                  <Input {...field} autoCapitalize='none' spellCheck={false} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Category description')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
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
        </form>
      </Form>
    </Dialog>
  )
}

function emptyCategoryValues(): CategoryFormValues {
  return {
    name: '',
    slug: '',
    description: '',
    sortOrder: 10,
  }
}
