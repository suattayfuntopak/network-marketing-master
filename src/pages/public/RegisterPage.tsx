import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
  email: z.string().email('Geçerli bir email adresi girin'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalı')
    .regex(/[A-Z]/, 'Şifre en az 1 büyük harf içermeli')
    .regex(/[0-9]/, 'Şifre en az 1 rakam içermeli'),
  password_confirm: z.string(),
}).refine(data => data.password === data.password_confirm, {
  message: 'Şifreler eşleşmiyor',
  path: ['password_confirm'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    setLoading(true)

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone: data.phone,
          },
          emailRedirectTo: `${window.location.origin}${ROUTES.EMAIL_CONFIRM}`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Bu email adresi zaten kayıtlı. Giriş yapmayı deneyin.')
        } else {
          setError('Kayıt oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.')
        }
        return
      }

      // session null → email onayı aktif → onay sayfasına yönlendir
      // session mevcut → email onayı kapalı → direkt panoya gir
      if (authData.session) {
        navigate(ROUTES.DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.EMAIL_CONFIRM, { replace: true })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">NMM</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Hesap Oluştur</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ücretsiz başla, hemen kullanmaya başla
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Ahmet Yılmaz"
              autoComplete="name"
              {...register('full_name')}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="phone">
              Telefon <span className="text-muted-foreground text-xs">(opsiyonel)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+90 555 123 4567"
              autoComplete="tel"
              {...register('phone')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="En az 8 karakter"
                autoComplete="new-password"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password_confirm">Şifre Tekrar</Label>
            <Input
              id="password_confirm"
              type={showPassword ? 'text' : 'password'}
              placeholder="Şifreyi tekrar girin"
              autoComplete="new-password"
              {...register('password_confirm')}
            />
            {errors.password_confirm && (
              <p className="text-xs text-destructive">{errors.password_confirm.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Zaten hesabın var mı?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary hover:underline font-medium">
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
