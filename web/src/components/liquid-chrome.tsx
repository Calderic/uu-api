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
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/utils'

import { shouldAnimateLiquidChrome } from './liquid-chrome-animation'

const DEFAULT_BASE_COLOR = [0.1, 0.1, 0.1] as const

const VERTEX_SHADER = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;
  uniform float uTime;
  uniform vec3 uResolution;
  uniform vec3 uBaseColor;
  uniform float uAmplitude;
  uniform float uFrequencyX;
  uniform float uFrequencyY;
  uniform vec2 uMouse;
  varying vec2 vUv;

  vec4 renderImage(vec2 uvCoord) {
    vec2 fragCoord = uvCoord * uResolution.xy;
    vec2 uv =
      (2.0 * fragCoord - uResolution.xy) /
      min(uResolution.x, uResolution.y);

    for (float i = 1.0; i < 10.0; i++) {
      uv.x +=
        uAmplitude / i *
        cos(i * uFrequencyX * uv.y + uTime + uMouse.x * 3.14159);
      uv.y +=
        uAmplitude / i *
        cos(i * uFrequencyY * uv.x + uTime + uMouse.y * 3.14159);
    }

    vec2 diff = uvCoord - uMouse;
    float dist = length(diff);
    float falloff = exp(-dist * 20.0);
    float ripple = sin(10.0 * dist - uTime * 2.0) * 0.03;
    uv += (diff / (dist + 0.0001)) * ripple * falloff;

    vec3 color = uBaseColor / abs(sin(uTime - uv.y - uv.x));
    return vec4(color, 1.0);
  }

  void main() {
    vec4 color = vec4(0.0);

    for (int x = -1; x <= 1; x++) {
      for (int y = -1; y <= 1; y++) {
        vec2 offset =
          vec2(float(x), float(y)) *
          (1.0 / min(uResolution.x, uResolution.y));
        color += renderImage(vUv + offset);
      }
    }

    gl_FragColor = color / 9.0;
  }
`

export interface LiquidChromeProps {
  amplitude?: number
  baseColor?: readonly [number, number, number]
  className?: string
  frequencyX?: number
  frequencyY?: number
  interactive?: boolean
  speed?: number
}

export function LiquidChrome(props: LiquidChromeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const baseColor = props.baseColor ?? DEFAULT_BASE_COLOR
  const speed = props.speed ?? 0.2
  const amplitude = props.amplitude ?? 0.3
  const baseColorRed = baseColor[0]
  const baseColorGreen = baseColor[1]
  const baseColorBlue = baseColor[2]
  const frequencyX = props.frequencyX ?? 3
  const frequencyY = props.frequencyY ?? 3
  const interactive = props.interactive ?? true

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: Renderer
    try {
      renderer = new Renderer({
        antialias: true,
        depth: false,
        dpr: Math.min(window.devicePixelRatio || 1, 1.25),
        powerPreference: 'high-performance',
      })
    } catch {
      return
    }

    const gl = renderer.gl
    gl.clearColor(0.04, 0.04, 0.04, 1)

    const resolution = new Float32Array([
      gl.canvas.width,
      gl.canvas.height,
      gl.canvas.width / gl.canvas.height,
    ])
    const mouse = new Float32Array([0.5, 0.5])
    const timeUniform = { value: 0 }
    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
      uniforms: {
        uTime: timeUniform,
        uResolution: { value: resolution },
        uBaseColor: {
          value: new Float32Array([
            baseColorRed,
            baseColorGreen,
            baseColorBlue,
          ]),
        },
        uAmplitude: { value: amplitude },
        uFrequencyX: { value: frequencyX },
        uFrequencyY: { value: frequencyY },
        uMouse: { value: mouse },
      },
    })
    const geometry = new Triangle(gl)
    const mesh = new Mesh(gl, { geometry, program })
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )

    let animationFrame = 0
    let pageVisible = document.visibilityState === 'visible'
    let visible = false

    const renderFrame = (time: number) => {
      timeUniform.value = time * 0.001 * speed
      renderer.render({ scene: mesh })
    }

    const tick = (time: number) => {
      animationFrame = 0
      renderFrame(time)

      if (
        shouldAnimateLiquidChrome({
          pageVisible,
          reducedMotion: reducedMotionQuery.matches,
          visible,
        })
      ) {
        animationFrame = window.requestAnimationFrame(tick)
      }
    }

    const refreshAnimation = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0

      if (
        shouldAnimateLiquidChrome({
          pageVisible,
          reducedMotion: reducedMotionQuery.matches,
          visible,
        })
      ) {
        animationFrame = window.requestAnimationFrame(tick)
        return
      }

      renderFrame(0)
    }

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return

      renderer.setSize(Math.round(bounds.width), Math.round(bounds.height))
      resolution[0] = gl.canvas.width
      resolution[1] = gl.canvas.height
      resolution[2] = gl.canvas.width / gl.canvas.height
      refreshAnimation()
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!interactive || reducedMotionQuery.matches || !visible) return

      const bounds = container.getBoundingClientRect()
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        return
      }

      mouse[0] = (event.clientX - bounds.left) / bounds.width
      mouse[1] = 1 - (event.clientY - bounds.top) / bounds.height
    }

    const handleVisibilityChange = () => {
      pageVisible = document.visibilityState === 'visible'
      refreshAnimation()
    }

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      refreshAnimation()
    })
    const resizeObserver = new ResizeObserver(resize)

    gl.canvas.className = 'block size-full'
    gl.canvas.setAttribute('aria-hidden', 'true')
    container.appendChild(gl.canvas)
    resizeObserver.observe(container)
    intersectionObserver.observe(container)
    reducedMotionQuery.addEventListener('change', refreshAnimation)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      })
    }
    resize()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      reducedMotionQuery.removeEventListener('change', refreshAnimation)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove)
      }
      geometry.remove()
      program.remove()
      gl.canvas.remove()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [
    amplitude,
    baseColorBlue,
    baseColorGreen,
    baseColorRed,
    frequencyX,
    frequencyY,
    interactive,
    speed,
  ])

  return (
    <div
      ref={containerRef}
      data-liquid-chrome='true'
      aria-hidden='true'
      className={cn('size-full overflow-hidden', props.className)}
    />
  )
}
