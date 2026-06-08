'use client'

import { useState } from 'react'
import Image from 'next/image'
import { clsx } from 'clsx'
import { getPastelAvatarClasses } from '@/lib/ui/avatarColors'

const SIZE_CLASS = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-xl',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
} as const

export type PersonAvatarSize = keyof typeof SIZE_CLASS

interface PersonAvatarProps {
  name: string
  imageUrl?: string | null
  size?: PersonAvatarSize
  className?: string
}

export function PersonAvatar({ name, imageUrl, size = 'md', className }: PersonAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const initial = (name.trim().charAt(0) || '?').toUpperCase()
  const showImage = Boolean(imageUrl?.trim()) && !imgFailed

  return (
    <div
      className={clsx(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold',
        SIZE_CLASS[size],
        !showImage && getPastelAvatarClasses(name),
        className
      )}
    >
      {showImage ? (
        <Image
          src={imageUrl!.trim()}
          alt={name}
          width={80}
          height={80}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span aria-hidden>{initial}</span>
      )}
    </div>
  )
}
