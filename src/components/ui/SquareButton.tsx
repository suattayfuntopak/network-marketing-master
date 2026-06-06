'use client'

import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

export type ButtonColor = 'purple' | 'teal' | 'amber' | 'pink' | 'blue' | 'coral' | 'rose' | 'indigo' | 'cyan' | 'yellow'
export type ButtonVariant = 'filled' | 'crown'

// ─── Filled variant: colored background ──────────────────────────────────────
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

const filledClass = (
  color: ButtonColor,
  opts?: { compact?: boolean; prominent?: boolean; fill?: boolean; className?: string },
) =>
  clsx(
    'flex flex-col items-center justify-center',
    opts?.compact ? 'gap-1.5' : opts?.prominent ? 'gap-1.5 md:gap-3' : 'gap-1.5 md:gap-2.5',
    'rounded-[14px] transition-all duration-150',
    'active:scale-95 hover:scale-[1.03]',
    'border border-[var(--border)] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.2)] hover:shadow-lg',
    'md:rounded-[12px]',
    opts?.compact
      ? 'h-[76px] p-3'
      : opts?.fill
        ? 'h-full w-full p-3 md:p-6'
        : opts?.prominent
          ? 'aspect-square p-4 md:p-7'
          : 'aspect-square p-4 md:p-6',
    colorMap[color],
    opts?.className,
  )

// ─── Crown variant: tam kutu — her kutunun kendi marka rengi (eski üst çizgi hex'leri) ───
const crownSolidMap: Record<ButtonColor, string> = {
  purple: 'bg-[#534AB7] text-white hover:bg-[#453DA0] dark:bg-[#534AB7] dark:text-white dark:hover:bg-[#453DA0]',
  teal:   'bg-[#0F6E56] text-white hover:bg-[#0d5c48] dark:bg-[#0F6E56] dark:text-white dark:hover:bg-[#0d5c48]',
  amber:  'bg-[#854F0B] text-white hover:bg-[#704208] dark:bg-[#854F0B] dark:text-white dark:hover:bg-[#704208]',
  pink:   'bg-[#72243E] text-white hover:bg-[#601e34] dark:bg-[#72243E] dark:text-white dark:hover:bg-[#601e34]',
  blue:   'bg-[#1A56DB] text-white hover:bg-[#1648b8] dark:bg-[#1A56DB] dark:text-white dark:hover:bg-[#1648b8]',
  coral:  'bg-[#C03E1F] text-white hover:bg-[#a5341a] dark:bg-[#C03E1F] dark:text-white dark:hover:bg-[#a5341a]',
  rose:   'bg-[#9B1D47] text-white hover:bg-[#83193c] dark:bg-[#9B1D47] dark:text-white dark:hover:bg-[#83193c]',
  indigo: 'bg-[#3730A3] text-white hover:bg-[#2e288a] dark:bg-[#3730A3] dark:text-white dark:hover:bg-[#2e288a]',
  cyan:   'bg-[#0891B2] text-white hover:bg-[#077a96] dark:bg-[#0891B2] dark:text-white dark:hover:bg-[#077a96]',
  yellow: 'bg-[#854D0E] text-white hover:bg-[#704208] dark:bg-[#854D0E] dark:text-white dark:hover:bg-[#704208]',
}

const crownClass = (
  color: ButtonColor,
  opts?: { compact?: boolean; prominent?: boolean; fill?: boolean; className?: string },
) =>
  clsx(
    'flex flex-col items-center justify-center',
    opts?.compact ? 'gap-1.5' : opts?.fill ? 'gap-1.5 md:gap-3' : 'gap-2 md:gap-3',
    'rounded-[14px] md:rounded-[12px]',
    'transition-all duration-150',
    'active:scale-95 hover:scale-[1.03]',
    'border border-black/5 dark:border-white/10',
    'shadow-[0_4px_20px_-2px_rgba(0,0,0,0.12)] hover:shadow-lg dark:shadow-[0_4px_24px_-2px_rgba(0,0,0,0.35)]',
    crownSolidMap[color],
    opts?.compact
      ? 'h-[76px] p-3'
      : opts?.fill
        ? 'h-full w-full p-3 md:p-6'
        : opts?.prominent
          ? 'aspect-square p-4 md:p-6'
          : 'aspect-square p-4 md:p-5',
    opts?.className,
  )

interface SquareButtonProps {
  icon: LucideIcon
  label: string
  color?: ButtonColor
  /** @deprecated desktopColor is unused in crown variant; kept for backward compat */
  desktopColor?: ButtonColor
  variant?: ButtonVariant
  href?: string
  onClick?: () => void
  disabled?: boolean
  compact?: boolean
  /** Pano launcher — larger tiles on md+ */
  prominent?: boolean
  /** LauncherGrid hücresini doldur — pano ile aynı kare boyut */
  fill?: boolean
  className?: string
}

export function SquareButton({
  icon: Icon,
  label,
  color = 'purple',
  variant = 'filled',
  href,
  onClick,
  disabled = false,
  compact = false,
  prominent = false,
  fill = false,
  className,
}: SquareButtonProps) {
  const styleOpts = { compact, prominent, fill, className }

  const buttonClass =
    variant === 'crown'
      ? crownClass(color, styleOpts)
      : filledClass(color, styleOpts)

  const content = (
    <>
      <Icon
        className={
          compact
            ? 'h-5 w-5 shrink-0'
            : prominent
              ? variant === 'crown'
                ? 'h-8 w-8 shrink-0 md:h-10 md:w-10'
                : 'h-6 w-6 shrink-0 md:h-[2.375rem] md:w-[2.375rem]'
              : variant === 'crown'
                ? 'h-7 w-7 shrink-0 md:h-9 md:w-9'
                : 'h-6 w-6 shrink-0 md:h-9 md:w-9'
        }
        strokeWidth={1.75}
      />
      <span
        className={
          compact
            ? 'text-center text-xs font-semibold leading-tight'
            : prominent
              ? variant === 'crown'
                ? 'line-clamp-2 text-center text-[15px] font-semibold leading-snug md:text-[20px]'
                : 'text-center text-xs font-semibold leading-tight md:text-sm md:leading-snug'
              : 'text-center text-xs font-semibold leading-tight md:text-sm'
        }
      >
        {label}
      </span>
    </>
  )

  if (href) {
    return (
      <Link href={href} prefetch className={buttonClass}>
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(buttonClass, 'disabled:pointer-events-none disabled:opacity-40')}
    >
      {content}
    </button>
  )
}
