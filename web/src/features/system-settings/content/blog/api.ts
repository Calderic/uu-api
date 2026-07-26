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
import { api } from '@/lib/http-client'

import type {
  BlogArticle,
  BlogArticleInput,
  BlogArticleListResponse,
  BlogArticleStatus,
  BlogResponse,
  BlogSettings,
  BlogTaxonomy,
} from './types'

export async function listBlogArticles(params: {
  search: string
  status: string
  limit: number
  offset: number
}) {
  const response = await api.get<BlogArticleListResponse>(
    '/api/blog/admin/articles',
    { params }
  )
  return response.data
}

export async function getBlogTaxonomy() {
  const response = await api.get<BlogResponse<BlogTaxonomy>>(
    '/api/blog/admin/taxonomy'
  )
  return response.data.data
}

export async function getBlogSettings() {
  const response = await api.get<BlogResponse<BlogSettings>>(
    '/api/blog/admin/settings'
  )
  return response.data.data
}

export async function saveBlogSettings(
  settings: Omit<BlogSettings, 'id' | 'updated_at'>
) {
  const response = await api.put<BlogResponse<BlogSettings>>(
    '/api/blog/admin/settings',
    settings
  )
  return response.data
}

export async function createBlogArticle(input: BlogArticleInput) {
  const response = await api.post<BlogResponse<BlogArticle>>(
    '/api/blog/admin/articles',
    input
  )
  return response.data
}

export async function updateBlogArticle(id: number, input: BlogArticleInput) {
  const response = await api.put<BlogResponse<BlogArticle>>(
    `/api/blog/admin/articles/${id}`,
    input
  )
  return response.data
}

export async function setBlogArticleStatus(
  id: number,
  status: BlogArticleStatus
) {
  const response = await api.patch<BlogResponse<BlogArticle>>(
    `/api/blog/admin/articles/${id}/status`,
    { status }
  )
  return response.data
}
