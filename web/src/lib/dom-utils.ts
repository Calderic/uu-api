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
export function applyFaviconToDom(url: string) {
  if (typeof document === 'undefined' || !url) return
  try {
    const next = new URL(url, window.location.href).href
    const faviconLinks =
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')
    const faviconLink = faviconLinks[0] ?? document.createElement('link')
    faviconLink.rel = 'icon'
    faviconLink.href = next
    if (!faviconLink.parentNode) {
      document.head.appendChild(faviconLink)
    }
    faviconLinks.forEach((link, index) => {
      if (index > 0) link.remove()
    })

    const appleTouchIconLinks = document.querySelectorAll<HTMLLinkElement>(
      'link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]'
    )
    if (appleTouchIconLinks.length === 0) {
      const appleTouchIconLink = document.createElement('link')
      appleTouchIconLink.rel = 'apple-touch-icon'
      appleTouchIconLink.href = next
      document.head.appendChild(appleTouchIconLink)
    } else {
      appleTouchIconLinks.forEach((link) => {
        link.href = next
      })
    }
  } catch {
    // Ignore malformed URLs
  }
}

export function applySystemBrandingToDom(name: string, logo: string) {
  if (typeof document === 'undefined') return

  const normalizedName = name.trim()
  const normalizedLogo = logo.trim()
  if (normalizedName) {
    document.title = normalizedName
    const titleSelectors = [
      'meta[name="title"]',
      'meta[name="application-name"]',
      'meta[name="apple-mobile-web-app-title"]',
      'meta[property="og:title"]',
      'meta[property="og:site_name"]',
      'meta[name="twitter:title"]',
    ]
    titleSelectors.forEach((selector) => {
      document
        .querySelector<HTMLMetaElement>(selector)
        ?.setAttribute('content', normalizedName)
    })
  }

  if (normalizedLogo) {
    try {
      const absoluteLogoURL = new URL(
        normalizedLogo,
        window.location.href
      ).href
      const imageMeta = [
        {
          selector: 'meta[property="og:image"]',
          content: absoluteLogoURL,
        },
        {
          selector: 'meta[property="og:image:alt"]',
          content: normalizedName,
        },
        {
          selector: 'meta[name="twitter:image"]',
          content: absoluteLogoURL,
        },
        {
          selector: 'meta[name="twitter:image:alt"]',
          content: normalizedName,
        },
      ]
      imageMeta.forEach((item) => {
        const meta = document.querySelector<HTMLMetaElement>(item.selector)
        if (!meta) return
        meta.setAttribute('content', item.content)
      })
    } catch {
      // Ignore malformed URLs
    }
  }

  applyFaviconToDom(normalizedLogo)
}
