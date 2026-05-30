import type { AdminClient } from '@/lib/supabase/admin'

/**
 * E-posta gönderimini "claim" eder: bugün (İstanbul) bu workspace + kind için
 * `nmm_email_sent_log`'a satır eklemeyi dener.
 *
 * - Satır eklendiyse → ilk kez, e-posta GÖNDERİLMELİ (`true`).
 * - Çakışma (zaten gönderilmiş) → atla (`false`).
 * - DB hatası → güvenli taraf: gönderme (`false`). Tek e-postayı kaçırmak,
 *   çift göndermekten iyidir.
 *
 * Claim gönderimden ÖNCE yapılır; böylece cron iki kez tetiklenirse ikinci
 * tetiklemede çakışma olur ve çift e-posta gitmez.
 */
export async function claimEmailSend(
  supabase: AdminClient,
  workspaceId: string,
  kind: string,
  sentDate: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('nmm_email_sent_log')
    .upsert(
      { workspace_id: workspaceId, kind, sent_date: sentDate },
      { onConflict: 'workspace_id,kind,sent_date', ignoreDuplicates: true },
    )
    .select('id')

  if (error) {
    console.error('[emailSentLog] claim failed:', error)
    return false
  }
  return (data?.length ?? 0) > 0
}
