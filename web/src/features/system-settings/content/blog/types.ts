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
export type BlogArticleStatus =
  | 'draft'
  | 'published'
  | 'archived'
  | 'pending_review'

export type BlogCategory = {
  id: number
  name: string
  slug: string
}

export type BlogTag = {
  id: number
  name: string
  slug: string
}

export type BlogArticle = {
  id: number
  slug: string
  title: string
  content: string
  excerpt?: string
  cover_image_url?: string
  meta_title?: string
  meta_description?: string
  canonical_url?: string
  status: BlogArticleStatus
  published_at?: string
  cta_config: Record<string, unknown>
  structured_data: Record<string, unknown>
  view_count: number
  cta_click_count: number
  category_id?: number
  category?: BlogCategory
  tags: BlogTag[]
  sort_order: number
  is_featured: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type BlogArticleInput = {
  slug: string
  title: string
  content: string
  excerpt: string | null
  cover_image_url: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  status: BlogArticleStatus
  category_id: number | null
  tag_ids: number[]
  cta_config: Record<string, unknown>
  structured_data: Record<string, unknown>
  metadata: Record<string, unknown>
  sort_order: number
  is_featured: boolean
}

export type BlogSettings = {
  id: number
  blog_name: string
  blog_description: string
  articles_per_page: number
  default_cta_config: Record<string, unknown>
  base_url: string
  updated_at: string
}

export type BlogTaxonomy = {
  categories: BlogCategory[]
  tags: BlogTag[]
}

export type BlogResponse<T> = {
  success: boolean
  message?: string
  data: T
}

export type BlogArticleListResponse = BlogResponse<BlogArticle[]> & {
  pagination: {
    total: number
    limit: number
    offset: number
  }
}
