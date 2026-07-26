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
import { Textarea } from '@/components/ui/textarea'

import type { BlogSettings } from './types'

const settingsSchema = z.object({
  blogName: z.string().trim().min(1),
  blogDescription: z.string(),
  articlesPerPage: z.coerce.number().int().min(1).max(100),
  baseUrl: z.string(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

type BlogSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings?: BlogSettings
  isSaving: boolean
  onSave: (input: Omit<BlogSettings, 'id' | 'updated_at'>) => Promise<void>
}

const SETTINGS_FORM_ID = 'blog-settings-form'

export function BlogSettingsDialog(props: BlogSettingsDialogProps) {
  const { t } = useTranslation()
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(
      settingsSchema
    ) as unknown as Resolver<SettingsFormValues>,
    defaultValues: {
      blogName: 'Blog',
      blogDescription: '',
      articlesPerPage: 12,
      baseUrl: '',
    },
  })

  useEffect(() => {
    if (!props.open || !props.settings) return
    form.reset({
      blogName: props.settings.blog_name,
      blogDescription: props.settings.blog_description,
      articlesPerPage: props.settings.articles_per_page,
      baseUrl: props.settings.base_url,
    })
  }, [props.open, props.settings, form])

  const onSubmit = async (values: SettingsFormValues) => {
    await props.onSave({
      blog_name: values.blogName.trim(),
      blog_description: values.blogDescription.trim(),
      articles_per_page: values.articlesPerPage,
      default_cta_config: props.settings?.default_cta_config ?? {},
      base_url: values.baseUrl.trim().replace(/\/+$/, ''),
    })
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('Blog settings')}
      description={t(
        'Configure public metadata and the canonical origin used by search engines.'
      )}
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
            form={SETTINGS_FORM_ID}
            disabled={props.isSaving}
          >
            {props.isSaving ? t('Saving...') : t('Save Changes')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id={SETTINGS_FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='blogName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Blog name')}</FormLabel>
                <FormControl>
                  <Input {...field} autoFocus />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='blogDescription'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Blog description')}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='articlesPerPage'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Articles per page')}</FormLabel>
                <FormControl>
                  <Input {...field} type='number' min={1} max={100} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='baseUrl'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Canonical site URL')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='url'
                    placeholder='https://www.example.com'
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'Use the same origin as the previously indexed blog URLs.'
                  )}
                </FormDescription>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  )
}
