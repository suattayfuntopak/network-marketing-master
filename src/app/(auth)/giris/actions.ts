'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ensureWorkspaceAction } from '@/app/(dashboard)/actions/workspace'

export type LoginErrorKey =
  | 'loginErrorRequired'
  | 'loginErrorInvalid'
  | 'loginErrorUnconfirmed'
  | 'loginErrorGeneric'

interface FormState {
  errorKey?: LoginErrorKey
}

const SUPABASE_ERROR_MAP: Record<string, LoginErrorKey> = {
  'Invalid login credentials': 'loginErrorInvalid',
  'Email not confirmed': 'loginErrorUnconfirmed',
  'User not found': 'loginErrorInvalid',
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { errorKey: 'loginErrorRequired' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[loginAction] Supabase error:', error.message, error.status)
    const key = SUPABASE_ERROR_MAP[error.message]
    return { errorKey: key ?? 'loginErrorGeneric' }
  }

  try {
    await ensureWorkspaceAction()
  } catch (workspaceError) {
    console.error('[loginAction] ensureWorkspace after login:', workspaceError)
  }

  redirect('/pano')
}
