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
  buildGoogleOAuthUrl,
  decodeOAuthFlowState,
  encodeOAuthFlowState,
} from '../oauth'

describe('Google OAuth URL', () => {
  test('includes the exact callback, identity scopes, and CSRF state', (t) => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
    t.after(() => {
      if (originalWindow) {
        Object.defineProperty(globalThis, 'window', originalWindow)
        return
      }
      Reflect.deleteProperty(globalThis, 'window')
    })
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { origin: 'https://example.com' } },
    })

    const url = new URL(buildGoogleOAuthUrl('google-client', 'state-token'))

    assert.equal(url.origin, 'https://accounts.google.com')
    assert.equal(url.pathname, '/o/oauth2/v2/auth')
    assert.equal(url.searchParams.get('client_id'), 'google-client')
    assert.equal(
      url.searchParams.get('redirect_uri'),
      'https://example.com/oauth/google'
    )
    assert.equal(url.searchParams.get('response_type'), 'code')
    assert.equal(url.searchParams.get('scope'), 'openid email profile')
    assert.equal(url.searchParams.get('state'), 'state-token')
  })

  test('uses the configured public server address for the callback', (t) => {
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
    t.after(() => {
      if (originalWindow) {
        Object.defineProperty(globalThis, 'window', originalWindow)
        return
      }
      Reflect.deleteProperty(globalThis, 'window')
    })
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { location: { origin: 'https://internal.example.com' } },
    })

    const url = new URL(
      buildGoogleOAuthUrl(
        'google-client',
        'state-token',
        'https://public.example.com/'
      )
    )

    assert.equal(
      url.searchParams.get('redirect_uri'),
      'https://public.example.com/oauth/google'
    )
  })

  test('encodes and decodes the flow intent for popup callbacks', () => {
    const encoded = encodeOAuthFlowState('state-token', 'bind')

    assert.equal(encoded, 'state-token.bind')
    assert.deepEqual(decodeOAuthFlowState(encoded), {
      state: 'state-token',
      intent: 'bind',
    })
  })

  test('keeps legacy OAuth states usable without an encoded intent', () => {
    assert.deepEqual(decodeOAuthFlowState('legacy-state'), {
      state: 'legacy-state',
      intent: null,
    })
  })
})
