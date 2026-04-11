import { supabase } from '@/lib/supabase'
import { serializeStageLabelConfig } from '@/lib/pipeline/stageLabels'

const DEMO_STAGE_BLUEPRINT = [
  { slug: 'new', trLabel: 'Yeni Aday', enLabel: 'New Prospect', color: 'gray', position: 0, winProbability: 10, isWonStage: false, isLostStage: false },
  { slug: 'contacted', trLabel: 'İletişim Kuruldu', enLabel: 'Contacted', color: 'blue', position: 1, winProbability: 25, isWonStage: false, isLostStage: false },
  { slug: 'interested', trLabel: 'İlgileniyor', enLabel: 'Interested', color: 'purple', position: 2, winProbability: 40, isWonStage: false, isLostStage: false },
  { slug: 'presenting', trLabel: 'Sunum Yapıldı', enLabel: 'Presentation Done', color: 'amber', position: 3, winProbability: 60, isWonStage: false, isLostStage: false },
  { slug: 'thinking', trLabel: 'Düşünüyor', enLabel: 'Thinking', color: 'orange', position: 4, winProbability: 75, isWonStage: false, isLostStage: false },
  { slug: 'joined', trLabel: 'Katıldı', enLabel: 'Joined', color: 'emerald', position: 5, winProbability: 100, isWonStage: true, isLostStage: false },
  { slug: 'lost', trLabel: 'Kaybedildi', enLabel: 'Lost', color: 'red', position: 6, winProbability: 0, isWonStage: false, isLostStage: true },
] as const

function addHours(base: Date, hours: number) {
  return new Date(base.getTime() + hours * 60 * 60 * 1000)
}

function addDays(base: Date, days: number, hour = 10) {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  next.setHours(hour, 0, 0, 0)
  return next
}

export async function ensureDemoWorkspace(userId: string) {
  const { count } = await supabase
    .from('nmm_contacts')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', userId)

  if ((count ?? 0) > 0) return

  const { data: existingStages } = await supabase
    .from('nmm_pipeline_stages')
    .select('id, slug')
    .eq('user_id', userId)

  const stageSlugSet = new Set(existingStages?.map((stage) => stage.slug) ?? [])
  const missingStages = DEMO_STAGE_BLUEPRINT.filter((stage) => !stageSlugSet.has(stage.slug))

  if (missingStages.length > 0) {
    const { error: stageError } = await supabase.from('nmm_pipeline_stages').insert(
      missingStages.map((stage) => ({
        user_id: userId,
        name: stage.trLabel,
        slug: stage.slug,
        description: serializeStageLabelConfig({
          trLabel: stage.trLabel,
          enLabel: stage.enLabel,
        }),
        color: stage.color,
        position: stage.position,
        win_probability: stage.winProbability,
        is_system: true,
        is_won_stage: stage.isWonStage,
        is_lost_stage: stage.isLostStage,
      }))
    )

    if (stageError) {
      throw stageError
    }
  }

  const { data: stageRows, error: refreshedStageError } = await supabase
    .from('nmm_pipeline_stages')
    .select('id, slug')
    .eq('user_id', userId)

  if (refreshedStageError) {
    throw refreshedStageError
  }

  const stageIdBySlug = new Map((stageRows ?? []).map((stage) => [stage.slug, stage.id]))
  const now = new Date()
  const roundedNow = new Date()
  roundedNow.setMinutes(0, 0, 0)
  const tomorrow = addDays(now, 1, 11)
  const inTwoDays = addDays(now, 2, 16)
  const laterToday = addHours(roundedNow, 2)

  const contactSeed = [
    {
      full_name: 'Ayşe Demir',
      email: 'ayse.demir@example.com',
      phone: '5551234567',
      stage: 'presenting' as const,
      source: 'social_media' as const,
      contact_type: 'prospect' as const,
      warmth_score: 78,
      notes: 'Sunum yapıldı. Tek bir sonraki adım netleşirse hızlı ilerleyebilir.',
      last_contact_at: addDays(new Date(), -1, 17).toISOString(),
      next_follow_up_at: laterToday.toISOString(),
    },
    {
      full_name: 'Ali Yılmaz',
      email: 'ali.yilmaz@example.com',
      phone: '5559876543',
      stage: 'contacted' as const,
      source: 'referral' as const,
      contact_type: 'prospect' as const,
      warmth_score: 44,
      notes: 'İlk temas iyi geçti. Doğal bir davet mesajı ile sıcaklık artabilir.',
      last_contact_at: addDays(new Date(), -2, 13).toISOString(),
      next_follow_up_at: tomorrow.toISOString(),
    },
    {
      full_name: 'Veli Kaya',
      email: 'veli.kaya@example.com',
      phone: '5551112233',
      stage: 'interested' as const,
      source: 'manual' as const,
      contact_type: 'prospect' as const,
      warmth_score: 69,
      notes: 'İlgili ama karar için kısa bir güven adımı bekliyor.',
      last_contact_at: addDays(new Date(), -1, 11).toISOString(),
      next_follow_up_at: inTwoDays.toISOString(),
    },
  ]

  const { data: insertedContacts, error: contactError } = await supabase
    .from('nmm_contacts')
    .insert(
      contactSeed.map((contact) => ({
        user_id: userId,
        full_name: contact.full_name,
        email: contact.email,
        phone: contact.phone,
        stage: contact.stage,
        source: contact.source,
        contact_type: contact.contact_type,
        warmth_score: contact.warmth_score,
        notes: contact.notes,
        last_contact_at: contact.last_contact_at,
        next_follow_up_at: contact.next_follow_up_at,
      }))
    )
    .select('id, full_name, stage')

  if (contactError) {
    throw contactError
  }

  const contactIdByName = new Map((insertedContacts ?? []).map((contact) => [contact.full_name, contact.id]))

  const dealSeed = [
    {
      contactName: 'Ayşe Demir',
      stageSlug: 'presenting',
      title: 'Ürün deneyimi sonrası karar görüşmesi',
      deal_type: 'product_sale' as const,
      value: 2400,
      probability: 78,
    },
    {
      contactName: 'Ali Yılmaz',
      stageSlug: 'contacted',
      title: 'İlk iş fırsatı daveti',
      deal_type: 'recruitment' as const,
      value: 0,
      probability: 44,
    },
    {
      contactName: 'Veli Kaya',
      stageSlug: 'interested',
      title: 'Sunum sonrası netleştirme',
      deal_type: 'recruitment' as const,
      value: 0,
      probability: 69,
    },
  ]

  const dealRows = dealSeed
    .map((deal, index) => {
      const contact_id = contactIdByName.get(deal.contactName)
      const stage_id = stageIdBySlug.get(deal.stageSlug)

      if (!contact_id || !stage_id) return null

      return {
        user_id: userId,
        contact_id,
        stage_id,
        title: deal.title,
        deal_type: deal.deal_type,
        value: deal.value,
        probability: deal.probability,
        status: 'open' as const,
        position_in_stage: index,
      }
    })
    .filter((deal): deal is NonNullable<typeof deal> => Boolean(deal))

  if (dealRows.length > 0) {
    const { error: dealError } = await supabase.from('nmm_deals').insert(dealRows)
    if (dealError) {
      throw dealError
    }
  }

  const followUpSeed = [
    {
      contactName: 'Ayşe Demir',
      title: 'Sunum sonrası tek sonraki adımı netleştir',
      due_at: laterToday.toISOString(),
      action_type: 'call' as const,
      priority: 'high' as const,
      notes: 'Uzun anlatım yerine tek soru ve tek net aksiyon öner.',
    },
    {
      contactName: 'Ali Yılmaz',
      title: 'İlk davet mesajını gönder',
      due_at: tomorrow.toISOString(),
      action_type: 'message' as const,
      priority: 'medium' as const,
      notes: 'Baskısız, kısa ve merak uyandıran bir giriş tercih et.',
    },
    {
      contactName: 'Veli Kaya',
      title: 'Güven sorusunu sakin bir örnekle aç',
      due_at: inTwoDays.toISOString(),
      action_type: 'check_in' as const,
      priority: 'medium' as const,
      notes: 'Karşılaştırma veya sosyal kanıt ile ilerlemek daha iyi olabilir.',
    },
  ]

  const followUpRows = followUpSeed
    .map((followUp) => {
      const contact_id = contactIdByName.get(followUp.contactName)
      if (!contact_id) return null

      return {
        user_id: userId,
        contact_id,
        title: followUp.title,
        due_at: followUp.due_at,
        action_type: followUp.action_type,
        priority: followUp.priority,
        notes: followUp.notes,
        status: 'pending' as const,
      }
    })
    .filter((followUp): followUp is NonNullable<typeof followUp> => Boolean(followUp))

  if (followUpRows.length > 0) {
    const { error: followUpError } = await supabase.from('nmm_follow_ups').insert(followUpRows)
    if (followUpError) {
      throw followUpError
    }
  }

  const appointmentStart = addDays(new Date(), 1, 20)
  const appointmentContactId = contactIdByName.get('Ayşe Demir')

  if (appointmentContactId) {
    const { error: appointmentError } = await supabase.from('nmm_appointments').insert({
      user_id: userId,
      contact_id: appointmentContactId,
      title: 'Kısa karar görüşmesi',
      description: 'Sunum sonrası kısa netleştirme randevusu.',
      type: 'meeting',
      starts_at: appointmentStart.toISOString(),
      ends_at: addHours(appointmentStart, 1).toISOString(),
      status: 'scheduled',
    })

    if (appointmentError) {
      throw appointmentError
    }
  }
}
