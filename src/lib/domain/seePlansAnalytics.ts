import { logProductEventAction } from '@/app/(dashboard)/_shared-actions/productEvents'
import {
  PRODUCT_EVENTS,
  type SeePlansClickMetadata,
  type SeePlansClickPhase,
  type SeePlansClickSource,
} from '@/lib/domain/productEvents'

export function logSeePlansClick(phase: SeePlansClickPhase, source: SeePlansClickSource): void {
  const metadata: SeePlansClickMetadata = { phase, source }
  void logProductEventAction(PRODUCT_EVENTS.seePlansClick, metadata)
}
