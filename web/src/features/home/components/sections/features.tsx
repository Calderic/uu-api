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
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Badge } from '@/components/ui/badge'

import { homeLayoutClasses } from '../home-layout'

const MODEL_NAMES = [
  'OpenAI',
  'Claude',
  'Gemini',
  'DeepSeek',
  'Qwen',
  'Llama',
] as const

const ORBIT_NODES = [
  { name: 'OpenAI', className: 'home-orbit-node home-orbit-node-a' },
  { name: 'Claude', className: 'home-orbit-node home-orbit-node-b' },
  { name: 'Gemini', className: 'home-orbit-node home-orbit-node-c' },
  { name: 'Qwen', className: 'home-orbit-node home-orbit-node-d' },
] as const

const API_ROUTES = [
  '/v1/responses',
  '/v1/messages',
  '/v1/chat/completions',
] as const

export function Features() {
  const { t } = useTranslation()

  const capabilities = [
    {
      number: '02',
      icon: FlashIcon,
      title: t('Lightning Fast'),
      description: t(
        'Optimized network architecture ensures millisecond response times'
      ),
      meta: '096 MS',
    },
    {
      number: '03',
      icon: SecurityCheckIcon,
      title: t('Secure & Reliable'),
      description: t(
        'Enterprise-grade security with comprehensive permission management'
      ),
      meta: 'TLS / RBAC',
    },
    {
      number: '04',
      icon: DollarCircleIcon,
      title: t('Transparent Billing'),
      description: t('Pay-as-you-go with real-time usage monitoring'),
      meta: 'TOKEN × RATE',
    },
    {
      number: '05',
      icon: GlobalIcon,
      title: t('Global Coverage'),
      description: t('Multi-region deployment for stable global access'),
      meta: 'AP / EU / US',
    },
  ]

  return (
    <section
      data-home-section='capabilities'
      className='relative z-20 rounded-t-[2rem] bg-[var(--home-canvas)] pt-24 shadow-[0_-28px_90px_-44px_var(--home-shadow)] sm:rounded-t-[3rem] md:pt-32'
    >
      <div className='mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8'>
        <div className='grid gap-10 pb-16 md:grid-cols-[minmax(0,0.88fr)_minmax(24rem,1.12fr)] md:items-end md:gap-16 md:pb-24'>
          <AnimateInView>
            <p className='font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--home-muted)] uppercase'>
              01 — {t('Core Features')}
            </p>
            <h2 className='mt-5 max-w-[11ch] text-[clamp(3rem,7vw,7rem)] leading-[0.88] font-semibold tracking-[-0.065em]'>
              {t('Built for developers,')}
              <br />
              <span className='text-[var(--home-muted)]'>
                {t('designed for scale')}
              </span>
            </h2>
          </AnimateInView>

          <AnimateInView
            animation='fade-up'
            className='md:justify-self-end'
            delay={100}
          >
            <p className='max-w-xl text-base leading-relaxed text-[var(--home-muted)] sm:text-lg md:text-xl'>
              {t(
                'Connect through OpenAI, Claude, Gemini, and other compatible API routes'
              )}
            </p>
            <div className='mt-8 flex items-center gap-3 font-mono text-[10px] tracking-[0.16em] text-[var(--home-muted)] uppercase'>
              <span className='home-live-dot' aria-hidden='true' />
              {t('Multi-protocol Compatible')}
            </div>
          </AnimateInView>
        </div>

        <div className={homeLayoutClasses.featureGrid}>
          <AnimateInView
            animation='scale-in'
            className='home-orbit-stage relative min-h-[28rem] overflow-hidden border-b border-[var(--home-line)] lg:min-h-[44rem] lg:border-r lg:border-b-0'
          >
            <div className='home-orbit-coordinate' aria-hidden='true' />
            <div className='home-orbit home-orbit-outer' aria-hidden='true' />
            <div className='home-orbit home-orbit-middle' aria-hidden='true' />
            <div className='home-orbit home-orbit-inner' aria-hidden='true' />
            <div
              className='home-orbit-axis home-orbit-axis-x'
              aria-hidden='true'
            />
            <div
              className='home-orbit-axis home-orbit-axis-y'
              aria-hidden='true'
            />

            {ORBIT_NODES.map((node) => (
              <span key={node.name} className={node.className}>
                {node.name}
              </span>
            ))}

            <div className='home-orbit-core'>
              <HugeiconsIcon
                aria-hidden='true'
                icon={Route01Icon}
                size={22}
                strokeWidth={1.6}
              />
              <span>{t('AI Gateway')}</span>
            </div>

            <div className='absolute top-6 left-6 font-mono text-[9px] tracking-[0.18em] text-[var(--home-muted)] uppercase sm:top-8 sm:left-8'>
              SIGNAL MAP / 24—7
            </div>
            <div className='absolute right-6 bottom-6 text-right font-mono text-[9px] leading-relaxed tracking-[0.16em] text-[var(--home-muted)] uppercase sm:right-8 sm:bottom-8'>
              LAT 37.5665
              <br />
              LNG 126.9780
            </div>
          </AnimateInView>

          <AnimateInView
            animation='fade-left'
            className='flex min-h-[34rem] flex-col justify-between px-6 py-8 sm:px-9 sm:py-10 lg:min-h-[44rem] lg:px-12 lg:py-14'
            delay={80}
          >
            <div>
              <div className='flex items-center justify-between gap-4'>
                <span className='font-mono text-[10px] tracking-[0.18em] text-[var(--home-muted)]'>
                  01 / ACCESS
                </span>
                <Badge variant='outline'>{t('Model Access')}</Badge>
              </div>
              <h3 className='mt-9 max-w-[11ch] text-[clamp(2.45rem,5vw,5.5rem)] leading-[0.94] font-semibold tracking-[-0.055em]'>
                {t('Every model. One gateway. No lock-in.')}
              </h3>
            </div>

            <div className='mt-14'>
              <div className='mb-4 flex items-center gap-3 text-[var(--home-accent)]'>
                <HugeiconsIcon
                  aria-hidden='true'
                  icon={CodeIcon}
                  size={18}
                  strokeWidth={1.7}
                />
                <span className='font-mono text-[10px] tracking-[0.16em] uppercase'>
                  {t('Your Request')}
                </span>
              </div>
              <div className='divide-y divide-[var(--home-line)] border-y border-[var(--home-line)]'>
                {API_ROUTES.map((route, index) => (
                  <div
                    key={route}
                    className='group flex items-center gap-4 py-4 font-mono text-[11px]'
                  >
                    <span className='text-[var(--home-muted)]'>
                      0{index + 1}
                    </span>
                    <code className='min-w-0 flex-1 truncate'>{route}</code>
                    <span
                      aria-hidden='true'
                      className='h-px w-8 origin-right bg-[var(--home-accent)] transition-transform duration-500 group-hover:scale-x-150'
                    />
                    <span className='text-[var(--home-muted)]'>POST</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimateInView>
        </div>
      </div>

      <div className='mt-16 overflow-hidden md:mt-24'>
        <div className={homeLayoutClasses.signalRail}>
          {[false, true].map((isDuplicate) =>
            MODEL_NAMES.map((model) => (
              <div
                key={`${model}-${isDuplicate ? 'duplicate' : 'original'}`}
                aria-hidden={isDuplicate}
                className='flex items-center'
              >
                <span className='px-8 text-[clamp(1.5rem,3vw,3rem)] font-semibold tracking-[-0.04em] whitespace-nowrap sm:px-12'>
                  {model}
                </span>
                <span
                  aria-hidden='true'
                  className='size-1.5 rounded-full bg-[var(--home-accent)]'
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div className='mx-auto grid max-w-[90rem] border-x border-[var(--home-line)] sm:grid-cols-2 lg:grid-cols-4'>
        {capabilities.map((capability) => (
          <AnimateInView
            key={capability.number}
            animation='fade-up'
            className='group flex min-h-72 flex-col justify-between border-r border-b border-[var(--home-line)] p-6 transition-colors duration-500 hover:bg-[var(--home-panel-hover)] sm:p-8'
            delay={Number(capability.number) * 35}
          >
            <div className='flex items-start justify-between'>
              <span className='font-mono text-[10px] text-[var(--home-muted)]'>
                {capability.number}
              </span>
              <HugeiconsIcon
                aria-hidden='true'
                className='text-[var(--home-accent)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-6'
                icon={capability.icon}
                size={24}
                strokeWidth={1.5}
              />
            </div>
            <div>
              <span className='font-mono text-[9px] tracking-[0.14em] text-[var(--home-muted)]'>
                {capability.meta}
              </span>
              <h3 className='mt-4 text-xl font-semibold tracking-[-0.025em]'>
                {capability.title}
              </h3>
              <p className='mt-3 text-sm leading-relaxed text-[var(--home-muted)]'>
                {capability.description}
              </p>
            </div>
          </AnimateInView>
        ))}
      </div>
    </section>
  )
}
