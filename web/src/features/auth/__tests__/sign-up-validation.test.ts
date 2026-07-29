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

import { registerFormSchema } from '../constants'

describe('sign-up validation', () => {
  test('accepts a valid registration with one password entry', () => {
    const result = registerFormSchema.safeParse({
      username: 'alice',
      email: 'alice@example.com',
      password: 'secure-password',
    })

    assert.equal(result.success, true)
  })

  test('keeps the minimum password length requirement', () => {
    const result = registerFormSchema.safeParse({
      username: 'alice',
      password: 'short',
    })

    assert.equal(result.success, false)
    if (!result.success) {
      assert.equal(
        result.error.issues[0]?.message,
        'Password must be between 8 and 20 characters'
      )
    }
  })
})
