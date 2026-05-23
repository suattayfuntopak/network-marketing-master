'use client'

import { TrendingUp, PenLine, Users, CalendarDays } from 'lucide-react'
import { SquareButton } from '@/components/ui/SquareButton'

export function QuickAccess() {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-gray-700">Hızlı erişim</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SquareButton icon={TrendingUp}   label="Pipeline"  color="purple" href="/pipeline" />
        <SquareButton icon={PenLine}      label="Mesaj Yaz" color="teal"   href="/yazar"    />
        <SquareButton icon={Users}        label="Ekibim"    color="amber"  href="/ekip"     />
        <SquareButton icon={CalendarDays} label="Takvim"    color="pink"   href="/takvim"   />
      </div>
    </section>
  )
}
