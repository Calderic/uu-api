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

import { homeLayoutClasses } from '../home-layout'

interface CounterProps {
  decimals?: number
  duration?: number
  end: number
  prefix?: string
  suffix?: string
}

function Counter(props: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(false)
  const decimals = props.decimals ?? 0
  const duration = props.duration ?? 1600
  const prefix = props.prefix ?? ''
  const suffix = props.suffix ?? ''

  const formatValue = useCallback(
    (value: number) =>
      decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value).toLocaleString(),
    [decimals]
  )

  const animate = useCallback(() => {
    const element = ref.current
    if (!element) return

    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      element.textContent = `${prefix}${formatValue(eased * props.end)}${suffix}`

      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }

    requestAnimationFrame(step)
  }, [duration, formatValue, prefix, props.end, suffix])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (reduceMotion) {
      element.textContent = `${prefix}${formatValue(props.end)}${suffix}`
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || startedRef.current) return

        startedRef.current = true
        animate()
        observer.unobserve(element)
      },
      { threshold: 0.45 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [animate, formatValue, prefix, props.end, suffix])

  return (
    <span ref={ref} className='tabular-nums'>
      {prefix}0{suffix}
    </span>
  )
}

interface StatItem {
  end: number
  label: string
  suffix: string
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
    <section
      data-home-section='performance'
      className='relative z-20 overflow-hidden bg-[var(--home-tint)] py-24 md:py-36'
    >
      <div
        aria-hidden='true'
        className='home-performance-type absolute -top-[0.18em] -right-[0.06em] font-mono text-[clamp(8rem,28vw,31rem)] leading-none font-semibold tracking-[-0.1em] text-[var(--home-line)] select-none'
      >
        99
      </div>

      <div className='relative mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8'>
        <AnimateInView className='grid gap-10 md:grid-cols-[minmax(0,0.7fr)_minmax(24rem,1.3fr)] md:items-end md:gap-20'>
          <div>
            <p className='font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--home-muted)] uppercase'>
              02 — {t('High Performance')}
            </p>
            <div className='mt-8 flex items-center gap-4 font-mono text-xs'>
              <span className='home-live-dot' aria-hidden='true' />
              <span>NETWORK / ONLINE</span>
            </div>
          </div>

          <h2 className='max-w-[13ch] text-[clamp(3rem,7.4vw,7.6rem)] leading-[0.9] font-semibold tracking-[-0.065em] md:justify-self-end'>
            {t('Powerful API Management Platform')}
          </h2>
        </AnimateInView>

        <AnimateInView
          animation='fade-up'
          className='mt-16 max-w-2xl text-base leading-relaxed text-[var(--home-muted)] md:mt-24 md:text-xl'
          delay={100}
        >
          {t('Support for high concurrency with automatic load balancing')}
        </AnimateInView>

        <div className={`mt-16 md:mt-24 ${homeLayoutClasses.metrics}`}>
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className='home-proof-cell group relative flex min-h-64 flex-col justify-between overflow-hidden border-r border-b border-[var(--home-line)] px-5 py-7 sm:min-h-72 sm:px-7 sm:py-9'
            >
              <span className='font-mono text-[9px] tracking-[0.18em] text-[var(--home-muted)]'>
                0{index + 1} / 04
              </span>
              <span className='relative z-10 text-[clamp(3.8rem,8vw,7.5rem)] leading-none font-semibold tracking-[-0.075em]'>
                <Counter end={stat.end} suffix={stat.suffix} />
              </span>
              <span className='relative z-10 max-w-36 text-xs leading-relaxed text-[var(--home-muted)]'>
                {stat.label}
              </span>
              <div
                aria-hidden='true'
                className='absolute right-0 bottom-0 h-px w-0 bg-[var(--home-accent)] transition-[width] duration-700 group-hover:w-full'
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
