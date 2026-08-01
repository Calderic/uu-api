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
import { create } from 'zustand'

import { DEFAULT_SYSTEM_NAME, DEFAULT_LOGO } from '@/lib/constants'

export type CurrencyDisplayType = 'USD' | 'CNY' | 'TOKENS' | 'CUSTOM'

export interface CurrencyConfig {
  /** Whether to render quota values as currency instead of raw units */
  displayInCurrency: boolean
  /** Currency presentation strategy configured by the admin */
  quotaDisplayType: CurrencyDisplayType
  /** Number of quota units that equal one USD */
  quotaPerUnit: number
  /** Exchange rate from USD to the configured local currency */
  usdExchangeRate: number
  /** Custom currency symbol configured by the admin (used when type === CUSTOM) */
  customCurrencySymbol: string
  /** Exchange rate from USD to the custom currency (used when type === CUSTOM) */
  customCurrencyExchangeRate: number
}

export interface CrispConfig {
  enabled: boolean
  websiteId: string
}

export interface SystemConfig {
  systemName: string
  logo: string
  footerHtml?: string
  demoSiteEnabled?: boolean
  displayTokenStatEnabled?: boolean
  crisp: CrispConfig
  currency: CurrencyConfig
}

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  displayInCurrency: true,
  quotaDisplayType: 'USD',
  quotaPerUnit: 500000,
  usdExchangeRate: 1,
  customCurrencySymbol: '¤',
  customCurrencyExchangeRate: 1,
}

export const DEFAULT_CRISP_CONFIG: CrispConfig = {
  enabled: false,
  websiteId: '',
}

interface SystemConfigState {
  config: SystemConfig
  loading: boolean
  loadedLogoUrl: string
  setConfig: (config: Partial<SystemConfig>) => void
  setLoadedLogoUrl: (url: string) => void
  setLoading: (loading: boolean) => void
}

interface EmbeddedPublicSystemConfig {
  system_name?: unknown
  logo?: unknown
}

function readEmbeddedPublicSystemConfig(): {
  systemName: string
  logo: string
} {
  if (typeof document === 'undefined') {
    return {
      systemName: DEFAULT_SYSTEM_NAME,
      logo: DEFAULT_LOGO,
    }
  }

  try {
    const content = document.querySelector('#public-system-config')?.textContent
    if (!content) {
      return {
        systemName: DEFAULT_SYSTEM_NAME,
        logo: DEFAULT_LOGO,
      }
    }

    const parsed = JSON.parse(content) as EmbeddedPublicSystemConfig
    const systemName =
      typeof parsed.system_name === 'string' && parsed.system_name.trim()
        ? parsed.system_name.trim()
        : DEFAULT_SYSTEM_NAME
    const logo =
      typeof parsed.logo === 'string' && parsed.logo.trim()
        ? parsed.logo.trim()
        : DEFAULT_LOGO
    return { systemName, logo }
  } catch {
    return {
      systemName: DEFAULT_SYSTEM_NAME,
      logo: DEFAULT_LOGO,
    }
  }
}

const embeddedPublicSystemConfig = readEmbeddedPublicSystemConfig()

/**
 * System configuration store seeded by the server-rendered public config.
 * The initial brand therefore matches the first HTML response without waiting
 * for local storage hydration or a client-side status request.
 */
export const useSystemConfigStore = create<SystemConfigState>()((set) => ({
  config: {
    systemName: embeddedPublicSystemConfig.systemName,
    logo: embeddedPublicSystemConfig.logo,
    crisp: { ...DEFAULT_CRISP_CONFIG },
    currency: { ...DEFAULT_CURRENCY_CONFIG },
  },
  loading: false,
  loadedLogoUrl: embeddedPublicSystemConfig.logo,
  setConfig: (newConfig) =>
    set((state) => ({
      config: {
        ...state.config,
        ...newConfig,
        currency: {
          ...state.config.currency,
          ...newConfig.currency,
        },
      },
    })),
  setLoadedLogoUrl: (url) => set({ loadedLogoUrl: url }),
  setLoading: (loading) => set({ loading }),
}))

// Selector helpers for convenience
export const getSystemName = () =>
  useSystemConfigStore.getState().config.systemName

export const getLogo = () => useSystemConfigStore.getState().config.logo

export const getFooterHtml = () =>
  useSystemConfigStore.getState().config.footerHtml
