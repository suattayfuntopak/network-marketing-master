import { NextResponse } from 'next/server'
import { APP_BUILD_ID } from '@/lib/infra/buildId'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    { buildId: APP_BUILD_ID },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
