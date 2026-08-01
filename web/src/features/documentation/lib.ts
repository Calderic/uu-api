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
export type DocumentationHeading = {
  id: string
  text: string
  depth: 2 | 3
}

export function replaceDocumentationBaseUrl(
  content: string,
  baseUrl: string
): string {
  return content.replaceAll('{{BASE_URL}}', baseUrl.replace(/\/+$/, ''))
}

export function documentationPagePath(slug: string): string {
  return `/docs/${encodeURIComponent(slug)}`
}

export function extractDocumentationHeadings(
  content: string
): DocumentationHeading[] {
  const usedIds = new Map<string, number>()
  const headings: DocumentationHeading[] = []
  const pattern = /^(#{2,3})\s+(.+?)\s*#*\s*$/gm
  let match: RegExpExecArray | null

  while ((match = pattern.exec(content)) !== null) {
    const depth = match[1].length as 2 | 3
    const text = stripMarkdownInline(match[2])
    const baseId = slugifyHeading(text)
    const count = usedIds.get(baseId) ?? 0
    usedIds.set(baseId, count + 1)
    headings.push({
      depth,
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
      text,
    })
  }

  return headings
}

export function slugifyHeading(value: string): string {
  const normalized = value
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replaceAll(/\s+/g, '-')
  return normalized || 'section'
}

function stripMarkdownInline(value: string): string {
  return value
    .replaceAll(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replaceAll(/[`*_~]/g, '')
    .trim()
}
