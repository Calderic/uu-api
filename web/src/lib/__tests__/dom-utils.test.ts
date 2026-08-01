/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
either (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
*/
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { applySystemBrandingToDom } from '../dom-utils'

type FakeMetaAttribute = 'name' | 'property'

class FakeLink {
  rel = ''
  href = ''
  parentNode: FakeHead | null = null

  remove() {
    this.parentNode?.removeChild(this)
  }
}

class FakeMeta {
  parentNode: FakeHead | null = null
  private readonly attributes = new Map<string, string>()

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }

  setBrandAttribute(name: FakeMetaAttribute, value: string) {
    this.setAttribute(name, value)
  }
}

type FakeChild = FakeLink | FakeMeta

class FakeHead {
  readonly children: FakeChild[] = []

  appendChild<T extends FakeChild>(child: T): T {
    child.parentNode = this
    this.children.push(child)
    return child
  }

  removeChild(child: FakeChild) {
    const index = this.children.indexOf(child)
    if (index >= 0) {
      this.children.splice(index, 1)
      if (child instanceof FakeLink) child.parentNode = null
    }
  }
}

class FakeDocument {
  title = ''
  readonly head = new FakeHead()

  createElement(tagName: string) {
    return tagName === 'link' ? new FakeLink() : new FakeMeta()
  }

  querySelectorAll<T>(selector: string): T[] {
    if (selector === 'link[rel~="icon"]') {
      return this.head.children.filter(
        (child): child is FakeLink =>
          child instanceof FakeLink && child.rel.split(/\s+/).includes('icon')
      ) as T[]
    }

    if (selector.includes('apple-touch-icon')) {
      return this.head.children.filter(
        (child): child is FakeLink =>
          child instanceof FakeLink &&
          (child.rel === 'apple-touch-icon' ||
            child.rel === 'apple-touch-icon-precomposed')
      ) as T[]
    }

    return []
  }

  querySelector<T>(selector: string): T | null {
    const match = selector.match(/meta\[(?:name|property)="([^"]+)"\]/)
    if (!match) return null

    const attributeName = selector.includes('[name=') ? 'name' : 'property'
    return (
      this.head.children.find(
        (child): child is FakeMeta =>
          child instanceof FakeMeta &&
          child.getAttribute(attributeName) === match[1]
      ) as T | undefined
    ) ?? null
  }

  addLink(rel: string, href: string) {
    const link = new FakeLink()
    link.rel = rel
    link.href = href
    this.head.appendChild(link)
    return link
  }

  addMeta(attributeName: FakeMetaAttribute, name: string, content: string) {
    const meta = new FakeMeta()
    meta.setBrandAttribute(attributeName, name)
    meta.setAttribute('content', content)
    this.head.appendChild(meta)
    return meta
  }
}

test('system branding updates favicon, Apple icon, and share image metadata', (t) => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  t.after(() => {
    if (originalDocument) {
      Object.defineProperty(globalThis, 'document', originalDocument)
    } else {
      Reflect.deleteProperty(globalThis, 'document')
    }
    if (originalWindow) {
      Object.defineProperty(globalThis, 'window', originalWindow)
    } else {
      Reflect.deleteProperty(globalThis, 'window')
    }
  })

  const document = new FakeDocument()
  document.addLink('icon', 'https://example.com/default.png')
  document.addLink('shortcut icon', 'https://example.com/default.png')
  const appleIcon = document.addLink(
    'apple-touch-icon',
    'https://example.com/default.png'
  )
  const openGraphImage = document.addMeta(
    'property',
    'og:image',
    'https://example.com/default.png'
  )
  const twitterImage = document.addMeta(
    'name',
    'twitter:image',
    'https://example.com/default.png'
  )

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: document,
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { href: 'https://example.com/dashboard' } },
  })

  applySystemBrandingToDom('UUcode', 'https://cdn.example.com/uucode.png')

  const faviconLinks = document.querySelectorAll<FakeLink>(
    'link[rel~="icon"]'
  )
  assert.equal(faviconLinks.length, 1)
  assert.equal(faviconLinks[0]?.href, 'https://cdn.example.com/uucode.png')
  assert.equal(appleIcon.href, 'https://cdn.example.com/uucode.png')
  assert.equal(
    openGraphImage.getAttribute('content'),
    'https://cdn.example.com/uucode.png'
  )
  assert.equal(
    twitterImage.getAttribute('content'),
    'https://cdn.example.com/uucode.png'
  )
})
