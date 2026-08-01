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

import { ModelCard } from '../model-card'

describe('pricing model card', () => {
  test('keeps a long model name available through a readable two-line title', () => {
    const modelName = 'claude-3-7-sonnet-thinking-extended-context'
    const markup = renderToStaticMarkup(
      <ModelCard
        model={{
          id: 1,
          model_name: modelName,
          quota_type: 0,
          model_ratio: 1,
          completion_ratio: 1,
          enable_groups: ['default'],
        }}
        onClick={() => {}}
      />
    )

    assert.match(markup, new RegExp(`title="${modelName}"`))
    assert.match(markup, /line-clamp-2/)
  })
})
