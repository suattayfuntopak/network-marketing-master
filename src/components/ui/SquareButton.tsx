'use client'

import { type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

type ButtonColor = 'purple' | 'teal' | 'amber' | 'pink' | 'blue' | 'coral'

const colorMap: Record<ButtonColor, string> = {
  purple: 'bg-[#EEEDFE] text-[#534AB7] hover:bg-[#E3E1FD]',
  teal:   'bg-[#E1F5EE] text-[#0F6E56] hover:bg-[#D2EFE4]',
  amber:  'bg-[#FAEEDA] text-[#854F0B] hover:bg-[#F6E4C4]',
  pink:   'bg-[#FBEAF0] text-[#72243E] hover:bg-[#F5D9E5]',
  blue:   'bg-[#E8F0FE] text-[#1A56DB] hover:bg-[#D6E4FD]',
  coral:  'bg-[#FEF0EC] text-[#C03E1F] hover:bg-[#FDE3DA]',
}

interface SquareButtonProps {
  icon: LucideIcon
  label: string
  color?: ButtonColor
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function SquareButton({
  icon: Icon,
  label,
  color = 'purple',
  onClick,
  disabled = false,
  className,
}: SquareButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex aspect-square flex-col items-center justify-center gap-2',
        'rounded-[14px] p-4 transition-all duration-150',
        'active:scale-95 hover:scale-[1.03] hover:shadow-md',
        'disabled:pointer-events-none disabled:opacity-40',
        'md:rounded-[12px]',
        colorMap[color],
        className
      )}
    >
      <Icon className="h-6 w-6 shrink-0" strokeWidth={1.75} />
      <span className="text-xs font-semibold leading-tight text-center">{label}</span>
    </button>
  )
}
