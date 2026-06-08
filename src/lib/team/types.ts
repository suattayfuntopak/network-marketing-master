export interface MemberRow {
  user_id: string
  full_name: string | null
  role: 'leader' | 'member'
  joined_at: string | null
  candidate_count: number
  yeni_count: number
  sunum_count: number
  takip_count: number
  katildi_count: number
  last_activity_at: string | null
  onboarding_steps?: string[]
  phone?: string | null
  isAppUser?: boolean
  avatar_url?: string | null
  /** Candidate id for /pipeline/[id] — never use auth user_id for app users */
  pipeline_id?: string | null
  /** Kalıcı link tablosundan mı (isim eşleşmesinden değil) */
  pipeline_link_explicit?: boolean
}

export interface OnboardingStep {
  id: string
  week: 1 | 2 | 3 | 4
  label_tr: string
  label_en: string
}

/** Distributor 4-week "correct start" checklist shown on team member cards. */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: 'step_why', week: 1, label_tr: 'Başlangıç Görüşmesi & "Neden?" Belirleme', label_en: 'Kickoff Meeting & Define "Why"' },
  { id: 'step_list', week: 1, label_tr: '20-50 Kişilik Liste Oluşturma', label_en: 'Create a list of 20-50 Names' },
  { id: 'step_first_5', week: 1, label_tr: 'İlk 5 Adayı Belirleme ve Mesaj Gönderme', label_en: 'Identify first 5 and send messages' },

  { id: 'step_3way', week: 2, label_tr: 'Sponsorla İlk 3\'lü Görüşme (3-Way Call)', label_en: 'First 3-Way Call with Sponsor' },
  { id: 'step_social', week: 2, label_tr: 'Sosyal Medyada İlk Ürün Paylaşımı', label_en: 'First Product Post on Social Media' },

  { id: 'step_independent', week: 3, label_tr: 'Sponsorsuz İlk Bağımsız Sunum', label_en: 'First Independent Presentation' },
  { id: 'step_objections', week: 3, label_tr: 'İtirazlara Cevaplar Modülü Eğitimi', label_en: 'Study Objection Handling Module' },

  { id: 'step_90day', week: 4, label_tr: '90 Günlük Saha Aksiyon Planı Yazımı', label_en: 'Write 90-Day Field Action Plan' },
  { id: 'step_complete', week: 4, label_tr: '30. Gün Kapanış & Değerlendirme', label_en: 'Day 30 Review & Reflection' },
]
