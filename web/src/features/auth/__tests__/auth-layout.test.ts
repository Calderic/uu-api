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

import { splitAuthLayoutClasses } from '../auth-layout-styles'
import { getAuthVisualSource } from '../auth-visual'

describe('split auth layout', () => {
  test('centers the auth card on a dedicated backdrop', () => {
    assert.match(splitAuthLayoutClasses.root, /min-h-svh/)
    assert.match(splitAuthLayoutClasses.root, /bg-auth-backdrop/)
    assert.match(splitAuthLayoutClasses.shell, /rounded-\[1\.75rem\]/)
    assert.match(splitAuthLayoutClasses.shell, /lg:grid-cols-/)
    assert.match(splitAuthLayoutClasses.shell, /bg-auth-panel/)
    assert.match(splitAuthLayoutClasses.shell, /ring-auth-border/)
    assert.match(splitAuthLayoutClasses.visual, /bg-auth-field/)
  })

  test('shows the image above the form on mobile and beside it on desktop', () => {
    assert.match(splitAuthLayoutClasses.panel, /order-2/)
    assert.match(splitAuthLayoutClasses.panel, /lg:order-1/)
    assert.match(splitAuthLayoutClasses.visual, /order-1/)
    assert.match(splitAuthLayoutClasses.visual, /lg:order-2/)
    assert.match(splitAuthLayoutClasses.visual, /h-56/)
    assert.match(splitAuthLayoutClasses.visual, /lg:h-auto/)
  })

  test('constrains the form and covers the rounded visual panel', () => {
    assert.match(splitAuthLayoutClasses.form, /max-w-\[23rem\]/)
    assert.match(splitAuthLayoutClasses.visual, /rounded-\[1\.25rem\]/)
    assert.match(splitAuthLayoutClasses.image, /size-full/)
    assert.match(splitAuthLayoutClasses.image, /object-cover/)
  })

  test('uses the dark visual when dark mode provides one', () => {
    assert.equal(
      getAuthVisualSource('/light.jpg', '/dark.jpg', 'dark'),
      '/dark.jpg'
    )
  })

  test('falls back to the light visual when no dark asset is available', () => {
    assert.equal(
      getAuthVisualSource('/light.jpg', undefined, 'dark'),
      '/light.jpg'
    )
    assert.equal(
      getAuthVisualSource('/light.jpg', '/dark.jpg', 'light'),
      '/light.jpg'
    )
  })
})
