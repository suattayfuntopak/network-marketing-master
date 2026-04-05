import { Link } from 'react-router-dom'
import { Zap, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'

export function EmailConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">NMM</span>
        </Link>

        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10">
            <Mail className="w-12 h-12 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Email'ini Kontrol Et</h1>
          <p className="text-muted-foreground">
            Hesabını aktifleştirmek için email adresine bir doğrulama linki gönderdik.
          </p>
          <p className="text-sm text-muted-foreground">
            Email gelmedi mi? Spam klasörünü kontrol et.
          </p>
        </div>

        <Link to={ROUTES.LOGIN}>
          <Button variant="outline" className="w-full">
            Giriş Sayfasına Dön
          </Button>
        </Link>
      </div>
    </div>
  )
}
