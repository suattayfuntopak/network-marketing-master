'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureWorkspaceAction } from '@/app/(dashboard)/actions/workspace'
import { NMM_LANG_COOKIE, isUiLang, type UiLang } from '@/lib/utils/langCookie'
import { tr } from '@/lib/translations/tr'
import { en } from '@/lib/translations/en'

interface FormState {
  error?: string
}

async function loginLang(): Promise<UiLang> {
  const cookieStore = await cookies()
  const value = cookieStore.get(NMM_LANG_COOKIE)?.value
  return isUiLang(value) ? value : 'tr'
}

function loginMessages(lang: UiLang) {
  return lang === 'en' ? en.auth : tr.auth
}

const SUPABASE_ERROR_MAP: Record<string, keyof typeof tr.auth> = {
  'Invalid login credentials': 'loginErrorInvalid',
  'Email not confirmed': 'loginErrorUnconfirmed',
  'User not found': 'loginErrorInvalid',
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const lang = await loginLang()
  const msg = loginMessages(lang)

  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { error: msg.loginErrorRequired }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[loginAction] Supabase error:', error.message, error.status)
    const key = SUPABASE_ERROR_MAP[error.message]
    return { error: key ? msg[key] : msg.loginErrorGeneric }
  }

  try {
    await ensureWorkspaceAction()
  } catch (workspaceError) {
    console.error('[loginAction] ensureWorkspace after login:', workspaceError)
  }

  redirect('/pano')
}
