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

interface RevealPhraseProps {
  children: string
  progress: MotionValue<number>
  range: [number, number]
  reducedMotion: boolean
}

function RevealPhrase(props: RevealPhraseProps) {
  const opacity = useTransform(props.progress, props.range, [0.14, 1])
  const y = useTransform(props.progress, props.range, [18, 0])

  if (props.reducedMotion) {
    return <span>{props.children}</span>
  }

  return (
    <motion.span className='inline-block' style={{ opacity, y }}>
      {props.children}
    </motion.span>
  )
}

export function CTA() {
  const { t } = useTranslation()
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = Boolean(useReducedMotion())
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.9', 'start 0.35'],
  })
  const statement = t('Every model. One gateway. No lock-in.')
  const phrases = statement
    .split(/(?<=[.!?。！？,，])/u)
    .map((phrase) => phrase.trim())
    .filter(Boolean)

  return (
    <section
      ref={sectionRef}
      className='relative z-10 flex min-h-svh items-center bg-[var(--home-canvas)] px-4 py-24 sm:px-6 lg:sticky lg:top-0 lg:px-8'
    >
      <h2 className='mx-auto max-w-[62rem] text-center text-[clamp(2.5rem,6.5vw,5.75rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-balance'>
        {phrases.map((phrase, index) => {
          const rangeStart = (index / phrases.length) * 0.8
          return (
            <span key={phrase}>
              <RevealPhrase
                progress={scrollYProgress}
                range={[rangeStart, Math.min(rangeStart + 0.24, 1)]}
                reducedMotion={reducedMotion}
              >
                {phrase}
              </RevealPhrase>
              {index < phrases.length - 1 ? ' ' : null}
            </span>
          )
        })}
      </h2>
    </section>
  )
}
