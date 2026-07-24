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
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'

import { useSystemConfig } from '@/hooks/use-system-config'

import { homeLayoutClasses } from './home-layout'

export function BrandReveal() {
  const { systemName } = useSystemConfig()
  const reducedMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const softenedVelocity = useSpring(velocity, {
    damping: 50,
    stiffness: 380,
  })
  const skewY = useTransform(softenedVelocity, [-2800, 0, 2800], [2.4, 0, -2.4])

  return (
    <section className={homeLayoutClasses.brandSpacer}>
      <motion.div
        aria-label={systemName}
        className='home-brand-reveal-fixed'
        style={reducedMotion ? undefined : { skewY }}
      >
        <div className='home-brand-reveal-glow' aria-hidden='true' />
        <span className='home-brand-reveal-word'>{systemName}</span>
      </motion.div>
    </section>
  )
}
