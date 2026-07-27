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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

import { renderToStaticMarkup } from 'react-dom/server'

import { LiquidChrome } from '../liquid-chrome'
import { shouldAnimateLiquidChrome } from '../liquid-chrome-animation'
import { resolveLiquidChromeDpr } from '../liquid-chrome-quality'

describe('liquid chrome', () => {
  test('renders a decorative full-size WebGL host before client setup', () => {
    const markup = renderToStaticMarkup(<LiquidChrome />)

    assert.match(markup, /data-liquid-chrome="true"/)
    assert.match(markup, /aria-hidden="true"/)
    assert.match(markup, /\bsize-full\b/)
  })

  test('animates only while visible and motion is allowed', () => {
    assert.equal(
      shouldAnimateLiquidChrome({
        pageVisible: true,
        reducedMotion: false,
        visible: true,
      }),
      true
    )
    assert.equal(
      shouldAnimateLiquidChrome({
        pageVisible: false,
        reducedMotion: false,
        visible: true,
      }),
      false
    )
    assert.equal(
      shouldAnimateLiquidChrome({
        pageVisible: true,
        reducedMotion: true,
        visible: true,
      }),
      false
    )
    assert.equal(
      shouldAnimateLiquidChrome({
        pageVisible: true,
        reducedMotion: false,
        visible: false,
      }),
      false
    )
  })

  test('uses native density on standard displays and caps excessive DPR', () => {
    assert.equal(resolveLiquidChromeDpr(1920, 1080, 1), 1)
    assert.equal(resolveLiquidChromeDpr(800, 600, 3), 2)
  })

  test('reduces DPR as a high-density canvas grows to protect frame cost', () => {
    const compactDpr = resolveLiquidChromeDpr(1280, 800, 2)
    const largeDpr = resolveLiquidChromeDpr(2560, 1440, 2)

    assert.equal(compactDpr, 2)
    assert.ok(largeDpr >= 1)
    assert.ok(largeDpr < compactDpr)
  })

  test('falls back to standard density for invalid display values', () => {
    assert.equal(resolveLiquidChromeDpr(1280, 800, Number.NaN), 1)
    assert.equal(resolveLiquidChromeDpr(1280, 800, 0), 1)
  })
})
