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
import {
  Activity01Icon,
  BubbleChatIcon,
  ConnectIcon,
  CreditCardIcon,
  CubeIcon,
  DashboardSquare02Icon,
  File02Icon,
  Key01Icon,
  ServerStack01Icon,
  Settings02Icon,
  Task01Icon,
  TestTube01Icon,
  Ticket01Icon,
  UserCircleIcon,
  UserGroupIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'
import { useTranslation } from 'react-i18next'

import type { SidebarData } from '@/components/layout/types'
import { ROLE } from '@/lib/roles'

/**
 * Root navigation groups for the application sidebar.
 *
 * These are shown when the URL does not match any nested sidebar view
 * registered in `layout/lib/sidebar-view-registry.ts`.
 */
export function useSidebarData(): SidebarData {
  const { t } = useTranslation()

  return {
    navGroups: [
      {
        id: 'chat',
        title: t('Chat'),
        items: [
          {
            title: t('Playground'),
            url: '/playground',
            icon: TestTube01Icon,
          },
          {
            title: t('Chat'),
            icon: BubbleChatIcon,
            type: 'chat-presets',
          },
        ],
      },
      {
        id: 'general',
        title: t('General'),
        items: [
          {
            title: t('Overview'),
            url: '/dashboard/overview',
            icon: Activity01Icon,
          },
          {
            title: t('Dashboard'),
            url: '/dashboard/models',
            icon: DashboardSquare02Icon,
          },
          {
            title: t('API Keys'),
            url: '/keys',
            icon: Key01Icon,
          },
          {
            title: t('Usage Logs'),
            url: '/usage-logs/common',
            icon: File02Icon,
          },
          {
            title: t('Task Logs'),
            url: '/usage-logs/task',
            activeUrls: ['/usage-logs/drawing'],
            configUrls: ['/usage-logs/drawing', '/usage-logs/task'],
            icon: Task01Icon,
          },
        ],
      },
      {
        id: 'personal',
        title: t('Personal'),
        items: [
          {
            title: t('Wallet'),
            url: '/wallet',
            icon: Wallet01Icon,
          },
          {
            title: t('Profile'),
            url: '/profile',
            icon: UserCircleIcon,
          },
        ],
      },
      {
        id: 'admin',
        title: t('Admin'),
        items: [
          {
            title: t('Channels'),
            url: '/channels',
            icon: ConnectIcon,
          },
          {
            title: t('Models'),
            url: '/models/metadata',
            icon: CubeIcon,
          },
          {
            title: t('Users'),
            url: '/users',
            icon: UserGroupIcon,
          },
          {
            title: t('Redemption Codes'),
            url: '/redemption-codes',
            icon: Ticket01Icon,
          },
          {
            title: t('Subscriptions'),
            url: '/subscriptions',
            icon: CreditCardIcon,
          },
          {
            title: t('System Info'),
            url: '/system-info',
            icon: ServerStack01Icon,
            requiredRole: ROLE.SUPER_ADMIN,
          },
          {
            title: t('System Settings'),
            url: '/system-settings/site',
            activeUrls: ['/system-settings'],
            icon: Settings02Icon,
          },
        ],
      },
    ],
  }
}
