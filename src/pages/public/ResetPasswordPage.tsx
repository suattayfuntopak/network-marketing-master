import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'

const schema = z.object({
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

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const { error } = await supabase.auth.updateUser({ password: data.password })

    if (error) {
      setError('Şifre güncellenirken bir hata oluştu. Lütfen tekrar deneyin.')
      return
    }

    setSuccess(true)
    setTimeout(() => navigate(ROUTES.LOGIN), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">NMM</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Yeni Şifre Belirle</h1>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Şifre Güncellendi</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Yeni Şifre</Label>
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
