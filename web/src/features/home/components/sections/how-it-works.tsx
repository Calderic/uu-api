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
  Analytics01Icon,
  CodeIcon,
  Route01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  motion,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { useMediaQuery } from '@/hooks/use-media-query'

import { homeLayoutClasses } from '../home-layout'

interface ConnectionLineProps {
  progress: MotionValue<number>
  range: [number, number]
  interactive: boolean
}

function ConnectionLine(props: ConnectionLineProps) {
  const scaleX = useTransform(props.progress, props.range, [0, 1])
  const dotLeft = useTransform(props.progress, props.range, ['0%', '100%'])
  const dotOpacity = useTransform(
    props.progress,
    [
      props.range[0],
      props.range[0] + 0.02,
      props.range[1] - 0.02,
      props.range[1],
    ],
    [0, 1, 1, 0]
  )

  return (
    <div className='relative h-px flex-1 bg-[var(--home-flow-line)]'>
      {props.interactive ? (
        <>
          <motion.span
            aria-hidden='true'
            className='absolute inset-0 origin-left bg-[var(--home-flow-accent)]'
            style={{ scaleX }}
          />
          <motion.span
            aria-hidden='true'
            className='absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--home-flow-accent)] shadow-[0_0_12px_var(--home-flow-accent)]'
            style={{ left: dotLeft, opacity: dotOpacity }}
          />
        </>
      ) : (
        <span className='absolute inset-0 bg-[var(--home-flow-accent)]' />
      )}
    </div>
  )
}

interface ModelNodeProps {
  interactive: boolean
  model: string
  progress: MotionValue<number>
  start: number
}

function ModelNode(props: ModelNodeProps) {
  const opacity = useTransform(
    props.progress,
    [props.start, props.start + 0.05, 1],
    [0, 1, 1]
  )

  return (
    <div className='relative border border-[var(--home-flow-line)] px-3 py-2 text-center font-mono text-[10px]'>
      {props.interactive ? (
        <motion.span
          aria-hidden='true'
          className='absolute inset-0 border border-[var(--home-flow-accent)] bg-[var(--home-flow-accent-soft)] shadow-[0_0_20px_var(--home-flow-accent-soft)]'
          style={{ opacity }}
        />
      ) : null}
      <span className='relative'>{props.model}</span>
    </div>
  )
}

interface StepNarrativeProps {
  description: string
  fadeIn: [number, number]
  fadeOut?: [number, number]
  progress: MotionValue<number>
  title: string
}

function StepNarrative(props: StepNarrativeProps) {
  const inputRange = props.fadeOut
    ? [props.fadeIn[0], props.fadeIn[1], props.fadeOut[0], props.fadeOut[1]]
    : [props.fadeIn[0], props.fadeIn[1], 1]
  const opacity = useTransform(
    props.progress,
    inputRange,
    props.fadeOut ? [0, 1, 1, 0] : [0, 1, 1]
  )
  const y = useTransform(
    props.progress,
    inputRange,
    props.fadeOut ? [20, 0, 0, -16] : [20, 0, 0]
  )

  return (
    <motion.div
      className='absolute inset-0 flex flex-col items-center justify-center text-center'
      style={{ opacity, y }}
    >
      <h3 className='text-xl font-semibold md:text-2xl'>{props.title}</h3>
      <p className='mt-2 max-w-md text-sm leading-relaxed text-[var(--home-flow-muted)]'>
        {props.description}
      </p>
    </motion.div>
  )
}

export function HowItWorks() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLElement>(null)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const reducedMotion = Boolean(useReducedMotion())
  const interactive = isDesktop && !reducedMotion
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const stageOpacity = useTransform(scrollYProgress, [0, 0.05, 1], [0, 1, 1])
  const gatewayScale = useTransform(scrollYProgress, [0.72, 0.9], [0.85, 1.3])
  const gatewayPulse = useTransform(
    scrollYProgress,
    [0.72, 0.78, 0.95],
    [0, 0.55, 0]
  )
  const latency = useTransform(scrollYProgress, [0.7, 0.92], [0, 96], {
    clamp: true,
  })
  const latencyText = useTransform(latency, (value) => `${Math.round(value)}`)
  const tokens = useTransform(scrollYProgress, [0.7, 0.92], [0, 2148], {
    clamp: true,
  })
  const tokenText = useTransform(tokens, (value) =>
    Math.round(value).toLocaleString()
  )

  const steps = [
    {
      num: '01',
      title: t('Send'),
      description: t(
        'Connect through OpenAI, Claude, Gemini, and other compatible API routes'
      ),
      icon: CodeIcon,
      fadeIn: [0.04, 0.09] as [number, number],
      fadeOut: [0.3, 0.35] as [number, number],
    },
    {
      num: '02',
      title: t('Route'),
      description: t(
        'Support for high concurrency with automatic load balancing'
      ),
      icon: Route01Icon,
      fadeIn: [0.36, 0.41] as [number, number],
      fadeOut: [0.6, 0.65] as [number, number],
    },
    {
      num: '03',
      title: t('Monitor'),
      description: t(
        'Track usage, costs and performance with real-time analytics'
      ),
      icon: Analytics01Icon,
      fadeIn: [0.68, 0.73] as [number, number],
      fadeOut: undefined,
    },
  ]

  return (
    <section ref={sectionRef} className={homeLayoutClasses.flowStage}>
      <div className={homeLayoutClasses.flowViewport}>
        <div
          aria-hidden='true'
          className='home-flow-grid pointer-events-none absolute inset-0'
        />
        <div
          aria-hidden='true'
          className='home-flow-spotlight pointer-events-none absolute inset-0'
        />

        <motion.div
          className='relative mx-auto w-full max-w-[80rem] px-4 py-20 sm:px-6 lg:px-8 lg:py-0'
          style={interactive ? { opacity: stageOpacity } : undefined}
        >
          <div className='flex flex-wrap items-end justify-between gap-6'>
            <div>
              <p className='font-mono text-[10px] font-semibold tracking-[0.18em] text-[var(--home-flow-muted)] uppercase'>
                {t('Request flow')}
              </p>
              <h2 className='mt-4 max-w-[30rem] text-3xl leading-tight font-semibold tracking-[-0.035em] md:text-5xl'>
                {t('One request, fully visible')}
              </h2>
            </div>

            <div className='flex items-center gap-8 font-mono'>
              <div>
                <span className='block text-[10px] font-semibold tracking-[0.18em] text-[var(--home-flow-muted)] uppercase'>
                  {t('Latency')}
                </span>
                <span className='mt-1 block text-2xl font-semibold tabular-nums md:text-3xl'>
                  {interactive ? (
                    <motion.span>{latencyText}</motion.span>
                  ) : (
                    '96'
                  )}
                  <span className='ml-1 text-sm text-[var(--home-flow-muted)]'>
                    ms
                  </span>
                </span>
              </div>
              <div>
                <span className='block text-[10px] font-semibold tracking-[0.18em] text-[var(--home-flow-muted)] uppercase'>
                  {t('Tokens')}
                </span>
                <span className='mt-1 block text-2xl font-semibold text-[var(--home-flow-accent)] tabular-nums md:text-3xl'>
                  {interactive ? (
                    <motion.span>{tokenText}</motion.span>
                  ) : (
                    '2,148'
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className='mt-14 flex items-center gap-3 sm:gap-4 lg:mt-20'>
            <div className='shrink-0 border border-[var(--home-flow-line)] bg-[var(--home-flow-panel)] px-3 py-3 text-xs font-semibold sm:px-4 sm:text-sm'>
              {t('Your Request')}
            </div>

            <ConnectionLine
              progress={scrollYProgress}
              range={[0.06, 0.26]}
              interactive={interactive}
            />

            <div className='relative shrink-0'>
              {interactive ? (
                <motion.span
                  aria-hidden='true'
                  className='absolute -inset-3 rounded-2xl border border-[var(--home-flow-accent)]'
                  style={{ scale: gatewayScale, opacity: gatewayPulse }}
                />
              ) : null}
              <div className='relative border border-[var(--home-flow-accent)] bg-[var(--home-flow-accent-soft)] px-4 py-3 shadow-[0_0_40px_var(--home-flow-accent-soft)]'>
                <Badge variant='outline'>{t('AI Gateway')}</Badge>
              </div>
            </div>

            <ConnectionLine
              progress={scrollYProgress}
              range={[0.36, 0.52]}
              interactive={interactive}
            />

            <div className='flex w-20 shrink-0 flex-col gap-2 sm:w-28'>
              <ModelNode
                model='OpenAI'
                progress={scrollYProgress}
                start={0.52}
                interactive={interactive}
              />
              <ModelNode
                model='Claude'
                progress={scrollYProgress}
                start={0.58}
                interactive={interactive}
              />
              <ModelNode
                model='Gemini'
                progress={scrollYProgress}
                start={0.64}
                interactive={interactive}
              />
            </div>
          </div>

          {interactive ? (
            <div className='relative mt-14 h-28 lg:mt-20'>
              {steps.map((step) => (
                <StepNarrative
                  key={step.num}
                  title={step.title}
                  description={step.description}
                  progress={scrollYProgress}
                  fadeIn={step.fadeIn}
                  fadeOut={step.fadeOut}
                />
              ))}
            </div>
          ) : (
            <div className='mt-12 grid gap-8 md:grid-cols-3'>
              {steps.map((step) => (
                <div key={step.num} className='flex items-start gap-4'>
                  <div className='flex size-10 shrink-0 items-center justify-center border border-[var(--home-flow-line)] text-[var(--home-flow-accent)]'>
                    <HugeiconsIcon icon={step.icon} strokeWidth={1.7} />
                  </div>
                  <div>
                    <span className='font-mono text-[10px] text-[var(--home-flow-muted)]'>
                      {step.num}
                    </span>
                    <h3 className='mt-1 text-base font-semibold'>
                      {step.title}
                    </h3>
                    <p className='mt-2 text-sm leading-relaxed text-[var(--home-flow-muted)]'>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
