/**
 * Crown Team — Network Marketing Eğitim Serisi (Dr. Tuna AKGÜN).
 * DB kataloğu (`nmm_training_videos`) ile aynı `key` ve sıralamada tutulur;
 * bu liste lider nabız özeti (pulse) için kanonik anahtar kaynağıdır.
 */

export type TrainingVideoDef = {
  key: string
  youtubeId: string
  titleTr: string
  titleEn: string
  descriptionTr: string
  descriptionEn: string
  durationMin: number
  /** Optional link to text training topic id (e.g. z1). */
  relatedTrainingId?: string
  categoryTr: string
  categoryEn: string
}

export const TRAINING_VIDEOS: TrainingVideoDef[] = [
  {
    key: 'vid-liste',
    youtubeId: 'NyYdhTCFKTo',
    titleTr: '4 · Liste Çalışması',
    titleEn: '4 · List Building',
    descriptionTr: 'Başarıya giden yolun ilk adımı: doğru ve kapsamlı liste oluşturma. Bilimsel veriler ve pratik tekniklerle. Mutlaka ilk 3 videoyu izleyin.',
    descriptionEn: 'The first step to success: building a correct, comprehensive prospect list — with scientific data and practical techniques. Watch the first 3 videos first.',
    durationMin: 20,
    categoryTr: 'Liste',
    categoryEn: 'List Building',
  },
  {
    key: 'vid-davet',
    youtubeId: 'ydAPkpY9330',
    titleTr: '5 · Davet Sanatı',
    titleEn: '5 · The Art of Inviting',
    descriptionTr: "Network Marketing'te davet nasıl yapılır? Davet nedir, siz hangi kategoridesiniz? Eric Worre, psikoloji bilimi ve güncel örneklerle profesyonel davet.",
    descriptionEn: 'How to invite in network marketing. What is an invitation, which category are you in? Professional inviting with Eric Worre, psychology and current examples.',
    durationMin: 25,
    categoryTr: 'Davet',
    categoryEn: 'Inviting',
  },
  {
    key: 'vid-sunum',
    youtubeId: 'KzO2gLQ1IQU',
    titleTr: '6 · Sunum Nasıl Yapılır?',
    titleEn: '6 · How to Present',
    descriptionTr: "Sunum nasıl yapılır? Ev toplantısı, 1'e 1, 2'ye 1, Zoom ya da otel toplantılarında nelere dikkat etmeliyiz?",
    descriptionEn: 'How to deliver a presentation. What to watch for in home meetings, one-on-ones, two-on-ones, Zoom or hotel meetings.',
    durationMin: 22,
    categoryTr: 'Sunum',
    categoryEn: 'Presentation',
  },
  {
    key: 'vid-takip',
    youtubeId: 'RDV_jfi3oiA',
    titleTr: '7 · Takip Sistemi',
    titleEn: '7 · Follow-up System',
    descriptionTr: 'Baskı olmadan, bunaltmadan takip. Sunum sonrası yapılması (ve yapılmaması) gerekenler; hangi soruları sormalı, nasıl yaklaşmalıyız?',
    descriptionEn: 'Follow-up without pressure. What to do (and not do) after a presentation; which questions to ask and how to approach.',
    durationMin: 18,
    categoryTr: 'Takip',
    categoryEn: 'Follow-up',
  },
  {
    key: 'vid-itiraz',
    youtubeId: 'WzTjwfJhIZk',
    titleTr: '8 · İtiraz Yönetimi',
    titleEn: '8 · Objection Handling',
    descriptionTr: "Gelen itirazları nasıl yöneteceğiz? 20+ itiraz, yanlış ve doğru yanıt, bilimsel teknikler — Network Marketing'te ikna ve güven sistemi.",
    descriptionEn: 'How to manage objections. 20+ objections, wrong vs right answers, scientific techniques — persuasion and trust in network marketing.',
    durationMin: 22,
    categoryTr: 'İtiraz',
    categoryEn: 'Objections',
  },
  {
    key: 'vid-sponsorluk',
    youtubeId: 'O3N-xLFMqIg',
    titleTr: '9 · Sponsorluk ve Kopyalama',
    titleEn: '9 · Sponsoring & Duplication',
    descriptionTr: 'Sponsorluk ve kopyalama: ekibini büyütürken çoğalan, kopyalanabilir bir sistem kurmak.',
    descriptionEn: 'Sponsoring and duplication: building a duplicable system as you grow your team.',
    durationMin: 16,
    categoryTr: 'Sponsorluk',
    categoryEn: 'Sponsoring',
  },
]

export const CANONICAL_VIDEO_COUNT = TRAINING_VIDEOS.length

export function getTrainingVideoByKey(key: string): TrainingVideoDef | undefined {
  return TRAINING_VIDEOS.find(v => v.key === key)
}

export function localizedVideoTitle(v: TrainingVideoDef, lang: 'tr' | 'en'): string {
  return lang === 'en' ? v.titleEn : v.titleTr
}

export function localizedVideoDescription(v: TrainingVideoDef, lang: 'tr' | 'en'): string {
  return lang === 'en' ? v.descriptionEn : v.descriptionTr
}
