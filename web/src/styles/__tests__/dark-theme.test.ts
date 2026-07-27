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
import { readFileSync } from 'node:fs'
import test from 'node:test'

const themeCss = readFileSync(new URL('../theme.css', import.meta.url), 'utf8')
const darkTheme = themeCss.match(/\.dark\s*\{([\s\S]*?)\n\}/)?.[1]

function getNeutralLightness(token: string): number {
  assert.ok(darkTheme, 'dark theme token block must exist')
  const value = darkTheme.match(
    new RegExp(`--${token}:\\s*oklch\\(([0-9.]+)\\s+0\\s+0\\)`)
  )?.[1]

  assert.ok(value, `${token} must use a neutral OKLCH color`)
  return Number(value)
}

test('dark theme uses a graphite canvas with distinct surface elevation', () => {
  const background = getNeutralLightness('background')
  const sidebar = getNeutralLightness('sidebar')
  const card = getNeutralLightness('card')
  const popover = getNeutralLightness('popover')
  const collapsedHeader = getNeutralLightness('app-header-collapsed')

  assert.ok(background >= 0.22)
  assert.ok(sidebar >= 0.22)
  assert.ok(card > background)
  assert.ok(popover > card)
  assert.ok(collapsedHeader < background)
})
