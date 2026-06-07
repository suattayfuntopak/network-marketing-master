import { redirect } from 'next/navigation'

/** Canonical ekip route is /ekip — legacy Crown path redirects here. */
export default function EkibimRedirectPage() {
  redirect('/ekip')
}
