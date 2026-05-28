import { Suspense } from 'react'
import { ItirazlarContent } from './_components/ItirazlarContent'

export { ITIRAZLAR } from './data/itirazlar'
export type { Itiraz } from './types'

export default function ItirazlarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-3)]">Yükleniyor...</div>}>
      <ItirazlarContent />
    </Suspense>
  )
}
