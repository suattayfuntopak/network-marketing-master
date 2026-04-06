import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format, addMinutes, addHours, addDays } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSnoozeFollowUp } from '@/hooks/useCalendar'
import type { FollowUpWithContact } from '@/lib/calendar/types'

const PRESETS = [
  { key: '30min',    getDate: () => addMinutes(new Date(), 30) },
  { key: '1hour',    getDate: () => addHours(new Date(), 1) },
  { key: 'tomorrow', getDate: () => { const d = addDays(new Date(), 1); d.setHours(9,0,0,0); return d } },
  { key: '3days',    getDate: () => { const d = addDays(new Date(), 3); d.setHours(9,0,0,0); return d } },
  { key: '1week',    getDate: () => { const d = addDays(new Date(), 7); d.setHours(9,0,0,0); return d } },
] as const

interface Props {
  open: boolean
  onClose: () => void
  followUp: FollowUpWithContact | null
  userId: string
}

export function SnoozeFollowUpModal({ open, onClose, followUp, userId }: Props) {
  const { t } = useTranslation()
  const snooze = useSnoozeFollowUp(userId)
  const [customDate, setCustomDate] = useState('')

  const handlePreset = async (getDate: () => Date) => {
    if (!followUp) return
    await snooze.mutateAsync({ id: followUp.id, until: getDate() })
    onClose()
  }

  const handleCustom = async () => {
    if (!followUp || !customDate) return
    await snooze.mutateAsync({ id: followUp.id, until: new Date(customDate) })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('followUps.actions.snooze')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-1">
          {PRESETS.map(preset => (
            <button
              key={preset.key}
              onClick={() => handlePreset(preset.getDate)}
              disabled={snooze.isPending}
              className="w-full text-left px-3 py-2 rounded-md border hover:bg-muted transition-colors text-sm"
            >
              {t(`followUps.snooze.${preset.key}`)}
              <span className="text-xs text-muted-foreground ml-2">
                {format(preset.getDate(), 'd MMM, HH:mm')}
              </span>
            </button>
          ))}

          <div className="pt-2 border-t space-y-2">
            <label className="text-xs font-medium text-muted-foreground">{t('followUps.snooze.custom')}</label>
            <Input
              type="datetime-local"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
            />
            <Button
              className="w-full"
              size="sm"
              disabled={!customDate || snooze.isPending}
              onClick={handleCustom}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
