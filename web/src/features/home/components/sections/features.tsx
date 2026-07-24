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
  CodeIcon,
  DollarCircleIcon,
  FlashIcon,
  GlobalIcon,
  Route01Icon,
  SecurityCheckIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { homeLayoutClasses } from '../home-layout'

const MODEL_NAMES = ['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Qwen', 'Llama']
const API_ROUTES = ['/v1/responses', '/v1/messages', '/v1/chat/completions']

export function Features() {
  const { t } = useTranslation()

  const compactFeatures = [
    {
      icon: SecurityCheckIcon,
      title: t('Secure & Reliable'),
      description: t(
        'Enterprise-grade security with comprehensive permission management'
      ),
    },
    {
      icon: DollarCircleIcon,
      title: t('Transparent Billing'),
      description: t('Pay-as-you-go with real-time usage monitoring'),
    },
    {
      icon: GlobalIcon,
      title: t('Global Coverage'),
      description: t('Multi-region deployment for stable global access'),
    },
    {
      icon: UserGroupIcon,
      title: t('Team Collaboration'),
      description: t(
        'Multi-user management with flexible permission allocation'
      ),
    },
  ]

  return (
    <section className='relative z-20 bg-[var(--home-canvas)] px-4 py-20 sm:px-6 md:py-28 lg:rounded-t-[2.5rem] lg:px-8 lg:shadow-[0_-28px_80px_-36px_var(--home-shadow)]'>
      <div className='mx-auto max-w-[80rem]'>
        <AnimateInView className='mb-14 max-w-2xl md:mb-20'>
          <p className='mb-4 font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--home-muted)] uppercase'>
            {t('Core Features')}
          </p>
          <h2 className='text-3xl leading-[1.02] font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl'>
            {t('Built for developers,')}
            <br />
            {t('designed for scale')}
          </h2>
        </AnimateInView>

        <div className={homeLayoutClasses.featureGrid}>
          <AnimateInView
            className='group bg-[var(--home-panel)] p-6 transition-colors hover:bg-[var(--home-panel-hover)] sm:p-8 md:col-span-2 md:min-h-[22rem]'
            animation='fade-up'
          >
            <div className='flex items-start justify-between gap-6'>
              <div>
                <div className='mb-5 flex size-9 items-center justify-center border border-[var(--home-line)] bg-[var(--home-tint)] text-[var(--home-accent)]'>
                  <HugeiconsIcon icon={Route01Icon} strokeWidth={1.7} />
                </div>
                <h3 className='text-base font-semibold'>{t('Model Access')}</h3>
                <p className='mt-2 max-w-xl text-sm leading-relaxed text-[var(--home-muted)]'>
                  {t(
                    'Compatible API routes for common AI application workflows'
                  )}
                </p>
              </div>
              <Badge variant='outline'>{t('Multi-protocol Compatible')}</Badge>
            </div>

            <div className='mt-9 border border-[var(--home-line)] bg-[var(--home-tint)] p-4'>
              <div className='flex items-center gap-3'>
                <Badge variant='outline'>{t('Your Request')}</Badge>
                <div className='h-px flex-1 bg-[var(--home-accent)] opacity-60' />
              </div>
              <div className='mt-4 grid grid-cols-2 gap-px bg-[var(--home-line)] sm:grid-cols-3'>
                {MODEL_NAMES.map((name, index) => (
                  <div
                    key={name}
                    className='bg-[var(--home-panel)] px-3 py-3 text-center font-mono text-[11px] text-[var(--home-muted)] transition-colors group-hover:text-[var(--home-ink)]'
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        'mr-2 inline-block size-1.5 rounded-full',
                        index < 3
                          ? 'bg-[var(--home-accent)]'
                          : 'bg-[var(--home-muted)]'
                      )}
                    />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </AnimateInView>

          <AnimateInView
            delay={80}
            className='bg-[var(--home-panel)] p-6 transition-colors hover:bg-[var(--home-panel-hover)] sm:p-8'
            animation='fade-up'
          >
            <div className='flex size-9 items-center justify-center border border-[var(--home-line)] bg-[var(--home-tint)] text-[var(--home-accent)]'>
              <HugeiconsIcon icon={FlashIcon} strokeWidth={1.7} />
            </div>
            <h3 className='mt-5 text-base font-semibold'>
              {t('Lightning Fast')}
            </h3>
            <p className='mt-2 text-sm leading-relaxed text-[var(--home-muted)]'>
              {t(
                'Optimized network architecture ensures millisecond response times'
              )}
            </p>
            <div className='mt-8 flex items-end gap-1.5' aria-hidden='true'>
              {[34, 52, 41, 70, 58, 86, 74, 94].map((height) => (
                <div
                  key={height}
                  className='flex-1 bg-[var(--home-accent)] opacity-70'
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
          </AnimateInView>

          <AnimateInView
            delay={120}
            className='bg-[var(--home-panel)] p-6 transition-colors hover:bg-[var(--home-panel-hover)] sm:p-8'
            animation='fade-up'
          >
            <div className='flex size-9 items-center justify-center border border-[var(--home-line)] bg-[var(--home-tint)] text-[var(--home-accent)]'>
              <HugeiconsIcon icon={CodeIcon} strokeWidth={1.7} />
            </div>
            <h3 className='mt-5 text-base font-semibold'>
              {t('Developer Friendly')}
            </h3>
            <p className='mt-2 text-sm leading-relaxed text-[var(--home-muted)]'>
              {t('One API')}
            </p>
            <div className='mt-7 flex flex-col gap-2'>
              {API_ROUTES.map((route) => (
                <code
                  key={route}
                  className='border border-[var(--home-line)] bg-[var(--home-tint)] px-3 py-2 font-mono text-[11px] text-[var(--home-muted)]'
                >
                  POST {route}
                </code>
              ))}
            </div>
          </AnimateInView>

          <AnimateInView
            delay={160}
            className='bg-[var(--home-panel)] p-6 transition-colors hover:bg-[var(--home-panel-hover)] sm:p-8 md:col-span-2'
            animation='fade-up'
          >
            <div className='flex items-start gap-5'>
              <div className='flex size-9 shrink-0 items-center justify-center border border-[var(--home-line)] bg-[var(--home-tint)] text-[var(--home-accent)]'>
                <HugeiconsIcon icon={GlobalIcon} strokeWidth={1.7} />
              </div>
              <div>
                <h3 className='text-base font-semibold'>
                  {t('Global Coverage')}
                </h3>
                <p className='mt-2 max-w-2xl text-sm leading-relaxed text-[var(--home-muted)]'>
                  {t('Multi-region deployment for stable global access')}
                </p>
              </div>
            </div>
            <div className='mt-8 grid grid-cols-3 gap-3'>
              {['AP-SOUTHEAST', 'EU-WEST', 'US-EAST'].map((region) => (
                <div
                  key={region}
                  className='border border-[var(--home-line)] bg-[var(--home-tint)] p-3'
                >
                  <span className='mb-3 block size-1.5 rounded-full bg-[var(--home-accent)]' />
                  <span className='font-mono text-[10px]'>{region}</span>
                </div>
              ))}
            </div>
          </AnimateInView>
        </div>

        <div className='mt-10 grid gap-px bg-[var(--home-line)] sm:grid-cols-2 lg:grid-cols-4'>
          {compactFeatures.map((feature) => (
            <div
              key={feature.title}
              className='bg-[var(--home-canvas)] p-5 sm:p-6'
            >
              <HugeiconsIcon
                className='text-[var(--home-muted)]'
                icon={feature.icon}
                size={20}
                strokeWidth={1.7}
              />
              <h3 className='mt-4 text-sm font-semibold'>{feature.title}</h3>
              <p className='mt-2 text-xs leading-relaxed text-[var(--home-muted)]'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
