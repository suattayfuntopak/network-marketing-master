import { MaintenanceNotice } from './_components/MaintenanceNotice'
import { OdemePageClient } from './_components/OdemePageClient'

export default function OdemePage() {
  // Maintenance gate: when PAYMENT_MAINTENANCE=true is set in env, hide the
  // purchase UI so we don't initiate orders that the webhook can't honor
  // (e.g. during a webhook-format migration deploy).
  if (process.env.PAYMENT_MAINTENANCE === 'true') {
    return <MaintenanceNotice />
  }

  return <OdemePageClient />
}
