'use client'

import { use } from 'react'
import { TeamMemberDetail } from './_components/TeamMemberDetail'

export default function TeamMemberPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = use(params)
  return <TeamMemberDetail memberUserId={userId} />
}
