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

import { pricingLayoutClasses } from '../pricing-layout'

describe('pricing page layout', () => {
  test('places the search field between the model count and actions on desktop', () => {
    const toolbarClasses = pricingLayoutClasses.toolbar.split(' ')
    const searchClasses = pricingLayoutClasses.toolbarSearch.split(' ')

    assert.ok(toolbarClasses.includes('lg:flex-row'))
    assert.ok(toolbarClasses.includes('lg:items-center'))
    assert.ok(searchClasses.includes('flex-1'))
    assert.ok(searchClasses.includes('lg:max-w-xl'))
  })

  test('keeps the model toolbar stacked on narrow screens', () => {
    const toolbarClasses = pricingLayoutClasses.toolbar.split(' ')

    assert.ok(toolbarClasses.includes('flex-col'))
    assert.ok(toolbarClasses.includes('gap-3'))
  })
})
