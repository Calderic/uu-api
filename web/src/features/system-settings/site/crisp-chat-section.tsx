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
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

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
import { Switch } from '@/components/ui/switch'

import { FormDirtyIndicator } from '../components/form-dirty-indicator'
import { FormNavigationGuard } from '../components/form-navigation-guard'
import {
  SettingsForm,
  SettingsSwitchContent,
  SettingsSwitchItem,
} from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useSettingsForm } from '../hooks/use-settings-form'
import { useUpdateOption } from '../hooks/use-update-option'

const createCrispChatSchema = (t: (key: string) => string) =>
  z
    .object({
      CrispEnabled: z.boolean(),
      CrispWebsiteId: z
        .string()
        .trim()
        .refine(
          (value) => value === '' || /^[a-zA-Z0-9-]+$/.test(value),
          t('Enter a valid Crisp Website ID')
        ),
    })
    .superRefine((values, ctx) => {
      if (values.CrispEnabled && !values.CrispWebsiteId) {
        ctx.addIssue({
          code: 'custom',
          path: ['CrispWebsiteId'],
          message: t(
            'A Crisp Website ID is required when Crisp Chat is enabled.'
          ),
        })
      }
    })

type CrispChatFormValues = z.infer<ReturnType<typeof createCrispChatSchema>>

type CrispChatSectionProps = {
  defaultValues: Pick<CrispChatFormValues, 'CrispEnabled' | 'CrispWebsiteId'>
}

export function CrispChatSection(props: CrispChatSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const crispChatSchema = createCrispChatSchema(t)

  const { form, handleSubmit, handleReset, isDirty, isSubmitting } =
    useSettingsForm<CrispChatFormValues>({
      resolver: zodResolver(crispChatSchema),
      defaultValues: {
        CrispEnabled: props.defaultValues.CrispEnabled,
        CrispWebsiteId: props.defaultValues.CrispWebsiteId.trim(),
      },
      onSubmit: async (_values, changedFields) => {
        for (const [key, value] of Object.entries(changedFields)) {
          await updateOption.mutateAsync({
            key,
            value:
              key === 'CrispWebsiteId' ? String(value).trim() : Boolean(value),
          })
        }
      },
    })

  return (
    <>
      <FormNavigationGuard when={isDirty} />

      <SettingsSection title={t('Crisp Chat')}>
        <Form {...form}>
          <SettingsForm onSubmit={handleSubmit} autoComplete='off'>
            <SettingsPageFormActions
              onSave={handleSubmit}
              onReset={handleReset}
              isSaving={isSubmitting || updateOption.isPending}
              isResetDisabled={!isDirty}
            />
            <FormDirtyIndicator isDirty={isDirty} />

            <FormField
              control={form.control}
              name='CrispEnabled'
              render={({ field }) => (
                <SettingsSwitchItem>
                  <SettingsSwitchContent>
                    <FormLabel>{t('Enable Crisp Chat')}</FormLabel>
                    <FormDescription>
                      {t(
                        'The chat widget loads asynchronously after the page becomes idle and is hidden on the landing page.'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </SettingsSwitchContent>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </SettingsSwitchItem>
              )}
            />

            <FormField
              control={form.control}
              name='CrispWebsiteId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Crisp Website ID')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete='off'
                      spellCheck={false}
                      placeholder='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                    />
                  </FormControl>
                  <FormDescription>
                    {t('Enter the Website ID from your Crisp workspace.')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </SettingsForm>
        </Form>
      </SettingsSection>
    </>
  )
}
