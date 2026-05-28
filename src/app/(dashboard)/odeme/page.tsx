import { MaintenanceNotice } from './_components/MaintenanceNotice'
import { OdemePageClient } from './_components/OdemePageClient'

// Render at request time so PAYMENT_MAINTENANCE toggles in Vercel take effect
// without a redeploy. Without this, the env value is inlined at build time.
export const dynamic = 'force-dynamic'

export default function OdemePage() {
  // Maintenance gate: when PAYMENT_MAINTENANCE=true is set in env, hide the
  // purchase UI so we don't initiate orders that the webhook can't honor
  // (e.g. during a webhook-format migration deploy).
  if (process.env.PAYMENT_MAINTENANCE === 'true') {
    return <MaintenanceNotice />
  }

  return <OdemePageClient />
}
