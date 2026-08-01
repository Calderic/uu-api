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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type {
  DocumentationSettings,
  DocumentationSettingsInput,
} from '@/features/documentation/types'

const settingsSchema = z.object({
  siteName: z.string().trim().min(1),
  siteDescription: z.string(),
  baseUrl: z.string(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

type DocumentationSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings?: DocumentationSettings
  isSaving: boolean
  onSave: (input: DocumentationSettingsInput) => Promise<void>
}

const SETTINGS_FORM_ID = 'documentation-settings-form'

export function DocumentationSettingsDialog(
  props: DocumentationSettingsDialogProps
) {
  const { t } = useTranslation()
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(
      settingsSchema
    ) as unknown as Resolver<SettingsFormValues>,
    defaultValues: {
      siteName: 'API Documentation',
      siteDescription: '',
      baseUrl: '',
    },
  })

  useEffect(() => {
    if (!props.open || !props.settings) return
    form.reset({
      siteName: props.settings.site_name,
      siteDescription: props.settings.site_description,
      baseUrl: props.settings.base_url,
    })
  }, [form, props.open, props.settings])

  const onSubmit = async (values: SettingsFormValues) => {
    await props.onSave({
      site_name: values.siteName.trim(),
      site_description: values.siteDescription.trim(),
      base_url: values.baseUrl.trim().replace(/\/+$/, ''),
    })
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={t('Documentation settings')}
      description={t(
        'Configure the public name, introduction, and canonical origin for docs and LLM links.'
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
            name='siteName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Documentation site name')}</FormLabel>
                <FormControl>
                  <Input {...field} autoFocus />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='siteDescription'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Documentation introduction')}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
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
                  {t('Leave blank to use the current request origin.')}
                </FormDescription>
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  )
}
