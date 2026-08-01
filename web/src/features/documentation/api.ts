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
  DocumentationCategory,
  DocumentationCategoryInput,
  DocumentationIndex,
  DocumentationPage,
  DocumentationPageInput,
  DocumentationPageListResponse,
  DocumentationPageResult,
  DocumentationResponse,
  DocumentationSettings,
  DocumentationSettingsInput,
} from './types'

export async function getDocumentationIndex() {
  const response =
    await api.get<DocumentationResponse<DocumentationIndex>>('/api/docs')
  return response.data
}

export async function getDocumentationPage(slug: string) {
  const response = await api.get<
    DocumentationResponse<DocumentationPageResult | { redirect: string }>
  >(`/api/docs/pages/${encodeURIComponent(slug)}`)
  return response.data
}

export async function listDocumentationPages(params: {
  search: string
  status: string
  limit: number
  offset: number
}) {
  const response = await api.get<DocumentationPageListResponse>(
    '/api/docs/admin/pages',
    { params }
  )
  return response.data
}

export async function getDocumentationCategories() {
  const response = await api.get<
    DocumentationResponse<DocumentationCategory[]>
  >('/api/docs/admin/categories')
  return response.data
}

export async function getDocumentationSettings() {
  const response = await api.get<DocumentationResponse<DocumentationSettings>>(
    '/api/docs/admin/settings'
  )
  return response.data
}

export async function createDocumentationPage(input: DocumentationPageInput) {
  const response = await api.post<DocumentationResponse<DocumentationPage>>(
    '/api/docs/admin/pages',
    input
  )
  return response.data
}

export async function updateDocumentationPage(
  id: number,
  input: DocumentationPageInput
) {
  const response = await api.put<DocumentationResponse<DocumentationPage>>(
    `/api/docs/admin/pages/${id}`,
    input
  )
  return response.data
}

export async function setDocumentationPageStatus(
  id: number,
  status: DocumentationPage['status']
) {
  const response = await api.patch<DocumentationResponse<DocumentationPage>>(
    `/api/docs/admin/pages/${id}/status`,
    { status }
  )
  return response.data
}

export async function deleteDocumentationPage(id: number) {
  const response = await api.delete<DocumentationResponse<null>>(
    `/api/docs/admin/pages/${id}`
  )
  return response.data
}

export async function createDocumentationCategory(
  input: DocumentationCategoryInput
) {
  const response = await api.post<DocumentationResponse<DocumentationCategory>>(
    '/api/docs/admin/categories',
    input
  )
  return response.data
}

export async function updateDocumentationCategory(
  id: number,
  input: DocumentationCategoryInput
) {
  const response = await api.put<DocumentationResponse<DocumentationCategory>>(
    `/api/docs/admin/categories/${id}`,
    input
  )
  return response.data
}

export async function deleteDocumentationCategory(id: number) {
  const response = await api.delete<DocumentationResponse<null>>(
    `/api/docs/admin/categories/${id}`
  )
  return response.data
}

export async function saveDocumentationSettings(
  input: DocumentationSettingsInput
) {
  const response = await api.put<DocumentationResponse<DocumentationSettings>>(
    '/api/docs/admin/settings',
    input
  )
  return response.data
}
