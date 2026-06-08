import { redirect } from 'next/navigation'

type Props = { searchParams: Promise<{ offset?: string }> }

export default async function BugunkuTakibimPage({ searchParams }: Props) {
  const { offset } = await searchParams
  const q = new URLSearchParams({ tab: 'daily' })
  if (offset) q.set('offset', offset)
  redirect(`/saha-ozetim?${q.toString()}`)
}
