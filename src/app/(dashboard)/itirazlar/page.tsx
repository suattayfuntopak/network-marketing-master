import { redirect } from 'next/navigation'

export { ITIRAZLAR } from './data/itirazlar'
export type { Itiraz } from './types'

type SearchParams = { id?: string; tab?: string }

export default async function ItirazlarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const params = new URLSearchParams()
  params.set('tab', 'objections')
  if (sp.id) params.set('id', sp.id)
  redirect(`/egitim?${params.toString()}`)
}
