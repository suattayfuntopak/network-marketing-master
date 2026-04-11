import { Suspense, lazy, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import i18n from '@/i18n'

const LandingPage = lazy(async () => {
  const module = await import('@/pages/public/LandingPage')
  return { default: module.LandingPage }
})

const LoginPage = lazy(async () => {
  const module = await import('@/pages/public/LoginPage')
  return { default: module.LoginPage }
})

const RegisterPage = lazy(async () => {
  const module = await import('@/pages/public/RegisterPage')
  return { default: module.RegisterPage }
})

const ForgotPasswordPage = lazy(async () => {
  const module = await import('@/pages/public/ForgotPasswordPage')
  return { default: module.ForgotPasswordPage }
})

const ResetPasswordPage = lazy(async () => {
  const module = await import('@/pages/public/ResetPasswordPage')
  return { default: module.ResetPasswordPage }
})

const EmailConfirmPage = lazy(async () => {
  const module = await import('@/pages/public/EmailConfirmPage')
  return { default: module.EmailConfirmPage }
})

const DashboardLayout = lazy(async () => {
  const module = await import('@/app/layout/DashboardLayout')
  return { default: module.DashboardLayout }
})

const DashboardHome = lazy(async () => {
  const module = await import('@/pages/dashboard/DashboardHome')
  return { default: module.DashboardHome }
})

const ContactsListPage = lazy(async () => {
  const module = await import('@/pages/dashboard/contacts/ContactsListPage')
  return { default: module.ContactsListPage }
})

const ContactFormPage = lazy(async () => {
  const module = await import('@/pages/dashboard/contacts/ContactFormPage')
  return { default: module.ContactFormPage }
})

const ContactDetailPage = lazy(async () => {
  const module = await import('@/pages/dashboard/contacts/ContactDetailPage')
  return { default: module.ContactDetailPage }
})

const ContactsSummaryListPage = lazy(async () => {
  const module = await import('@/pages/dashboard/contacts/ContactsSummaryListPage')
  return { default: module.ContactsSummaryListPage }
})

const PipelinePage = lazy(async () => {
  const module = await import('@/pages/dashboard/pipeline/PipelinePage')
  return { default: module.PipelinePage }
})

const DealDetailPage = lazy(async () => {
  const module = await import('@/pages/dashboard/pipeline/DealDetailPage')
  return { default: module.DealDetailPage }
})

const CalendarPage = lazy(async () => {
  const module = await import('@/pages/dashboard/calendar/CalendarPage')
  return { default: module.CalendarPage }
})

const FollowUpsPage = lazy(async () => {
  const module = await import('@/pages/dashboard/calendar/FollowUpsPage')
  return { default: module.FollowUpsPage }
})

const CalendarAppointmentsPage = lazy(async () => {
  const module = await import('@/pages/dashboard/calendar/CalendarAppointmentsPage')
  return { default: module.CalendarAppointmentsPage }
})

const CalendarActionListPage = lazy(async () => {
  const module = await import('@/pages/dashboard/calendar/CalendarActionListPage')
  return { default: module.CalendarActionListPage }
})

const NotFoundPage = lazy(async () => {
  const module = await import('@/pages/public/NotFoundPage')
  return { default: module.NotFoundPage }
})

const MessagesPage = lazy(async () => {
  const module = await import('@/pages/dashboard/messages/MessagesPage')
  return { default: module.MessagesPage }
})

const AcademyPage = lazy(async () => {
  const module = await import('@/pages/dashboard/academy/AcademyPage')
  return { default: module.AcademyPage }
})

const AcademyContentDetailPage = lazy(async () => {
  const module = await import('@/pages/dashboard/academy/AcademyContentDetailPage')
  return { default: module.AcademyContentDetailPage }
})

const ObjectionsPage = lazy(async () => {
  const module = await import('@/pages/dashboard/academy/ObjectionsPage')
  return { default: module.ObjectionsPage }
})

const TeamPage = lazy(async () => {
  const module = await import('@/pages/dashboard/team/TeamPage')
  return { default: module.TeamPage }
})

const ProductCustomersPage = lazy(async () => {
  const module = await import('@/pages/dashboard/customers/ProductCustomersPage')
  return { default: module.ProductCustomersPage }
})

const AnalyticsPage = lazy(async () => {
  const module = await import('@/pages/dashboard/analytics/AnalyticsPage')
  return { default: module.AnalyticsPage }
})

const SettingsPage = lazy(async () => {
  const module = await import('@/pages/dashboard/settings/SettingsPage')
  return { default: module.SettingsPage }
})

function RouteLoadingFallback() {
  return (
    <div className="p-6 text-center text-muted-foreground">
      {i18n.t('common.preparingPage')}
    </div>
  )
}

function renderLazyRoute(element: ReactNode) {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {element}
    </Suspense>
  )
}

// Wrapper forces full remount of ContactDetailPage when ID changes,
// preventing stale query state when navigating between contacts.
function ContactDetailWrapper() {
  const { id } = useParams<{ id: string }>()
  return renderLazyRoute(<ContactDetailPage key={id} />)
}

// Same wrapper for edit form so it remounts when switching contacts
function ContactFormWrapper() {
  const { id } = useParams<{ id: string }>()
  return renderLazyRoute(<ContactFormPage key={id ?? 'new'} />)
}

export const router = createBrowserRouter([
  // Public routes
  { path: ROUTES.HOME, element: renderLazyRoute(<LandingPage />) },
  { path: ROUTES.LOGIN, element: renderLazyRoute(<LoginPage />) },
  { path: ROUTES.REGISTER, element: renderLazyRoute(<RegisterPage />) },
  { path: ROUTES.FORGOT_PASSWORD, element: renderLazyRoute(<ForgotPasswordPage />) },
  { path: ROUTES.RESET_PASSWORD, element: renderLazyRoute(<ResetPasswordPage />) },
  { path: ROUTES.EMAIL_CONFIRM, element: renderLazyRoute(<EmailConfirmPage />) },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: renderLazyRoute(<DashboardLayout />),
        children: [
          { path: ROUTES.DASHBOARD, element: renderLazyRoute(<DashboardHome />) },

          // Contacts
          { path: ROUTES.CONTACTS, element: renderLazyRoute(<ContactsListPage />) },
          { path: `${ROUTES.CONTACTS}/ozet/:summaryKey`, element: renderLazyRoute(<ContactsSummaryListPage />) },
          { path: `${ROUTES.CONTACTS}/yeni`, element: renderLazyRoute(<ContactFormPage key="new" />) },
          { path: `${ROUTES.CONTACTS}/:id`, element: <ContactDetailWrapper /> },
          { path: `${ROUTES.CONTACTS}/:id/duzenle`, element: <ContactFormWrapper /> },

          // Pipeline
          { path: ROUTES.PIPELINE, element: renderLazyRoute(<PipelinePage />) },
          { path: `${ROUTES.PIPELINE}/:dealId`, element: renderLazyRoute(<DealDetailPage />) },

          // Calendar
          { path: ROUTES.CALENDAR, element: renderLazyRoute(<CalendarPage />) },
          { path: `${ROUTES.CALENDAR}/hafta`, element: renderLazyRoute(<CalendarPage />) },
          { path: `${ROUTES.CALENDAR}/gun`, element: renderLazyRoute(<CalendarPage />) },
          { path: `${ROUTES.CALENDAR}/gundem`, element: renderLazyRoute(<CalendarPage />) },
          { path: `${ROUTES.CALENDAR}/randevular`, element: renderLazyRoute(<CalendarAppointmentsPage />) },
          { path: `${ROUTES.CALENDAR}/aksiyonlar/:summaryKey`, element: renderLazyRoute(<CalendarActionListPage />) },
          { path: `${ROUTES.CALENDAR}/takipler`, element: renderLazyRoute(<FollowUpsPage />) },

          // Messages
          { path: ROUTES.MESSAGES, element: renderLazyRoute(<MessagesPage />) },

          // Academy
          { path: ROUTES.ACADEMY, element: renderLazyRoute(<AcademyPage />) },
          { path: `${ROUTES.ACADEMY}/itirazlar`, element: renderLazyRoute(<ObjectionsPage />) },
          { path: `${ROUTES.ACADEMY}/:id`, element: renderLazyRoute(<AcademyContentDetailPage />) },
          { path: ROUTES.TEAM, element: renderLazyRoute(<TeamPage />) },
          { path: ROUTES.PRODUCT_CUSTOMERS, element: renderLazyRoute(<ProductCustomersPage />) },
          { path: `${ROUTES.PRODUCT_CUSTOMERS}/yeni`, element: renderLazyRoute(<ContactFormPage key="customer-new" />) },
          { path: `${ROUTES.PRODUCT_CUSTOMERS}/:id/duzenle`, element: <ContactFormWrapper /> },
          { path: ROUTES.ANALYTICS, element: renderLazyRoute(<AnalyticsPage />) },
          { path: ROUTES.SETTINGS, element: renderLazyRoute(<SettingsPage />) },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: renderLazyRoute(<NotFoundPage />) },
])
