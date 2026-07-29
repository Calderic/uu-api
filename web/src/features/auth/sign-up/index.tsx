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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import loginBannerDark from '@/assets/auth/login-banner-dark.webp'
import loginBannerLight from '@/assets/auth/login-banner-light.webp'
import { useStatus } from '@/hooks/use-status'

import { AuthLayout } from '../auth-layout'
import { TermsFooter } from '../components/terms-footer'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  const { t } = useTranslation()
  const { status } = useStatus()

  return (
    <AuthLayout
      variant='split'
      visualSrc={loginBannerLight}
      darkVisualSrc={loginBannerDark}
      formSize='wide'
      showVisualOnMobile={false}
    >
      <div className='flex w-full flex-col gap-7'>
        <div className='flex flex-col gap-2.5'>
          <h2 className='text-3xl font-semibold tracking-tight'>
            {t('Create an account')}
          </h2>
          <p className='text-muted-foreground max-w-sm text-sm leading-6'>
            {t('One account connects all AI services')}
          </p>
        </div>

        <SignUpForm />

        <div className='flex flex-col gap-6'>
          <p className='text-muted-foreground text-center text-sm'>
            {t('Already have an account?')}{' '}
            <Link
              to='/sign-in'
              className='text-foreground font-medium underline underline-offset-4 transition-opacity hover:opacity-70'
            >
              {t('Sign in')}
            </Link>
            .
          </p>

          <TermsFooter
            variant='sign-up'
            status={status}
            className='text-center'
          />
        </div>
      </div>
    </AuthLayout>
  )
}
