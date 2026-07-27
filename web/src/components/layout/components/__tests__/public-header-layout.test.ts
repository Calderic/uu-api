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
import test from 'node:test'

import { publicHeaderLayoutClasses } from '../public-header-layout'

test('public header keeps the logo mark close to the site name', () => {
  const brandClasses = publicHeaderLayoutClasses.brandLink.split(' ')

  assert.ok(brandClasses.includes('gap-1.5'))
  assert.ok(brandClasses.includes('items-center'))
})

test('public header keeps navigation readable over animated backgrounds', () => {
  const backdropClasses =
    publicHeaderLayoutClasses.topContrastBackdrop.split(' ')
  const appearanceClasses =
    publicHeaderLayoutClasses.landingDarkAppearance.split(' ')

  assert.ok(appearanceClasses.includes('dark'))
  assert.ok(appearanceClasses.includes('text-foreground'))
  assert.ok(backdropClasses.includes('bg-gradient-to-b'))
  assert.ok(backdropClasses.includes('from-background/90'))
  assert.ok(backdropClasses.includes('to-transparent'))
  assert.ok(!backdropClasses.some((className) => className.includes('rounded')))
  assert.ok(!backdropClasses.some((className) => className.includes('ring-')))
})
