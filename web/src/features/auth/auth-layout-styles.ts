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
export const splitAuthLayoutClasses = {
  root: 'bg-auth-backdrop flex min-h-svh justify-center p-3 sm:p-6 lg:p-8',
  shell:
    'bg-auth-panel text-auth-panel-foreground ring-auth-border my-auto grid w-full max-w-[80rem] overflow-hidden rounded-[1.75rem] shadow-2xl ring-1 lg:min-h-[min(52rem,calc(100svh-4rem))] lg:grid-cols-[1.04fr_0.96fr]',
  panel: 'order-2 flex min-w-0 flex-col lg:order-1',
  header:
    'flex items-center justify-between gap-4 px-6 pt-6 sm:px-9 sm:pt-8 lg:px-12 lg:pt-10',
  content:
    'flex flex-1 items-center justify-center px-6 py-10 sm:px-9 lg:px-12 lg:py-8',
  form: 'w-full max-w-[23rem]',
  formWide: 'max-w-[26rem]',
  visual:
    'bg-auth-field order-1 relative m-3 mb-0 h-56 overflow-hidden rounded-[1.25rem] sm:h-72 lg:order-2 lg:m-4 lg:ms-0 lg:h-auto lg:min-h-[calc(100%-2rem)]',
  visualDesktopOnly: 'hidden lg:block',
  image: 'absolute inset-0 size-full object-cover object-center',
} as const
