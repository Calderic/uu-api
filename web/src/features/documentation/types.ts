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
export type DocumentationPageStatus =
  | 'draft'
  | 'published'
  | 'archived'
  | 'pending_review'

export type DocumentationCategory = {
  id: number
  name: string
  slug: string
  description?: string
  sort_order: number
}

export type DocumentationPage = {
  id: number
  slug: string
  title: string
  summary?: string
  content: string
  meta_title?: string
  meta_description?: string
  status: DocumentationPageStatus
  published_at?: string
  category_id?: number
  category?: DocumentationCategory
  parent_id?: number
  sort_order: number
  created_at: string
  updated_at: string
}

export type DocumentationCategoryWithPages = DocumentationCategory & {
  pages: DocumentationPage[]
}

export type DocumentationSettings = {
  id: number
  site_name: string
  site_description: string
  base_url: string
  updated_at: string
}

export type DocumentationIndex = {
  settings: DocumentationSettings
  categories: DocumentationCategoryWithPages[]
  pages: DocumentationPage[]
}

export type DocumentationNavigationItem = {
  slug: string
  title: string
  category_name?: string
}

export type DocumentationPageResult = {
  settings: DocumentationSettings
  categories: DocumentationCategoryWithPages[]
  page: DocumentationPage
  previous_page?: DocumentationNavigationItem
  next_page?: DocumentationNavigationItem
}

export type DocumentationPageInput = {
  slug: string
  title: string
  summary: string | null
  content: string
  meta_title: string | null
  meta_description: string | null
  status: DocumentationPageStatus
  category_id: number | null
  parent_id: number | null
  sort_order: number
}

export type DocumentationCategoryInput = {
  name: string
  slug: string
  description: string | null
  sort_order: number
}

export type DocumentationSettingsInput = {
  site_name: string
  site_description: string
  base_url: string
}

export type DocumentationResponse<T> = {
  success: boolean
  message?: string
  data: T
}

export type DocumentationPageListResponse = DocumentationResponse<
  DocumentationPage[]
> & {
  pagination: {
    total: number
    limit: number
    offset: number
  }
}
