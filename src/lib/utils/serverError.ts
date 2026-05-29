import { errorsSection } from '@/lib/translations/sections/errors'

type Lang = 'tr' | 'en'
type ErrorKey = keyof typeof errorsSection.tr.errors

/** Server action hata metinleri — `lang === 'en' ?` yerine tek kaynak. */
export function serverError(
  key: ErrorKey,
  lang: Lang,
  vars?: Record<string, string>
): string {
  const dict = errorsSection[lang].errors
  let text: string = dict[key]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v)
    }
  }
  return text
}
