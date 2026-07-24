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

import { homeLayoutClasses } from '../components/home-layout'

test('endpoint stays stacked on narrow screens and becomes inline on desktop', () => {
  assert.match(homeLayoutClasses.endpoint, /\bflex-col\b/)
  assert.match(homeLayoutClasses.endpoint, /\bsm:flex-row\b/)
  assert.match(homeLayoutClasses.endpoint, /\brounded-xl\b/)
  assert.match(homeLayoutClasses.endpoint, /\bshadow-sm\b/)
})

test('hero copy uses a two-column editorial layout on large screens', () => {
  assert.match(
    homeLayoutClasses.heroContent,
    /\blg:grid-cols-\[minmax\(0,1\.08fr\)_minmax\(24rem,0\.92fr\)\]/
  )
})

test('feature cards form a bounded three-column bento grid', () => {
  assert.match(homeLayoutClasses.featureGrid, /\bmd:grid-cols-3\b/)
  assert.match(homeLayoutClasses.featureGrid, /\bgap-px\b/)
  assert.match(homeLayoutClasses.featureGrid, /\boverflow-hidden\b/)
  assert.match(homeLayoutClasses.featureGrid, /\brounded-xl\b/)
})

test('metrics keep two columns on mobile and four on wider screens', () => {
  assert.match(homeLayoutClasses.metrics, /\bgrid-cols-2\b/)
  assert.match(homeLayoutClasses.metrics, /\bsm:grid-cols-4\b/)
  assert.match(homeLayoutClasses.metrics, /\brounded-xl\b/)
})

test('hero remains pinned while the next foreground layer covers it', () => {
  assert.match(homeLayoutClasses.heroStage, /\blg:sticky\b/)
  assert.match(homeLayoutClasses.heroStage, /\blg:top-0\b/)
  assert.match(homeLayoutClasses.heroStage, /\blg:h-svh\b/)
  assert.match(homeLayoutClasses.foregroundStack, /\bz-10\b/)
})

test('request flow uses a long sticky scroll stage', () => {
  assert.ok(homeLayoutClasses.flowStage.includes('lg:h-[340svh]'))
  assert.match(homeLayoutClasses.flowViewport, /\blg:sticky\b/)
  assert.match(homeLayoutClasses.flowViewport, /\blg:h-svh\b/)
})

test('brand reveal stays behind the foreground content', () => {
  assert.match(homeLayoutClasses.brandSpacer, /\bz-0\b/)
  assert.match(
    homeLayoutClasses.foregroundStack,
    /\bbg-\[var\(--home-canvas\)\]/
  )
})
