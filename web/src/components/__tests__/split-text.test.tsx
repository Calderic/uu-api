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

import { SplitText } from '../split-text'

describe('split text', () => {
  test('keeps the complete title visible before client animation starts', () => {
    const markup = renderToStaticMarkup(
      <SplitText tag='h1' text='Unified AI Gateway' textAlign='left' />
    )

    assert.match(markup, /^<h1/)
    assert.match(markup, />Unified AI Gateway<\/h1>$/)
  })

  test('keeps reduced-motion titles visible without split markup', () => {
    const markup = renderToStaticMarkup(
      <SplitText tag='span' text='New API' disabled />
    )

    assert.match(markup, />New API<\/span>$/)
    assert.doesNotMatch(markup, /split-char/)
  })
})
