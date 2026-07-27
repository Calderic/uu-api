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

test('only the hero keeps a dark appearance independently from the selected theme', () => {
  assert.match(homeLayoutClasses.landingRoot, /\bhome-landing\b/)
  assert.doesNotMatch(homeLayoutClasses.landingRoot, /\bdark\b/)
  assert.match(homeLayoutClasses.heroStage, /\bhome-hero-dark\b/)
  assert.match(homeLayoutClasses.heroBoundary, /\bh-px\b/)
})

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

test('liquid chrome fills the hero background without intercepting input', () => {
  assert.match(homeLayoutClasses.liquidChromeBackdrop, /\babsolute\b/)
  assert.match(homeLayoutClasses.liquidChromeBackdrop, /\binset-0\b/)
  assert.match(
    homeLayoutClasses.liquidChromeBackdrop,
    /\bpointer-events-none\b/
  )
})

test('capability stage keeps the signal map and protocol copy in two columns', () => {
  assert.match(homeLayoutClasses.featureGrid, /\blg:grid-cols-/)
  assert.match(homeLayoutClasses.featureGrid, /\boverflow-hidden\b/)
  assert.match(homeLayoutClasses.featureGrid, /\bborder-y\b/)
})

test('metrics progress from one column to a four-column editorial rail', () => {
  assert.doesNotMatch(homeLayoutClasses.metrics, /\bgrid-cols-2\b/)
  assert.match(homeLayoutClasses.metrics, /\bsm:grid-cols-2\b/)
  assert.match(homeLayoutClasses.metrics, /\blg:grid-cols-4\b/)
  assert.match(homeLayoutClasses.metrics, /\bborder-t\b/)
})

test('model names use a dedicated overflow-safe signal rail', () => {
  assert.match(homeLayoutClasses.signalRail, /\bw-max\b/)
  assert.match(homeLayoutClasses.signalRail, /\bmin-w-full\b/)
  assert.match(homeLayoutClasses.signalRail, /\bhome-signal-rail\b/)
})

test('hero remains pinned while the next foreground layer covers it', () => {
  assert.match(homeLayoutClasses.heroStage, /\blg:sticky\b/)
  assert.match(homeLayoutClasses.heroStage, /\blg:top-0\b/)
  assert.match(homeLayoutClasses.heroStage, /\blg:h-svh\b/)
  assert.match(homeLayoutClasses.foregroundStack, /\bz-10\b/)
})

test('request flow uses a long sticky scroll stage', () => {
  assert.ok(homeLayoutClasses.flowStage.includes('lg:h-[380svh]'))
  assert.match(homeLayoutClasses.flowViewport, /\blg:sticky\b/)
  assert.match(homeLayoutClasses.flowViewport, /\blg:h-svh\b/)
})

test('kinetic manifesto becomes sticky only on large screens', () => {
  assert.ok(homeLayoutClasses.kineticStage.includes('lg:h-[260svh]'))
  assert.match(homeLayoutClasses.kineticViewport, /\bmin-h-svh\b/)
  assert.match(homeLayoutClasses.kineticViewport, /\blg:sticky\b/)
  assert.match(homeLayoutClasses.kineticViewport, /\blg:h-svh\b/)
})

test('brand reveal stays behind the foreground content', () => {
  assert.match(homeLayoutClasses.brandSpacer, /\bz-0\b/)
  assert.match(
    homeLayoutClasses.foregroundStack,
    /\bbg-\[var\(--home-canvas\)\]/
  )
})
