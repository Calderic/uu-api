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

import {
  documentationPagePath,
  extractDocumentationHeadings,
  replaceDocumentationBaseUrl,
} from '../lib'

describe('documentation content helpers', () => {
  test('replaces the configured base URL without leaving a trailing slash', () => {
    assert.equal(
      replaceDocumentationBaseUrl(
        'Use {{BASE_URL}}/v1 and {{BASE_URL}}/v1/models.',
        'https://api.example.com/'
      ),
      'Use https://api.example.com/v1 and https://api.example.com/v1/models.'
    )
  })

  test('creates stable unique IDs for the table of contents', () => {
    assert.deepEqual(
      extractDocumentationHeadings(
        '## Authentication\n\n### API Key\n\n## Authentication'
      ),
      [
        { depth: 2, id: 'authentication', text: 'Authentication' },
        { depth: 3, id: 'api-key', text: 'API Key' },
        { depth: 2, id: 'authentication-2', text: 'Authentication' },
      ]
    )
  })

  test('encodes a page slug in its public path', () => {
    assert.equal(
      documentationPagePath('api reference'),
      '/docs/api%20reference'
    )
  })
})
