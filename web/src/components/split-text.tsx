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
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText as GSAPSplitText } from 'gsap/SplitText'
import { type CSSProperties, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP)

const DEFAULT_FROM: gsap.TweenVars = { opacity: 0, y: 40 }
const DEFAULT_TO: gsap.TweenVars = { opacity: 1, y: 0 }

type SplitTextTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'

interface SplitTextProps {
  className?: string
  delay?: number
  disabled?: boolean
  duration?: number
  ease?: string
  from?: gsap.TweenVars
  onLetterAnimationComplete?: () => void
  rootMargin?: string
  splitType?: string
  tag?: SplitTextTag
  text: string
  textAlign?: CSSProperties['textAlign']
  threshold?: number
  to?: gsap.TweenVars
}

export function SplitText(props: SplitTextProps) {
  const elementRef = useRef<HTMLElement>(null)
  const completedTextRef = useRef<string | null>(null)
  const onCompleteRef = useRef(props.onLetterAnimationComplete)
  const [fontsLoaded, setFontsLoaded] = useState(() => {
    if (typeof document === 'undefined' || !document.fonts) return true
    return document.fonts.status === 'loaded'
  })

  const delay = props.delay ?? 50
  const duration = props.duration ?? 1.25
  const ease = props.ease ?? 'power3.out'
  const from = props.from ?? DEFAULT_FROM
  const rootMargin = props.rootMargin ?? '-100px'
  const splitType = props.splitType ?? 'chars'
  const threshold = props.threshold ?? 0.1
  const to = props.to ?? DEFAULT_TO

  useEffect(() => {
    onCompleteRef.current = props.onLetterAnimationComplete
  }, [props.onLetterAnimationComplete])

  useEffect(() => {
    if (fontsLoaded || typeof document === 'undefined' || !document.fonts) {
      return
    }

    let active = true
    void document.fonts.ready.then(() => {
      if (active) setFontsLoaded(true)
    })

    return () => {
      active = false
    }
  }, [fontsLoaded])

  useGSAP(
    () => {
      const element = elementRef.current
      if (
        !element ||
        !props.text ||
        !fontsLoaded ||
        props.disabled ||
        completedTextRef.current === props.text
      ) {
        return
      }

      const startPercentage = (1 - threshold) * 100
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin)
      const marginValue = marginMatch ? Number.parseFloat(marginMatch[1]) : 0
      const marginUnit = marginMatch?.[2] || 'px'
      let marginOffset = ''

      if (marginValue < 0) {
        marginOffset = `-=${Math.abs(marginValue)}${marginUnit}`
      } else if (marginValue > 0) {
        marginOffset = `+=${marginValue}${marginUnit}`
      }

      let tween: gsap.core.Tween | undefined
      const splitInstance = new GSAPSplitText(element, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType.includes('lines'),
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit(split) {
          let targets = split.lines
          if (splitType.includes('chars') && split.chars.length > 0) {
            targets = split.chars
          } else if (splitType.includes('words') && split.words.length > 0) {
            targets = split.words
          }

          tween = gsap.fromTo(targets, from, {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: {
              trigger: element,
              start: `top ${startPercentage}%${marginOffset}`,
              once: true,
              fastScrollEnd: true,
              anticipatePin: 0.4,
            },
            onComplete: () => {
              gsap.set(targets, { clearProps: 'willChange' })
              completedTextRef.current = props.text
              onCompleteRef.current?.()
            },
            willChange: 'transform, opacity',
            force3D: true,
          })

          return tween
        },
      })

      return () => {
        tween?.scrollTrigger?.kill()
        tween?.kill()
        splitInstance.revert()
      }
    },
    {
      dependencies: [
        delay,
        duration,
        ease,
        fontsLoaded,
        from,
        props.disabled,
        props.text,
        rootMargin,
        splitType,
        threshold,
        to,
      ],
      scope: elementRef,
      revertOnUpdate: true,
    }
  )

  const Tag = (props.tag ?? 'p') as React.ElementType

  return (
    <Tag
      ref={elementRef}
      className={cn('split-parent', props.className)}
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        overflowWrap: 'break-word',
        textAlign: props.textAlign ?? 'center',
        whiteSpace: 'normal',
      }}
    >
      {props.text}
    </Tag>
  )
}
