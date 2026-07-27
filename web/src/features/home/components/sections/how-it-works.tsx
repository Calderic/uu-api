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

import { useMediaQuery } from '@/hooks/use-media-query'

import { homeLayoutClasses } from '../home-layout'

interface FlowStep {
  description: string
  icon: typeof CodeIcon
  number: string
  title: string
}

interface FlowNarrativeProps {
  index: number
  progress: MotionValue<number>
  step: FlowStep
}

function FlowNarrative(props: FlowNarrativeProps) {
  const start = props.index * 0.31
  const end = Math.min(start + 0.18, 0.92)
  const fadeStart = Math.min(end + 0.12, 0.92)
  const fadeEnd = Math.min(fadeStart + 0.1, 1)
  const opacity = useTransform(
    props.progress,
    [start, end, fadeStart, fadeEnd],
    [0.12, 1, 1, props.index === 2 ? 1 : 0.12]
  )
  const x = useTransform(props.progress, [start, end], [-24, 0])

  return (
    <motion.article
      className='absolute inset-0 flex flex-col justify-center'
      style={{ opacity, x }}
    >
      <div className='mb-7 flex items-center gap-4'>
        <span className='flex size-11 items-center justify-center border border-[var(--home-flow-line)] text-[var(--home-flow-accent)]'>
          <HugeiconsIcon
            aria-hidden='true'
            icon={props.step.icon}
            size={20}
            strokeWidth={1.5}
          />
        </span>
        <span className='font-mono text-[10px] tracking-[0.2em] text-[var(--home-flow-muted)]'>
          {props.step.number} / 03
        </span>
      </div>
      <h3 className='text-[clamp(2.8rem,5vw,5.4rem)] leading-[0.9] font-semibold tracking-[-0.06em]'>
        {props.step.title}
      </h3>
      <p className='mt-6 max-w-md text-sm leading-relaxed text-[var(--home-flow-muted)] md:text-base'>
        {props.step.description}
      </p>
    </motion.article>
  )
}

interface ModelNodeProps {
  interactive: boolean
  model: string
  progress: MotionValue<number>
  range: [number, number]
}

function ModelNode(props: ModelNodeProps) {
  const opacity = useTransform(props.progress, props.range, [0.18, 1])

  return (
    <div className='relative flex items-center justify-between border-t border-[var(--home-flow-line)] px-4 py-3 font-mono text-[10px]'>
      {props.interactive ? (
        <motion.span
          aria-hidden='true'
          className='absolute inset-0 bg-[var(--home-flow-accent-soft)]'
          style={{ opacity }}
        />
      ) : null}
      <span className='relative'>{props.model}</span>
      <span className='relative flex items-center gap-2 text-[var(--home-flow-muted)]'>
        <span className='size-1.5 rounded-full bg-[var(--home-flow-accent)]' />
        READY
      </span>
    </div>
  )
}

interface RequestInstrumentProps {
  interactive: boolean
  latency: MotionValue<string>
  progress: MotionValue<number>
  tokens: MotionValue<string>
}

function RequestInstrument(props: RequestInstrumentProps) {
  const requestLine = useTransform(props.progress, [0.04, 0.3], [0, 1])
  const gatewayGlow = useTransform(
    props.progress,
    [0.27, 0.42, 0.58],
    [0.08, 0.64, 0.18]
  )
  const responseLine = useTransform(props.progress, [0.46, 0.78], [0, 1])
  const scanY = useTransform(props.progress, [0.04, 0.94], ['4%', '92%'])

  return (
    <div className='home-request-instrument relative min-h-[34rem] overflow-hidden border border-[var(--home-flow-line)] bg-[var(--home-flow-panel)] sm:min-h-[38rem]'>
      {props.interactive ? (
        <motion.div
          aria-hidden='true'
          className='home-instrument-scan pointer-events-none absolute right-0 left-0 z-20 h-px bg-[var(--home-flow-accent)]'
          style={{ top: scanY }}
        />
      ) : null}

      <div className='flex items-center justify-between border-b border-[var(--home-flow-line)] px-4 py-3 font-mono text-[9px] tracking-[0.16em] text-[var(--home-flow-muted)]'>
        <span>TRACE / 8F41-A90C</span>
        <span className='flex items-center gap-2'>
          <span className='home-live-dot' aria-hidden='true' />
          LIVE
        </span>
      </div>

      <div className='grid min-h-[31rem] sm:grid-cols-[minmax(0,1.15fr)_minmax(12rem,0.85fr)]'>
        <div className='relative flex flex-col justify-between border-b border-[var(--home-flow-line)] p-5 sm:border-r sm:border-b-0 sm:p-7'>
          <div>
            <span className='font-mono text-[9px] tracking-[0.16em] text-[var(--home-flow-muted)]'>
              INCOMING REQUEST
            </span>
            <div className='mt-6 space-y-3 font-mono text-[10px] sm:text-xs'>
              <p>
                <span className='text-[var(--home-flow-accent)]'>POST</span>{' '}
                /v1/responses
              </p>
              <p className='text-[var(--home-flow-muted)]'>
                model: <span className='text-[var(--home-flow-ink)]'>auto</span>
              </p>
              <p className='text-[var(--home-flow-muted)]'>
                stream:{' '}
                <span className='text-[var(--home-flow-ink)]'>true</span>
              </p>
            </div>
          </div>

          <div className='relative py-12'>
            <div className='absolute top-1/2 right-0 left-0 h-px bg-[var(--home-flow-line)]'>
              <motion.span
                aria-hidden='true'
                className='absolute inset-0 origin-left bg-[var(--home-flow-accent)] shadow-[0_0_18px_var(--home-flow-accent)]'
                style={props.interactive ? { scaleX: requestLine } : undefined}
              />
            </div>
            <motion.div
              className='relative mx-auto flex w-fit items-center gap-3 border border-[var(--home-flow-accent)] bg-[var(--home-flow)] px-4 py-3 font-mono text-[10px] shadow-[0_0_44px_var(--home-flow-accent-soft)]'
              style={props.interactive ? { opacity: gatewayGlow } : undefined}
            >
              <HugeiconsIcon
                aria-hidden='true'
                icon={Route01Icon}
                size={17}
                strokeWidth={1.6}
              />
              AI GATEWAY
            </motion.div>
          </div>

          <div>
            <div className='mb-4 flex items-center justify-between font-mono text-[9px] tracking-[0.16em] text-[var(--home-flow-muted)]'>
              <span>RESPONSE STREAM</span>
              <span>SSE</span>
            </div>
            <div className='h-px overflow-hidden bg-[var(--home-flow-line)]'>
              <motion.div
                aria-hidden='true'
                className='h-full origin-left bg-[var(--home-flow-accent)]'
                style={props.interactive ? { scaleX: responseLine } : undefined}
              />
            </div>
          </div>
        </div>

        <div className='flex flex-col'>
          <div className='flex-1'>
            <div className='px-4 py-4 font-mono text-[9px] tracking-[0.16em] text-[var(--home-flow-muted)]'>
              UPSTREAMS
            </div>
            <ModelNode
              interactive={props.interactive}
              model='OpenAI'
              progress={props.progress}
              range={[0.38, 0.48]}
            />
            <ModelNode
              interactive={props.interactive}
              model='Claude'
              progress={props.progress}
              range={[0.48, 0.58]}
            />
            <ModelNode
              interactive={props.interactive}
              model='Gemini'
              progress={props.progress}
              range={[0.58, 0.68]}
            />
          </div>

          <div className='grid grid-cols-2 border-t border-[var(--home-flow-line)]'>
            <div className='border-r border-[var(--home-flow-line)] p-4'>
              <span className='font-mono text-[8px] tracking-[0.16em] text-[var(--home-flow-muted)]'>
                LATENCY
              </span>
              <span className='mt-2 block text-2xl font-semibold tracking-[-0.04em] tabular-nums'>
                {props.interactive ? (
                  <motion.span>{props.latency}</motion.span>
                ) : (
                  '96'
                )}
                <small className='ml-1 text-[10px] text-[var(--home-flow-muted)]'>
                  MS
                </small>
              </span>
            </div>
            <div className='p-4'>
              <span className='font-mono text-[8px] tracking-[0.16em] text-[var(--home-flow-muted)]'>
                TOKENS
              </span>
              <span className='mt-2 block text-2xl font-semibold tracking-[-0.04em] text-[var(--home-flow-accent)] tabular-nums'>
                {props.interactive ? (
                  <motion.span>{props.tokens}</motion.span>
                ) : (
                  '2,148'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  const latencyValue = useTransform(scrollYProgress, [0.52, 0.9], [0, 96], {
    clamp: true,
  })
  const latencyText = useTransform(latencyValue, (value) =>
    Math.round(value).toString()
  )
  const tokenValue = useTransform(scrollYProgress, [0.52, 0.9], [0, 2148], {
    clamp: true,
  })
  const tokenText = useTransform(tokenValue, (value) =>
    Math.round(value).toLocaleString()
  )

  const steps: FlowStep[] = [
    {
      number: '01',
      title: t('Send'),
      description: t(
        'Connect through OpenAI, Claude, Gemini, and other compatible API routes'
      ),
      icon: CodeIcon,
    },
    {
      number: '02',
      title: t('Route'),
      description: t(
        'Support for high concurrency with automatic load balancing'
      ),
      icon: Route01Icon,
    },
    {
      number: '03',
      title: t('Monitor'),
      description: t(
        'Track usage, costs and performance with real-time analytics'
      ),
      icon: Analytics01Icon,
    },
  ]

  return (
    <section
      ref={sectionRef}
      data-home-section='request-flow'
      className={homeLayoutClasses.flowStage}
    >
      <div className={homeLayoutClasses.flowViewport}>
        <div
          aria-hidden='true'
          className='home-flow-grid pointer-events-none absolute inset-0'
        />
        <div
          aria-hidden='true'
          className='home-flow-spotlight pointer-events-none absolute inset-0'
        />

        <div className='relative mx-auto w-full max-w-[90rem] px-4 py-24 sm:px-6 lg:px-8 lg:py-0'>
          <div className='mb-12 flex flex-wrap items-end justify-between gap-6 lg:mb-16'>
            <div>
              <p className='font-mono text-[10px] font-semibold tracking-[0.22em] text-[var(--home-flow-muted)] uppercase'>
                04 — {t('Request flow')}
              </p>
              <h2 className='mt-4 text-[clamp(2.8rem,5.4vw,5.8rem)] leading-[0.9] font-semibold tracking-[-0.06em]'>
                {t('One request, fully visible')}
              </h2>
            </div>
            <span className='font-mono text-[9px] tracking-[0.18em] text-[var(--home-flow-muted)]'>
              TRACE MODE / ACTIVE
            </span>
          </div>

          <div className='grid gap-10 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(34rem,1.28fr)] lg:gap-16'>
            {interactive ? (
              <div className='relative min-h-[34rem]'>
                {steps.map((step, index) => (
                  <FlowNarrative
                    key={step.number}
                    index={index}
                    progress={scrollYProgress}
                    step={step}
                  />
                ))}
              </div>
            ) : (
              <div className='grid gap-8'>
                {steps.map((step) => (
                  <article
                    key={step.number}
                    className='border-t border-[var(--home-flow-line)] pt-6'
                  >
                    <div className='flex items-center gap-3 text-[var(--home-flow-accent)]'>
                      <HugeiconsIcon
                        aria-hidden='true'
                        icon={step.icon}
                        size={19}
                        strokeWidth={1.5}
                      />
                      <span className='font-mono text-[9px] tracking-[0.18em]'>
                        {step.number} / 03
                      </span>
                    </div>
                    <h3 className='mt-5 text-3xl font-semibold tracking-[-0.04em]'>
                      {step.title}
                    </h3>
                    <p className='mt-3 max-w-lg text-sm leading-relaxed text-[var(--home-flow-muted)]'>
                      {step.description}
                    </p>
                  </article>
                ))}
              </div>
            )}

            <RequestInstrument
              interactive={interactive}
              latency={latencyText}
              progress={scrollYProgress}
              tokens={tokenText}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
