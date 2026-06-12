export const SEVIYE_RENK: Record<string, string> = {
  'Temel': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/20',
  'Orta': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/20',
  'İleri': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/20',
  'Basic': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/20',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/20',
  'Advanced': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/20',
}

export const PAGE_SIZE = 10

export function getTrainingCategoryStyles(kategoriId: string) {
  const isIletisim = kategoriId === 'iletisim' || kategoriId === 'iletisim-&-yaklasim'
  const isDavet = kategoriId === 'davet' || kategoriId === 'davet-pratigi'
  const isSunum = kategoriId === 'sunum' || kategoriId === 'sunum-&-kapanis'
  const isEkip = kategoriId === 'ekip' || kategoriId === 'ekip-&-liderlik'
  const isStrateji = kategoriId === 'strateji' || kategoriId === 'strateji-&-plan'
  const isUyum = kategoriId === 'uyum' || kategoriId === 'yasal-uyum'
  const isZihniyet = kategoriId === 'zihniyet'

  const catTextColor =
    isZihniyet ? 'text-zihniyet-text' :
    isIletisim ? 'text-iletisim-text' :
    isDavet ? 'text-davet-text' :
    isSunum ? 'text-sunum-text' :
    isEkip ? 'text-ekip-text' :
    isStrateji ? 'text-strateji-text' :
    isUyum ? 'text-uyum-text' :
    'text-fallback-text'

  const catBorderColorHover =
    isZihniyet ? 'hover:border-zihniyet-border-hover' :
    isIletisim ? 'hover:border-iletisim-border-hover' :
    isDavet ? 'hover:border-davet-border-hover' :
    isSunum ? 'hover:border-sunum-border-hover' :
    isEkip ? 'hover:border-ekip-border-hover' :
    isStrateji ? 'hover:border-strateji-border-hover' :
    isUyum ? 'hover:border-uyum-border-hover' :
    'hover:border-fallback-border-hover'

  const catBorderColorActive =
    isZihniyet ? 'border-zihniyet-border-active shadow-zihniyet-text/5' :
    isIletisim ? 'border-iletisim-border-active shadow-iletisim-text/5' :
    isDavet ? 'border-davet-border-active shadow-davet-text/5' :
    isSunum ? 'border-sunum-border-active shadow-sunum-text/5' :
    isEkip ? 'border-ekip-border-active shadow-ekip-text/5' :
    isStrateji ? 'border-strateji-border-active shadow-strateji-text/5' :
    isUyum ? 'border-uyum-border-active shadow-uyum-text/5' :
    'border-fallback-border-active shadow-fallback-text/5'

  const bulletStyle =
    isZihniyet ? 'bg-zihniyet-bullet-bg text-zihniyet-bullet-text' :
    isIletisim ? 'bg-iletisim-bullet-bg text-iletisim-bullet-text' :
    isDavet ? 'bg-davet-bullet-bg text-davet-bullet-text' :
    isSunum ? 'bg-sunum-bullet-bg text-sunum-bullet-text' :
    isEkip ? 'bg-ekip-bullet-bg text-ekip-bullet-text' :
    isStrateji ? 'bg-strateji-bullet-bg text-strateji-bullet-text' :
    isUyum ? 'bg-uyum-bullet-bg text-uyum-bullet-text' :
    'bg-fallback-bullet-bg text-fallback-bullet-text'

  return { catTextColor, catBorderColorHover, catBorderColorActive, bulletStyle }
}
