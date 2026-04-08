import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Globe, Shield, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import i18n from '@/i18n'

export function SettingsPage() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const setProfile = useAuthStore((s) => s.setProfile)

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !user?.id || saving) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('nmm_profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      if (data) setProfile(data)
      toast.success(t('settings.saved'))
    } catch (err) {
      console.error('[SettingsPage] profile update error:', err)
      toast.error(t('common.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleLanguageChange = (lang: 'tr' | 'en') => {
    i18n.changeLanguage(lang)
    if (user?.id) {
      supabase.from('nmm_profiles').update({ language: lang }).eq('id', user.id)
    }
  }

  const handleLogout = async () => {
    await signOut()
  }

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'
  const roleKey = `settings.roles.${profile?.role ?? 'distributor'}`
  const localizedRole = t(roleKey, { defaultValue: t('settings.roles.distributor') })

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t('nav.settings')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" />
            {t('settings.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('settings.email')}</Label>
            <Input id="email" value={user?.email ?? ''} disabled className="text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t('settings.fullName')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('settings.fullNamePlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('settings.role')}</Label>
            <p className="text-sm text-muted-foreground">{localizedRole}</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving || !fullName.trim()}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <button
              onClick={() => handleLanguageChange('tr')}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                currentLang === 'tr'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              🇹🇷 Türkçe
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                currentLang === 'en'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t('settings.account')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('settings.accountInfo')}</p>
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive border-destructive/30"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {t('nav.logout')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
