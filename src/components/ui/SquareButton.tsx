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
        ? 'h-full w-full p-4 md:p-6'
        : opts?.prominent
          ? 'aspect-square p-4 md:p-7'
          : 'aspect-square p-4 md:p-6',
    colorMap[color],
    opts?.className,
  )

// ─── Crown variant: white card + colored top accent (Crown Team aesthetic) ───
// Neutral background, 3px colored border-top, dark icon/text — set via borderTopColor style prop
/** Crown üst çizgi — filled variant ile aynı marka renkleri */
const crownAccentHex: Record<ButtonColor, string> = {
  purple: '#534AB7',
  teal:   '#0F6E56',
  amber:  '#854F0B',
  pink:   '#72243E',
  blue:   '#1A56DB',
  coral:  '#C03E1F',
  rose:   '#9B1D47',
  indigo: '#3730A3',
  cyan:   '#0891B2',
  yellow: '#854D0E',
}

const crownClass = (opts?: { compact?: boolean; prominent?: boolean; fill?: boolean; className?: string }) =>
  clsx(
    'flex flex-col items-center justify-center',
    opts?.compact ? 'gap-1.5' : 'gap-2 md:gap-3',
    'rounded-[14px] md:rounded-[12px]',
    'transition-all duration-150',
    'active:scale-95 hover:scale-[1.03]',
    'bg-[var(--bg-card)] text-[var(--text-1)]',
    'border border-[var(--border)] border-t-[3px]',
    'shadow-[0_2px_12px_-3px_rgba(0,0,0,0.08)] hover:shadow-md dark:shadow-[0_2px_16px_-3px_rgba(0,0,0,0.3)]',
    'hover:bg-[var(--bg-subtle)]',
    opts?.compact
      ? 'h-[76px] p-3'
      : opts?.fill
        ? 'h-full w-full p-4 md:p-6'
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
      ? crownClass(styleOpts)
      : filledClass(color, styleOpts)

  const inlineStyle: React.CSSProperties | undefined =
    variant === 'crown'
      ? { borderTopColor: crownAccentHex[color] }
      : undefined

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
                ? 'line-clamp-2 text-center text-sm font-semibold leading-tight'
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
      <Link href={href} prefetch className={buttonClass} style={inlineStyle}>
        {content}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(buttonClass, 'disabled:pointer-events-none disabled:opacity-40')}
      style={inlineStyle}
    >
      {content}
    </button>
  )
}
