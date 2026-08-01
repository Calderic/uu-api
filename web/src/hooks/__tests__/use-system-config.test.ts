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
*/
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { DEFAULT_LOGO, DEFAULT_SYSTEM_NAME } from '@/lib/constants'

import { mapStatusDataToConfig } from '../use-system-config'

test('status mapping preserves server-seeded branding when fields are absent', () => {
  const config = mapStatusDataToConfig({
    footer_html: '<p>Footer</p>',
  })

  assert.equal('systemName' in config, false)
  assert.equal('logo' in config, false)
  assert.equal(config.footerHtml, '<p>Footer</p>')
})

test('status mapping trims configured branding before rendering it', () => {
  const config = mapStatusDataToConfig({
    system_name: '  UUcode  ',
    logo: '  https://cdn.example.com/uucode.png  ',
  })

  assert.equal(config.systemName, 'UUcode')
  assert.equal(config.logo, 'https://cdn.example.com/uucode.png')
})

test('status mapping resets an explicitly cleared logo to the default asset', () => {
  const config = mapStatusDataToConfig({ logo: '' })

  assert.equal(config.logo, DEFAULT_LOGO)
})

test('status mapping resets an explicitly cleared name to the default name', () => {
  const config = mapStatusDataToConfig({ system_name: '' })

  assert.equal(config.systemName, DEFAULT_SYSTEM_NAME)
})

test('status mapping exposes a trimmed Crisp configuration', () => {
  const config = mapStatusDataToConfig({
    crisp_enabled: true,
    crisp_website_id: '  website-id  ',
  })

  assert.deepEqual(config.crisp, {
    enabled: true,
    websiteId: 'website-id',
  })
})
