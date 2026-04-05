import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import i18n from '@/i18n'

export function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'

  const validate = (data: {
    full_name: string
    email: string
    password: string
    password_confirm: string
  }) => {
    const errors: Record<string, string> = {}
    if (data.full_name.length < 2) errors.full_name = 'Ad soyad en az 2 karakter olmalı'
    if (!data.email.includes('@')) errors.email = 'Geçerli bir email adresi girin'
    if (data.password.length < 8) errors.password = 'Şifre en az 8 karakter olmalı'
    else if (!/[A-Z]/.test(data.password)) errors.password = 'Şifre en az 1 büyük harf içermeli'
    else if (!/[0-9]/.test(data.password)) errors.password = 'Şifre en az 1 rakam içermeli'
    if (data.password !== data.password_confirm) errors.password_confirm = 'Şifreler eşleşmiyor'
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setError(null)
    const formData = new FormData(e.target as HTMLFormElement)
    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string
    const password_confirm = formData.get('password_confirm') as string

    const errors = validate({ full_name, email, password, password_confirm })
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, phone: phone || null },
          emailRedirectTo: `${window.location.origin}${ROUTES.EMAIL_CONFIRM}`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('auth.emailAlreadyRegistered'))
        } else {
          setError(t('auth.registerError'))
        }
        setLoading(false)
        return
      }

      if (authData.session) {
        toast.success(t('auth.loginSuccess'))
        navigate(ROUTES.DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.EMAIL_CONFIRM, { replace: true })
      }
    } catch (err: unknown) {
      console.error('[RegisterPage] Error:', err)
      setError(t('auth.registerError'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
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
        {/* Logo */}
        <div className="text-center">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">NMM</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{t('auth.createAccount')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">{t('auth.fullName')}</Label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              placeholder={t('auth.namePlaceholder')}
              autoComplete="name"
            />
            {fieldErrors.full_name && (
              <p className="text-xs text-destructive">{fieldErrors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {t('auth.phone')} <span className="text-muted-foreground text-xs">({t('common.optional')})</span>
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder={t('auth.phonePlaceholder')}
              autoComplete="tel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-destructive">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirm">{t('auth.passwordConfirm')}</Label>
            <Input
              id="password_confirm"
              name="password_confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordConfirmPlaceholder')}
              autoComplete="new-password"
            />
            {fieldErrors.password_confirm && (
              <p className="text-xs text-destructive">{fieldErrors.password_confirm}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.creatingAccount') : t('auth.register')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
            {t('auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
