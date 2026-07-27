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
const STORAGE_KEY = 'home_page_content'

export type HomePageContentStorage = Pick<
  Storage,
  'getItem' | 'removeItem' | 'setItem'
>

export function readCachedHomePageContent(
  storage?: HomePageContentStorage
): string {
  if (!storage) return ''

  try {
    return storage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function writeCachedHomePageContent(
  storage: HomePageContentStorage | undefined,
  content: string
) {
  if (!storage) return

  try {
    if (content) {
      storage.setItem(STORAGE_KEY, content)
    } else {
      storage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
