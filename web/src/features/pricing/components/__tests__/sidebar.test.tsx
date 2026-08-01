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

import { PricingSidebar, type PricingSidebarProps } from '../pricing-sidebar'

const baseProps: PricingSidebarProps = {
  quotaTypeFilter: 'all',
  endpointTypeFilter: 'all',
  vendorFilter: 'all',
  groupFilter: 'all',
  tagFilter: 'all',
  onQuotaTypeChange: () => {},
  onEndpointTypeChange: () => {},
  onVendorChange: () => {},
  onGroupChange: () => {},
  onTagChange: () => {},
  vendors: [{ id: 1, name: 'OpenAI' }],
  groups: ['Claude Max', 'Codex Pro'],
  groupRatios: { 'Claude Max': 1, 'Codex Pro': 0.25 },
  tags: ['vision'],
  models: [
    {
      id: 1,
      model_name: 'gpt-5',
      quota_type: 0,
      model_ratio: 1,
      completion_ratio: 1,
      enable_groups: ['Claude Max'],
      vendor_name: 'OpenAI',
      tags: 'vision',
      supported_endpoint_types: ['openai'],
    },
  ],
  hasActiveFilters: false,
  onClearFilters: () => {},
}

function renderSidebar(overrides: Partial<PricingSidebarProps> = {}) {
  return renderToStaticMarkup(<PricingSidebar {...baseProps} {...overrides} />)
}

describe('pricing sidebar filters', () => {
  test('opens only the group section by default', () => {
    const markup = renderSidebar()
    const openSections = markup.match(/data-panel-open/g) ?? []

    assert.equal(openSections.length, 1)
  })

  test('marks the selected group and exposes its ratio label', () => {
    const markup = renderSidebar({ groupFilter: 'Codex Pro' })

    assert.match(markup, /aria-pressed="true"/)
    assert.match(markup, /Ratio:/)
    assert.match(markup, /Codex Pro/)
  })

  test('keeps a selected collapsed filter visible in its section trigger', () => {
    const markup = renderSidebar({
      tagFilter: 'vision',
      hasActiveFilters: true,
    })

    assert.match(markup, /Model Tags[^<]*<\/span>.*vision/s)
  })
})
