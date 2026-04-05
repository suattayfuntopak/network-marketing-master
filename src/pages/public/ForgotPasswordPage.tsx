import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Zap, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import i18n from '@/i18n'

const schema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
      })

      if (error) {
        setError('Email gönderilirken bir hata oluştu. Lütfen tekrar deneyin.')
        return
      }

      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Language switcher */}
      <div className="fixed top-4 right-4 flex items-center gap-0.5 rounded-lg border border-border p-0.5 z-10">
        <button
          onClick={() => i18n.changeLanguage('tr')}
          className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${currentLang === 'tr' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🇹🇷 TR
        </button>
        <button
          onClick={() => i18n.changeLanguage('en')}
          className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${currentLang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          🇺🇸 EN
        </button>
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">NMM</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Şifremi Unuttum</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Email adresini gir, sıfırlama linki gönderelim
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Email Gönderildi</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Şifre sıfırlama linki email adresinize gönderildi.
                Gelen kutunuzu kontrol edin.
              </p>
            </div>
            <Link to={ROUTES.LOGIN}>
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ornek@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
            </Button>

            <Link to={ROUTES.LOGIN}>
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Giriş Sayfasına Dön
              </Button>
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
