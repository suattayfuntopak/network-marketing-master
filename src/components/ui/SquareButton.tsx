'use client'

import Link from 'next/link'
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

const sharedClass = (color: ButtonColor, compact?: boolean, className?: string) =>
  clsx(
    'flex flex-col items-center justify-center gap-1.5',
    'rounded-[14px] transition-all duration-150',
    'active:scale-95 hover:scale-[1.03] hover:shadow-md',
    'md:rounded-[12px]',
    compact ? 'h-[76px] p-3' : 'aspect-square p-4 md:p-3',
    colorMap[color],
    className
  )

interface SquareButtonProps {
  icon: LucideIcon
  label: string
  color?: ButtonColor
  href?: string
  onClick?: () => void
  disabled?: boolean
  compact?: boolean
  className?: string
}

export function SquareButton({
  icon: Icon,
  label,
  color = 'purple',
  href,
  onClick,
  disabled = false,
  compact = false,
  className,
}: SquareButtonProps) {
  const content = (
    <>
      <Icon className={compact ? 'h-5 w-5 shrink-0' : 'h-6 w-6 shrink-0'} strokeWidth={1.75} />
      <span className="text-center text-xs font-semibold leading-tight">{label}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} className={sharedClass(color, compact, className)}>
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(sharedClass(color, compact, className), 'disabled:pointer-events-none disabled:opacity-40')}
    >
      {content}
    </button>
  )
}
