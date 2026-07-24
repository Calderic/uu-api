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
import { useEffect, useRef } from 'react'

import { useTheme } from '@/context/theme-provider'
import { cn } from '@/lib/utils'

const CODE_GLYPHS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]()<>/\\=+*$#@%&:;._-'

interface CodeRow {
  alpha: number
  content: string
  speed: number
  x: number
  y: number
}

interface HeroCodeCanvasProps {
  className?: string
}

export function HeroCodeCanvas(props: HeroCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const isDark = resolvedTheme === 'dark'
    const textColor = isDark ? '198, 219, 255' : '28, 56, 112'
    const glowColor = isDark ? '59, 130, 246' : '37, 99, 235'
    const pointer = { x: 0, y: 0 }
    let width = 1
    let height = 1
    let currentSpeed = 0.85
    let targetSpeed = 0.85
    let rows: CodeRow[] = []
    let animationFrame = 0
    let isVisible = false

    const createRowText = () => {
      const characterCount = 2 * Math.ceil(width / 8.68)
      let text = ''
      for (let index = 0; index < characterCount; index += 1) {
        text +=
          Math.random() < 0.13
            ? ' '
            : CODE_GLYPHS[Math.floor(Math.random() * CODE_GLYPHS.length)]
      }
      return text
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)
      context.font =
        '500 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      context.textBaseline = 'top'
      currentSpeed += (targetSpeed - currentSpeed) * 0.055

      for (const row of rows) {
        row.x += row.speed * currentSpeed
        const textWidth = context.measureText(row.content).width
        if (row.x < -textWidth / 2) {
          row.x += textWidth / 2
        }
        context.fillStyle = `rgba(${textColor}, ${row.alpha})`
        context.fillText(row.content, row.x, row.y)
      }

      context.save()
      context.globalCompositeOperation = 'destination-in'
      const edgeMask = context.createLinearGradient(0, 0, width, 0)
      edgeMask.addColorStop(0, 'rgba(0, 0, 0, 0)')
      edgeMask.addColorStop(width < 768 ? 0.08 : 0.16, 'rgba(0, 0, 0, 1)')
      edgeMask.addColorStop(width < 768 ? 0.92 : 0.84, 'rgba(0, 0, 0, 1)')
      edgeMask.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = edgeMask
      context.fillRect(0, 0, width, height)
      context.restore()

      context.save()
      context.globalCompositeOperation = 'lighter'
      const glow = context.createRadialGradient(
        pointer.x,
        pointer.y,
        0,
        pointer.x,
        pointer.y,
        Math.max(width, height) * 0.34
      )
      glow.addColorStop(0, `rgba(${glowColor}, ${isDark ? 0.18 : 0.1})`)
      glow.addColorStop(0.48, `rgba(${glowColor}, ${isDark ? 0.07 : 0.035})`)
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
      context.restore()

      if (isVisible && !reducedMotion.matches) {
        animationFrame = window.requestAnimationFrame(draw)
      }
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      pointer.x = width * 0.62
      pointer.y = height * 0.36

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      rows = Array.from({ length: Math.ceil(height / 20) + 2 }, (_, index) => ({
        alpha: Math.random() * 0.22 + (isDark ? 0.08 : 0.05),
        content: createRowText(),
        speed: -(Math.random() * 0.44 + 0.34),
        x: -Math.random() * width,
        y: index * 20,
      }))
      draw()
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect()
      pointer.x = event.clientX - bounds.left
      pointer.y = event.clientY - bounds.top
      const center = width / 2
      targetSpeed = 0.55 + 2.6 * Math.abs((pointer.x - center) / center)
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting
      window.cancelAnimationFrame(animationFrame)
      if (isVisible && !reducedMotion.matches) {
        animationFrame = window.requestAnimationFrame(draw)
      }
    })

    resize()
    observer.observe(canvas)
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    })

    return () => {
      isVisible = false
      observer.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', handlePointerMove)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-0 size-full',
        props.className
      )}
    />
  )
}
