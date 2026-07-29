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
import { Link, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import loginBannerDark from '@/assets/auth/login-banner-dark.webp'
import loginBannerLight from '@/assets/auth/login-banner-light.webp'
import { useStatus } from '@/hooks/use-status'

import { AuthLayout } from '../auth-layout'
import { TermsFooter } from '../components/terms-footer'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { t } = useTranslation()
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const { status } = useStatus()

  return (
    <AuthLayout
      variant='split'
      visualSrc={loginBannerLight}
      darkVisualSrc={loginBannerDark}
    >
      <div className='flex w-full flex-col gap-7'>
        <div className='flex flex-col gap-2.5'>
          <h2 className='flex items-center gap-2 text-3xl font-semibold tracking-tight'>
            {t('Welcome back!')}
            <span aria-hidden='true'>👋</span>
          </h2>
          <p className='text-muted-foreground max-w-sm text-sm leading-6'>
            {t('One account connects all AI services')}
          </p>
        </div>

        <UserAuthForm redirectTo={redirect} />

        <div className='flex flex-col gap-6'>
          {!status?.self_use_mode_enabled &&
            status?.register_enabled !== false && (
              <p className='text-muted-foreground text-center text-sm'>
                {t("Don't have an account?")}{' '}
                <Link
                  to='/sign-up'
                  className='text-foreground font-medium underline underline-offset-4 transition-opacity hover:opacity-70'
                >
                  {t('Sign up')}
                </Link>
                .
              </p>
            )}

          <TermsFooter
            variant='sign-in'
            status={status}
            className='text-center'
          />
        </div>
      </div>
    </AuthLayout>
  )
}
