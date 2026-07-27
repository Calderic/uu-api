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

import { SetupGuideToggle } from '../setup-guide-toggle'

function renderToggle(expanded: boolean): string {
  return renderToStaticMarkup(
    <SetupGuideToggle
      expanded={expanded}
      label={expanded ? 'Hide setup guide' : 'Show setup guide'}
      onToggle={() => {}}
    />
  )
}

function getButtonClassName(markup: string): string {
  const match = markup.match(/<button[^>]*class="([^"]+)"/)
  assert.ok(match)
  return match[1]
}

describe('setup guide toggle', () => {
  test('keeps the same button placement styling in both states', () => {
    assert.equal(
      getButtonClassName(renderToggle(true)),
      getButtonClassName(renderToggle(false))
    )
  })

  test('exposes the current expanded state and matching action label', () => {
    const expandedMarkup = renderToggle(true)
    const collapsedMarkup = renderToggle(false)

    assert.match(expandedMarkup, /aria-expanded="true"/)
    assert.match(expandedMarkup, /aria-label="Hide setup guide"/)
    assert.match(collapsedMarkup, /aria-expanded="false"/)
    assert.match(collapsedMarkup, /aria-label="Show setup guide"/)
  })
})
