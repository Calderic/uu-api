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
  readCachedHomePageContent,
  type HomePageContentStorage,
  writeCachedHomePageContent,
} from '../lib/home-page-cache'

function createStorage(
  initialContent: string | null = null
): HomePageContentStorage {
  let content = initialContent

  return {
    getItem() {
      return content
    },
    removeItem() {
      content = null
    },
    setItem(_key, value) {
      content = value
    },
  }
}

describe('home page content cache', () => {
  test('returns cached custom content for the first render', () => {
    const storage = createStorage('# Custom landing page')

    assert.equal(readCachedHomePageContent(storage), '# Custom landing page')
  })

  test('removes stale custom content when the default landing page is active', () => {
    const storage = createStorage('# Stale landing page')

    writeCachedHomePageContent(storage, '')

    assert.equal(readCachedHomePageContent(storage), '')
  })

  test('falls back to the default landing page when storage is unavailable', () => {
    const storage: HomePageContentStorage = {
      getItem() {
        throw new Error('Storage unavailable')
      },
      removeItem() {
        throw new Error('Storage unavailable')
      },
      setItem() {
        throw new Error('Storage unavailable')
      },
    }

    assert.equal(readCachedHomePageContent(storage), '')
    assert.doesNotThrow(() =>
      writeCachedHomePageContent(storage, '# Landing page')
    )
  })
})
