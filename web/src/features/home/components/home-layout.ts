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
export const homeLayoutClasses = {
  brandSpacer: 'home-brand-reveal relative z-0',
  endpoint:
    'flex w-full max-w-[46rem] flex-col overflow-hidden rounded-xl border border-[var(--home-line)] bg-[var(--home-glass)] shadow-sm backdrop-blur-md sm:w-fit sm:flex-row sm:items-stretch',
  featureGrid:
    'grid gap-px overflow-hidden rounded-xl border border-[var(--home-line)] bg-[var(--home-line)] md:grid-cols-3',
  flowStage: 'relative z-20 lg:h-[340svh]',
  flowViewport:
    'relative overflow-hidden rounded-t-[2.5rem] bg-[var(--home-flow)] text-[var(--home-flow-ink)] shadow-[0_-32px_90px_-24px_var(--home-shadow)] lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center',
  foregroundStack: 'relative z-10 bg-[var(--home-canvas)]',
  heroStage:
    'relative isolate z-10 min-h-svh overflow-hidden bg-[var(--home-canvas)] px-4 pt-24 pb-10 sm:px-6 sm:pt-28 lg:sticky lg:top-0 lg:h-svh lg:px-8 lg:pt-24',
  heroContent:
    'grid min-w-0 items-end gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] lg:gap-14',
  metrics:
    'grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--home-line)] sm:grid-cols-4',
} as const
