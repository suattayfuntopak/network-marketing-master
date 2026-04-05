import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/app/providers/ThemeProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { router } from '@/router'

// AuthProvider doesn't use routing hooks — safe to place outside RouterProvider
// It updates Zustand state which is accessible everywhere
function AppWithAuth() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AppWithAuth />
      </QueryProvider>
    </ThemeProvider>
  )
}
