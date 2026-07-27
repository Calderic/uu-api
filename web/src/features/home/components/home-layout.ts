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
  landingRoot: 'home-landing',
  brandSpacer: 'home-brand-reveal relative z-0',
  endpoint:
    'flex w-full max-w-[46rem] flex-col overflow-hidden rounded-xl border border-[var(--home-line)] bg-[var(--home-glass)] shadow-sm backdrop-blur-md sm:w-fit sm:flex-row sm:items-stretch',
  featureGrid:
    'grid overflow-hidden border-y border-[var(--home-line)] lg:grid-cols-[minmax(0,1.18fr)_minmax(22rem,0.82fr)]',
  flowStage: 'relative z-20 lg:h-[380svh]',
  flowViewport:
    'relative overflow-hidden border-t border-[var(--home-flow-line)] bg-[var(--home-flow)] text-[var(--home-flow-ink)] lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:justify-center',
  foregroundStack: 'relative z-10 bg-[var(--home-canvas)]',
  heroBoundary: 'relative z-20 h-px bg-[var(--home-canvas)]',
  heroStage:
    'home-hero-dark relative isolate z-10 min-h-svh overflow-hidden bg-[var(--home-canvas)] px-4 pt-24 pb-10 sm:px-6 sm:pt-28 lg:sticky lg:top-0 lg:h-svh lg:px-8 lg:pt-24',
  liquidChromeBackdrop:
    'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
  heroContent:
    'grid min-w-0 items-end gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] lg:gap-14',
  kineticStage: 'relative z-20 lg:h-[260svh]',
  kineticViewport:
    'relative isolate flex min-h-svh items-center overflow-hidden bg-[var(--home-tint)] px-4 py-24 sm:px-6 lg:sticky lg:top-0 lg:h-svh lg:px-8 lg:py-0',
  metrics:
    'grid border-t border-[var(--home-line)] sm:grid-cols-2 lg:grid-cols-4',
  signalRail:
    'home-signal-rail flex w-max min-w-full items-center border-y border-[var(--home-line)] py-4',
} as const
