import { CandidateDetail } from './_components/CandidateDetail'

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CandidateDetail candidateId={id} />
}
