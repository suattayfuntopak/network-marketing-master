import { createClient } from '@/lib/supabase/server'
import type { ProductEventName } from '@/lib/domain/productEvents'

export async function insertProductEvent(params: {
  eventName: ProductEventName
  sessionId?: string | null
  metadata?: Record<string, string | number | boolean | null>
}): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('nmm_product_events').insert({
      event_name: params.eventName,
      user_id: user?.id ?? null,
      session_id: params.sessionId ?? null,
      metadata: params.metadata ?? {},
    })
  } catch (err) {
    console.error('[insertProductEvent]', params.eventName, err)
  }
}
