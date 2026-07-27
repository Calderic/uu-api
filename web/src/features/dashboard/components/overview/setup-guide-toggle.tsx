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
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Button } from '@/components/ui/button'

export interface SetupGuideToggleProps {
  expanded: boolean
  label: string
  onToggle: () => void
}

export function SetupGuideToggle(props: SetupGuideToggleProps) {
  const Icon = props.expanded ? ChevronUp : ChevronDown

  return (
    <Button
      type='button'
      variant='outline'
      size='icon-sm'
      className='bg-background/70 shrink-0'
      onClick={props.onToggle}
      aria-expanded={props.expanded}
      aria-label={props.label}
      title={props.label}
    >
      <Icon aria-hidden='true' />
    </Button>
  )
}
