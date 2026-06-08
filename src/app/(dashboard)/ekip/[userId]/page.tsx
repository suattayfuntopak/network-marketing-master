import { MemberDetailPage } from './_components/MemberDetailPage'

export default async function MemberDetailRoute({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  return <MemberDetailPage userId={userId} />
}
