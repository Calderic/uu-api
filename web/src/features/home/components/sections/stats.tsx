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
import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { cn } from '@/lib/utils'

import { homeLayoutClasses } from '../home-layout'

interface CounterProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  decimals?: number
}

function Counter(props: CounterProps) {
  const { end, suffix = '', prefix = '', duration = 1600, decimals = 0 } = props
  const ref = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)

  const formatValue = useCallback(
    (v: number) =>
      decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString(),
    [decimals]
  )

  const animate = useCallback(() => {
    const el = ref.current
    if (!el) return
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      el.textContent = `${prefix}${formatValue(eased * end)}${suffix}`
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration, prefix, suffix, formatValue])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      el.textContent = `${prefix}${formatValue(end)}${suffix}`
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          animate()
          observer.unobserve(el)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [animate, end, prefix, suffix, formatValue])

  return (
    <span ref={ref} className='tabular-nums'>
      {prefix}0{suffix}
    </span>
  )
}

interface StatItem {
  end: number
  suffix: string
  label: string
  decimals?: number
}

export function Stats() {
  const { t } = useTranslation()

  const stats: StatItem[] = [
    { end: 50, suffix: '+', label: t('upstream services integrated') },
    { end: 100, suffix: '+', label: t('model billing support') },
    { end: 50, suffix: '+', label: t('compatible API routes') },
    { end: 10, suffix: '+', label: t('scheduling controls') },
  ]

  return (
    <section className='relative z-20 border-t border-[var(--home-line)] bg-[var(--home-tint)] px-4 py-20 sm:px-6 md:py-28 lg:px-8'>
      <div className='mx-auto max-w-[80rem]'>
        <AnimateInView className='grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-end md:gap-16'>
          <div>
            <p className='font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--home-muted)] uppercase'>
              {t('High Performance')}
            </p>
            <h2 className='mt-4 text-3xl leading-[1.02] font-semibold tracking-[-0.035em] sm:text-4xl md:text-5xl'>
              {t('Powerful API Management Platform')}
            </h2>
          </div>
          <p className='max-w-2xl text-base leading-relaxed text-[var(--home-muted)] md:justify-self-end md:text-lg'>
            {t('Support for high concurrency with automatic load balancing')}
          </p>
        </AnimateInView>

        <div className={cn('mt-14', homeLayoutClasses.metrics)}>
          {stats.map((s) => (
            <div
              key={s.label}
              className='home-metric-card flex min-h-36 flex-col justify-between border-r border-b border-[var(--home-line)] p-5 sm:min-h-44 sm:p-7'
            >
              <span className='text-4xl font-semibold tracking-[-0.045em] sm:text-5xl'>
                <Counter end={s.end} suffix={s.suffix} decimals={s.decimals} />
              </span>
              <span className='max-w-32 text-xs leading-relaxed text-[var(--home-muted)]'>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
