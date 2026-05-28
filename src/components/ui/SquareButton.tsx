'use client'

import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

type ButtonColor = 'purple' | 'teal' | 'amber' | 'pink' | 'blue' | 'coral' | 'rose' | 'indigo' | 'cyan' | 'yellow'

const colorMap: Record<ButtonColor, string> = {
  purple: 'bg-[#EEEDFE] text-[#534AB7] hover:bg-[#E3E1FD] dark:bg-[#2d2a5e] dark:text-[#a09be8] dark:hover:bg-[#383474]',
  teal:   'bg-[#E1F5EE] text-[#0F6E56] hover:bg-[#D2EFE4] dark:bg-[#0d3d2e] dark:text-[#4ade80] dark:hover:bg-[#144d3a]',
  amber:  'bg-[#FAEEDA] text-[#854F0B] hover:bg-[#F6E4C4] dark:bg-[#3a2200] dark:text-[#fbbf24] dark:hover:bg-[#4a2d00]',
  pink:   'bg-[#FBEAF0] text-[#72243E] hover:bg-[#F5D9E5] dark:bg-[#3d0f1f] dark:text-[#f9a8d4] dark:hover:bg-[#4d1428]',
  blue:   'bg-[#E8F0FE] text-[#1A56DB] hover:bg-[#D6E4FD] dark:bg-[#0a1f4d] dark:text-[#93c5fd] dark:hover:bg-[#0f2860]',
  coral:  'bg-[#FEF0EC] text-[#C03E1F] hover:bg-[#FDE3DA] dark:bg-[#3d1409] dark:text-[#fca87d] dark:hover:bg-[#4d1a0d]',
  rose:   'bg-[#FFF1F3] text-[#9B1D47] hover:bg-[#FFE4EA] dark:bg-[#3d0a1a] dark:text-[#fda4af] dark:hover:bg-[#4d1022]',
  indigo: 'bg-[#EEF2FF] text-[#3730A3] hover:bg-[#E0E7FF] dark:bg-[#1e1b4b] dark:text-[#a5b4fc] dark:hover:bg-[#272060]',
  cyan:   'bg-[#ECFEFF] text-[#0891B2] hover:bg-[#CFFAFE] dark:bg-[#083344] dark:text-[#22D3EE] dark:hover:bg-[#164E63]',
  yellow: 'bg-[#FEF9C3] text-[#854D0E] hover:bg-[#FEF08A] dark:bg-[#453A0B] dark:text-[#FACC15] dark:hover:bg-[#5C4D0E]',
}

const sharedClass = (color: ButtonColor, compact?: boolean, className?: string) =>
  clsx(
    'flex flex-col items-center justify-center',
    compact ? 'gap-1.5' : 'gap-1.5 md:gap-2.5',
    'rounded-[14px] transition-all duration-150',
    'active:scale-95 hover:scale-[1.03]',
    'border border-[var(--border)] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.2)] hover:shadow-lg',
    'md:rounded-[12px]',
    compact ? 'h-[76px] p-3' : 'aspect-square p-4 md:p-6',
    colorMap[color],
    className
  )

interface SquareButtonProps {
  icon: LucideIcon
  label: string
  color?: ButtonColor
  desktopColor?: ButtonColor
  href?: string
  onClick?: () => void
  disabled?: boolean
  compact?: boolean
  className?: string
}

import { useState, useEffect } from 'react'

export function SquareButton({
  icon: Icon,
  label,
  color = 'purple',
  desktopColor,
  href,
  onClick,
  disabled = false,
  compact = false,
  className,
}: SquareButtonProps) {
  const [isMobile, setIsMobile] = useState(true)
  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const activeColor = (desktopColor && !isMobile) ? desktopColor : color
  const content = (
    <>
      <Icon className={compact ? 'h-5 w-5 shrink-0' : 'h-6 w-6 shrink-0 md:h-9 md:w-9'} strokeWidth={1.75} />
      <span className={compact ? 'text-center text-xs font-semibold leading-tight' : 'text-center text-xs font-semibold leading-tight md:text-sm'}>{label}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} prefetch className={sharedClass(activeColor, compact, className)}>
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(sharedClass(activeColor, compact, className), 'disabled:pointer-events-none disabled:opacity-40')}
    >
      {content}
    </button>
  )
}
