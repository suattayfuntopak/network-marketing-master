import { useEffect, useRef } from 'react'
import { parseISO, differenceInMinutes } from 'date-fns'
import i18n from '@/i18n'
import type { AppointmentWithContact } from '@/lib/calendar/types'

export function useNotifications() {
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })
  }

  return { requestPermission, showNotification, permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied' }
}

// Poll every minute for upcoming appointments and show browser notifications
export function useAppointmentNotifications(appointments: AppointmentWithContact[]) {
  const notifiedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return

    const check = () => {
      const now = new Date()
      appointments.forEach((apt) => {
        if (apt.status !== 'scheduled' && apt.status !== 'confirmed') return
        if (notifiedIds.current.has(apt.id)) return

        const startsAt = parseISO(apt.starts_at)
        const minutesUntil = differenceInMinutes(startsAt, now)

        // Notify at 15 min and 5 min before
        const thresholds = apt.reminder_minutes?.length ? apt.reminder_minutes : [15]
        const shouldNotify = thresholds.some(
          (threshold) => minutesUntil <= threshold && minutesUntil > 0
        )

        if (shouldNotify) {
          notifiedIds.current.add(apt.id)
          const contactName = apt.contact?.full_name ? ` — ${apt.contact.full_name}` : ''
          const isEn = i18n.language?.startsWith('en')
          const body = isEn
            ? `Starting in ${minutesUntil} minutes`
            : `${minutesUntil} dakika içinde başlıyor`
          new Notification(`📅 ${apt.title}${contactName}`, {
            body,
            icon: '/favicon.ico',
            tag: apt.id,
          })
        }
      })
    }

    check()
    const interval = setInterval(check, 60_000)
    return () => clearInterval(interval)
  }, [appointments])
}
