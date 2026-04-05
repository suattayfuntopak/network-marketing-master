import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { LandingPage } from '@/pages/public/LandingPage'
import { LoginPage } from '@/pages/public/LoginPage'
import { RegisterPage } from '@/pages/public/RegisterPage'
import { ForgotPasswordPage } from '@/pages/public/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/public/ResetPasswordPage'
import { EmailConfirmPage } from '@/pages/public/EmailConfirmPage'
import { DashboardLayout } from '@/app/layout/DashboardLayout'
import { DashboardHome } from '@/pages/dashboard/DashboardHome'
import { NotFoundPage } from '@/pages/public/NotFoundPage'

export const router = createBrowserRouter([
  // Public routes
  {
    path: ROUTES.HOME,
    element: <LandingPage />,
  },
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: ROUTES.REGISTER,
    element: <RegisterPage />,
  },
  {
    path: ROUTES.FORGOT_PASSWORD,
    element: <ForgotPasswordPage />,
  },
  {
    path: ROUTES.RESET_PASSWORD,
    element: <ResetPasswordPage />,
  },
  {
    path: ROUTES.EMAIL_CONFIRM,
    element: <EmailConfirmPage />,
  },
  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.DASHBOARD, element: <DashboardHome /> },
          { path: ROUTES.CONTACTS, element: <div className="p-6"><h1 className="text-2xl font-bold">Kontaklar</h1><p className="text-muted-foreground mt-2">Yakında...</p></div> },
          { path: ROUTES.PIPELINE, element: <div className="p-6"><h1 className="text-2xl font-bold">Pipeline</h1><p className="text-muted-foreground mt-2">Yakında...</p></div> },
          { path: ROUTES.MESSAGES, element: <div className="p-6"><h1 className="text-2xl font-bold">Mesajlar</h1><p className="text-muted-foreground mt-2">Yakında...</p></div> },
          { path: ROUTES.CALENDAR, element: <div className="p-6"><h1 className="text-2xl font-bold">Takvim</h1><p className="text-muted-foreground mt-2">Yakında...</p></div> },
          { path: ROUTES.ACADEMY, element: <div className="p-6"><h1 className="text-2xl font-bold">Akademi</h1><p className="text-muted-foreground mt-2">Yakında...</p></div> },
          { path: ROUTES.TEAM, element: <div className="p-6"><h1 className="text-2xl font-bold">Ekip</h1><p className="text-muted-foreground mt-2">Yakında...</p></div> },
          { path: ROUTES.ANALYTICS, element: <div className="p-6"><h1 className="text-2xl font-bold">Analiz</h1><p className="text-muted-foreground mt-2">Yakında...</p></div> },
          { path: ROUTES.SETTINGS, element: <div className="p-6"><h1 className="text-2xl font-bold">Ayarlar</h1><p className="text-muted-foreground mt-2">Yakında...</p></div> },
        ],
      },
    ],
  },
  // 404
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
