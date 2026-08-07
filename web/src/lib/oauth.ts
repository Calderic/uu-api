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
// ============================================================================
// OAuth URL Builders
// ============================================================================

export type OAuthFlowIntent = 'login' | 'bind'

export type OAuthFlowState = {
  state: string
  intent: OAuthFlowIntent | null
}

const oauthFlowStateSeparator = '.'

export function encodeOAuthFlowState(
  state: string,
  intent: OAuthFlowIntent
): string {
  return `${state}${oauthFlowStateSeparator}${intent}`
}

export function decodeOAuthFlowState(value: string): OAuthFlowState {
  const separatorIndex = value.lastIndexOf(oauthFlowStateSeparator)
  if (separatorIndex <= 0) {
    return { state: value, intent: null }
  }

  const state = value.slice(0, separatorIndex)
  const intent = value.slice(separatorIndex + 1)
  if (intent !== 'login' && intent !== 'bind') {
    return { state: value, intent: null }
  }

  return { state, intent }
}

export function buildOAuthRedirectUri(
  provider: string,
  configuredServerAddress?: string
): string {
  const baseUrl =
    configuredServerAddress?.trim().replace(/\/+$/, '') ||
    window.location.origin
  return `${baseUrl}/oauth/${provider}`
}

/**
 * Build GitHub OAuth URL
 */
export function buildGitHubOAuthUrl(clientId: string, state: string): string {
  return `https://github.com/login/oauth/authorize?client_id=${clientId}&state=${state}&scope=user:email`
}

/**
 * Build Google OAuth URL
 */
export function buildGoogleOAuthUrl(
  clientId: string,
  state: string,
  configuredServerAddress?: string
): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set(
    'redirect_uri',
    buildOAuthRedirectUri('google', configuredServerAddress)
  )
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid email profile')
  url.searchParams.set('state', state)
  return url.toString()
}

/**
 * Build Discord OAuth URL
 */
export function buildDiscordOAuthUrl(
  clientId: string,
  state: string,
  configuredServerAddress?: string
): string {
  const url = new URL('https://discord.com/oauth2/authorize')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set(
    'redirect_uri',
    buildOAuthRedirectUri('discord', configuredServerAddress)
  )
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'identify+openid')
  url.searchParams.set('state', state)
  return url.toString()
}

/**
 * Build OIDC OAuth URL
 */
export function buildOIDCOAuthUrl(
  authUrl: string,
  clientId: string,
  state: string,
  configuredServerAddress?: string
): string {
  const url = new URL(authUrl)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set(
    'redirect_uri',
    buildOAuthRedirectUri('oidc', configuredServerAddress)
  )
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'openid profile email')
  url.searchParams.set('state', state)
  return url.toString()
}

/**
 * Build LinuxDO OAuth URL
 */
export function buildLinuxDOOAuthUrl(clientId: string, state: string): string {
  return `https://connect.linux.do/oauth2/authorize?response_type=code&client_id=${clientId}&state=${state}`
}
