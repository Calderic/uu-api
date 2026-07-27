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
const MAX_DEVICE_PIXEL_RATIO = 2
const MAX_RENDER_PIXELS = 5_000_000

export function resolveLiquidChromeDpr(
  width: number,
  height: number,
  devicePixelRatio: number
): number {
  const displayDpr =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
      ? Math.min(devicePixelRatio, MAX_DEVICE_PIXEL_RATIO)
      : 1

  if (displayDpr <= 1) return displayDpr

  const cssPixelCount = width * height
  if (!Number.isFinite(cssPixelCount) || cssPixelCount <= 0) return displayDpr

  const budgetDpr = Math.sqrt(MAX_RENDER_PIXELS / cssPixelCount)
  return Math.max(1, Math.min(displayDpr, budgetDpr))
}
