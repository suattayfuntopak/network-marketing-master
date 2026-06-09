'use server'

import { insertProductEvent } from '@/lib/infra/productEvents'
import type { ProductEventName } from '@/lib/domain/productEvents'

export async function logProductEventAction(
  eventName: ProductEventName,
  metadata?: Record<string, string | number | boolean | null>,
  sessionId?: string | null,
): Promise<void> {
  await insertProductEvent({ eventName, metadata, sessionId })
}
