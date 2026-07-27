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
  motion,
  type MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { homeLayoutClasses } from '../home-layout'

interface KineticLineProps {
  direction: 'left' | 'right'
  index: number
  progress: MotionValue<number>
  reducedMotion: boolean
  text: string
}

function KineticLine(props: KineticLineProps) {
  const entryStart = 0.05 + props.index * 0.16
  const entryEnd = entryStart + 0.2
  const initialX = props.direction === 'left' ? '-20%' : '20%'
  const x = useTransform(
    props.progress,
    [entryStart, entryEnd, 0.9],
    [initialX, '0%', '0%']
  )
  const opacity = useTransform(
    props.progress,
    [entryStart, entryEnd, 0.94, 1],
    [0.08, 1, 1, 0.25]
  )

  const className =
    props.direction === 'left'
      ? 'justify-start text-left'
      : 'justify-end text-right'

  if (props.reducedMotion) {
    return (
      <span
        className={`flex text-[clamp(3.4rem,10.2vw,10.4rem)] leading-[0.78] font-semibold tracking-[-0.08em] ${className}`}
      >
        {props.text}
      </span>
    )
  }

  return (
    <motion.span
      className={`flex text-[clamp(3.4rem,10.2vw,10.4rem)] leading-[0.78] font-semibold tracking-[-0.08em] ${className}`}
      style={{ opacity, x }}
    >
      {props.text}
    </motion.span>
  )
}

export function CTA() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = Boolean(useReducedMotion())
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const statement = t('Every model. One gateway. No lock-in.')
  const phrases = statement
    .split(/(?<=[.!?。！？,，])/u)
    .map((phrase) => phrase.trim())
    .filter(Boolean)
  const crosshairRotate = useTransform(scrollYProgress, [0, 1], [0, 140])
  const crosshairScale = useTransform(
    scrollYProgress,
    [0, 0.65, 1],
    [0.7, 1, 1.4]
  )
  const protocolOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.52, 0.82],
    [0.08, 0.36, 0.08]
  )

  return (
    <section
      ref={sectionRef}
      data-home-section='manifesto'
      className={homeLayoutClasses.kineticStage}
    >
      <div className={homeLayoutClasses.kineticViewport}>
        <div
          aria-hidden='true'
          className='home-kinetic-grid absolute inset-0'
        />
        <motion.div
          aria-hidden='true'
          className='home-kinetic-crosshair absolute top-1/2 left-1/2 size-[clamp(16rem,38vw,40rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--home-line)]'
          style={
            reducedMotion
              ? undefined
              : { rotate: crosshairRotate, scale: crosshairScale }
          }
        >
          <span className='absolute top-1/2 -left-[20%] h-px w-[140%] bg-[var(--home-line)]' />
          <span className='absolute -top-[20%] left-1/2 h-[140%] w-px bg-[var(--home-line)]' />
          <span className='absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--home-accent)] shadow-[0_0_28px_var(--home-accent)]' />
        </motion.div>

        <motion.div
          aria-hidden='true'
          className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[clamp(7rem,24vw,25rem)] leading-none font-semibold tracking-[-0.09em] text-[var(--home-ink)] select-none'
          style={
            reducedMotion ? { opacity: 0.08 } : { opacity: protocolOpacity }
          }
        >
          API
        </motion.div>

        <div className='relative mx-auto w-full max-w-[90rem]'>
          <div className='mb-12 flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-[var(--home-muted)] uppercase md:mb-16'>
            <span>03 — MANIFESTO</span>
            <span>OPEN PROTOCOL / 2026</span>
          </div>

          <h2 className='relative flex flex-col gap-[0.22em]'>
            {phrases.map((phrase, index) => (
              <KineticLine
                key={phrase}
                direction={index % 2 === 0 ? 'left' : 'right'}
                index={index}
                progress={scrollYProgress}
                reducedMotion={reducedMotion}
                text={phrase}
              />
            ))}
          </h2>

          <div className='mt-14 flex items-center gap-4 md:mt-20'>
            <span className='font-mono text-[9px] tracking-[0.18em] text-[var(--home-muted)]'>
              REQUEST
            </span>
            <span className='relative h-px flex-1 overflow-hidden bg-[var(--home-line)]'>
              <motion.span
                aria-hidden='true'
                className='absolute inset-0 origin-left bg-[var(--home-accent)]'
                style={reducedMotion ? undefined : { scaleX: scrollYProgress }}
              />
            </span>
            <span className='font-mono text-[9px] tracking-[0.18em] text-[var(--home-muted)]'>
              RESPONSE
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
