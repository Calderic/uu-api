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
import { ArrowRight01Icon, BookOpen01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { LiquidChrome } from '@/components/liquid-chrome'
import { SplitText } from '@/components/split-text'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { cn } from '@/lib/utils'

import { HeroEndpoint } from '../hero-endpoint'
import { homeLayoutClasses } from '../home-layout'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

const HERO_TITLE_FROM = { opacity: 0, y: 48 }
const HERO_TITLE_TO = { opacity: 1, y: 0 }
const HERO_CHROME_BASE_COLOR = [0.075, 0.075, 0.075] as const

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { systemName } = useSystemConfig()
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -96])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 0, 0])
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.94])
  const exitShade = useTransform(scrollYProgress, [0.72, 1], [0, 0.32])

  const docsUrl =
    (status?.docs_link as string | undefined) || 'https://docs.newapi.pro'
  const docsRender = docsUrl.startsWith('http') ? (
    <a href={docsUrl} target='_blank' rel='noopener noreferrer' />
  ) : (
    <Link to={docsUrl} />
  )

  return (
    <motion.section
      ref={sectionRef}
      className={cn(homeLayoutClasses.heroStage, props.className)}
      style={reducedMotion ? undefined : { scale: heroScale }}
    >
      <motion.div
        aria-hidden='true'
        className={homeLayoutClasses.liquidChromeBackdrop}
        style={reducedMotion ? undefined : { y: backgroundY }}
      >
        <LiquidChrome
          baseColor={HERO_CHROME_BASE_COLOR}
          speed={0.16}
          amplitude={0.38}
          frequencyX={2.6}
          frequencyY={1.8}
          interactive={false}
        />
        <div className='home-liquid-chrome-scrim absolute inset-0' />
      </motion.div>

      <motion.div
        className='mx-auto flex min-h-[calc(100svh-8.5rem)] w-full max-w-[80rem] flex-col justify-end lg:h-full lg:min-h-0'
        style={
          reducedMotion ? undefined : { y: contentY, opacity: contentOpacity }
        }
      >
        <div>
          <HeroEndpoint />
        </div>

        <div className={cn('mt-7 sm:mt-9', homeLayoutClasses.heroContent)}>
          <h1 className='max-w-[48rem] text-[clamp(3.35rem,7.5vw,6rem)] leading-[0.9] font-semibold tracking-[-0.035em] text-balance'>
            <SplitText
              tag='span'
              text={systemName}
              className='block'
              delay={38}
              duration={0.72}
              ease='power3.out'
              splitType='chars'
              from={HERO_TITLE_FROM}
              to={HERO_TITLE_TO}
              threshold={0.1}
              rootMargin='0px'
              textAlign='left'
              disabled={Boolean(reducedMotion)}
            />
            <span className='mt-3 block text-[0.58em] leading-none tracking-[-0.02em] text-[var(--home-muted-strong)]'>
              {t('One endpoint for every model')}
            </span>
          </h1>

          <div className='pb-1 lg:justify-self-end'>
            <p className='max-w-[35rem] text-xl leading-[1.22] font-semibold tracking-[-0.025em] text-pretty sm:text-2xl lg:text-[1.72rem]'>
              {t(
                'Access a vast selection of models via a standard, unified API protocol. Power AI applications, manage digital assets, and connect the Future.'
              )}
            </p>

            <div className='mt-7 flex flex-wrap items-center gap-3'>
              <Button
                size='lg'
                className='h-14 min-w-[12.5rem] rounded-lg px-8 text-base font-semibold sm:h-16 sm:min-w-[14rem]'
                render={
                  <Link
                    to={props.isAuthenticated ? '/dashboard' : '/sign-up'}
                  />
                }
              >
                {props.isAuthenticated
                  ? t('Go to Dashboard')
                  : t('Get Started')}
                <HugeiconsIcon
                  data-icon='inline-end'
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                />
              </Button>
              <Button
                variant='outline'
                size='lg'
                className='h-14 min-w-[9.75rem] rounded-lg border-transparent bg-transparent px-7 text-base font-semibold sm:h-16'
                render={docsRender}
              >
                <HugeiconsIcon
                  data-icon='inline-start'
                  icon={BookOpen01Icon}
                  strokeWidth={2}
                />
                {t('Docs')}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 z-20 bg-black opacity-0'
        style={reducedMotion ? undefined : { opacity: exitShade }}
      />
    </motion.section>
  )
}
