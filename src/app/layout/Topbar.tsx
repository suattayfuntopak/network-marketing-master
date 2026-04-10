import { Sun, Moon, LogOut, User, Settings, Bell, HelpCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import i18n from '@/i18n'

export function Topbar() {
  const { profile } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const reset = useAuthStore(s => s.reset)
  const { t } = useTranslation()

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '??'

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) console.log('signOut error:', error.message)
    } catch (err) {
      console.log('signOut exception:', err)
    } finally {
      reset()
      navigate(ROUTES.HOME, { replace: true })
    }
  }

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'tr'

  const switchLang = (lang: 'tr' | 'en') => {
    i18n.changeLanguage(lang)
  }

  const today = new Date().toLocaleDateString(
    currentLang === 'tr' ? 'tr-TR' : 'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  )

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 bg-background/70 px-6 backdrop-blur-xl">
      <div className="text-sm text-muted-foreground">{today}</div>

      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div className="flex items-center gap-0.5 rounded-full border border-border/70 bg-card/70 p-0.5 shadow-[0_10px_30px_rgba(3,7,18,0.16)] backdrop-blur-xl">
          <button
            onClick={() => switchLang('tr')}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              currentLang === 'tr'
                ? 'bg-primary text-primary-foreground shadow-[0_0_16px_rgba(45,212,191,0.24)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Türkçe"
          >
            🇹🇷 TR
          </button>
          <button
            onClick={() => switchLang('en')}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              currentLang === 'en'
                ? 'bg-primary text-primary-foreground shadow-[0_0_16px_rgba(45,212,191,0.24)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="English"
          >
            🇺🇸 EN
          </button>
        </div>

        {/* Theme toggle — 2-state only */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={t(theme === 'dark' ? 'theme.light' : 'theme.dark')}
          className="rounded-full border border-transparent hover:border-border/70 hover:bg-card/70"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1.5 outline-none transition-colors hover:border-border/70 hover:bg-card/70">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs shadow-[0_0_18px_rgba(45,212,191,0.25)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:block">
              {profile?.full_name ?? t('profile.user')}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            {/* User info header */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal py-2">
                <p className="text-sm font-semibold leading-tight">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile?.email}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Navigation items — disabled until pages are built */}
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <User className="w-4 h-4 mr-2" />
                {t('profile.myProfile')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="w-4 h-4 mr-2" />
                {t('profile.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Bell className="w-4 h-4 mr-2" />
                {t('profile.notifications')}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Appearance */}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark'
                  ? <><Sun className="w-4 h-4 mr-2" />{t('theme.light')}</>
                  : <><Moon className="w-4 h-4 mr-2" />{t('theme.dark')}</>}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Help — disabled until pages are built */}
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <HelpCircle className="w-4 h-4 mr-2" />
                {t('profile.help')}
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('profile.feedback')}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Logout */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
