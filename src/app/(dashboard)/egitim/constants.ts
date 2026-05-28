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
  const catTextColor =
    kategoriId === 'zihniyet' ? 'text-[#3730A3] dark:text-[#a5b4fc]' :
    kategoriId === 'iletisim' || kategoriId === 'iletisim-&-yaklasim' ? 'text-[#0F6E56] dark:text-[#4ade80]' :
    kategoriId === 'davet' || kategoriId === 'davet-pratigi' ? 'text-[#0369A1] dark:text-[#38bdf8]' :
    kategoriId === 'sunum' || kategoriId === 'sunum-&-kapanis' ? 'text-[#9A3412] dark:text-[#fb923c]' :
    kategoriId === 'ekip' || kategoriId === 'ekip-&-liderlik' ? 'text-[#854F0B] dark:text-[#fbbf24]' :
    kategoriId === 'strateji' || kategoriId === 'strateji-&-plan' ? 'text-[#72243E] dark:text-[#f9a8d4]' :
    kategoriId === 'uyum' || kategoriId === 'yasal-uyum' ? 'text-[#166534] dark:text-[#86efac]' :
    'text-[#6B21A8] dark:text-[#d8b4fe]'

  const catBorderColorHover =
    kategoriId === 'zihniyet' ? 'hover:border-[#3730A3]/30 dark:hover:border-[#a5b4fc]/30' :
    kategoriId === 'iletisim' || kategoriId === 'iletisim-&-yaklasim' ? 'hover:border-[#0F6E56]/30 dark:hover:border-[#4ade80]/30' :
    kategoriId === 'davet' || kategoriId === 'davet-pratigi' ? 'hover:border-[#0369A1]/30 dark:hover:border-[#38bdf8]/30' :
    kategoriId === 'sunum' || kategoriId === 'sunum-&-kapanis' ? 'hover:border-[#9A3412]/30 dark:hover:border-[#fb923c]/30' :
    kategoriId === 'ekip' || kategoriId === 'ekip-&-liderlik' ? 'hover:border-[#854F0B]/30 dark:hover:border-[#fbbf24]/30' :
    kategoriId === 'strateji' || kategoriId === 'strateji-&-plan' ? 'hover:border-[#72243E]/30 dark:hover:border-[#f9a8d4]/30' :
    kategoriId === 'uyum' || kategoriId === 'yasal-uyum' ? 'hover:border-[#166534]/30 dark:hover:border-[#86efac]/30' :
    'hover:border-[#6B21A8]/30 dark:hover:border-[#d8b4fe]/30'

  const catBorderColorActive =
    kategoriId === 'zihniyet' ? 'border-[#3730A3]/25 dark:border-[#a5b4fc]/25 shadow-[#3730A3]/5' :
    kategoriId === 'iletisim' || kategoriId === 'iletisim-&-yaklasim' ? 'border-[#0F6E56]/25 dark:border-[#4ade80]/25 shadow-[#0F6E56]/5' :
    kategoriId === 'davet' || kategoriId === 'davet-pratigi' ? 'border-[#0369A1]/25 dark:border-[#38bdf8]/25 shadow-[#0369A1]/5' :
    kategoriId === 'sunum' || kategoriId === 'sunum-&-kapanis' ? 'border-[#9A3412]/25 dark:border-[#fb923c]/25 shadow-[#9A3412]/5' :
    kategoriId === 'ekip' || kategoriId === 'ekip-&-liderlik' ? 'border-[#854F0B]/25 dark:border-[#fbbf24]/25 shadow-[#854F0B]/5' :
    kategoriId === 'strateji' || kategoriId === 'strateji-&-plan' ? 'border-[#72243E]/25 dark:border-[#f9a8d4]/25 shadow-[#72243E]/5' :
    kategoriId === 'uyum' || kategoriId === 'yasal-uyum' ? 'border-[#166534]/25 dark:border-[#86efac]/25 shadow-[#166534]/5' :
    'border-[#6B21A8]/25 dark:border-[#d8b4fe]/25 shadow-[#6B21A8]/5'

  const bulletStyle =
    kategoriId === 'zihniyet' ? 'bg-[#EEF2FF] dark:bg-[#1e1b4b] text-[#3730A3] dark:text-[#a5b4fc]' :
    kategoriId === 'iletisim' || kategoriId === 'iletisim-&-yaklasim' ? 'bg-[#E1F5EE] dark:bg-[#0d3d2e] text-[#0F6E56] dark:text-[#4ade80]' :
    kategoriId === 'davet' || kategoriId === 'davet-pratigi' ? 'bg-[#F0F9FF] dark:bg-[#0c1a2e] text-[#0369A1] dark:text-[#38bdf8]' :
    kategoriId === 'sunum' || kategoriId === 'sunum-&-kapanis' ? 'bg-[#FFF7ED] dark:bg-[#2a1500] text-[#9A3412] dark:text-[#fb923c]' :
    kategoriId === 'ekip' || kategoriId === 'ekip-&-liderlik' ? 'bg-[#FAEEDA] dark:bg-[#3a2200] text-[#854F0B] dark:text-[#fbbf24]' :
    kategoriId === 'strateji' || kategoriId === 'strateji-&-plan' ? 'bg-[#FBEAF0] dark:bg-[#3d0f1f] text-[#72243E] dark:text-[#f9a8d4]' :
    kategoriId === 'uyum' || kategoriId === 'yasal-uyum' ? 'bg-[#F0FDF4] dark:bg-[#052e16] text-[#166534] dark:text-[#86efac]' :
    'bg-[#FAF5FF] dark:bg-[#1a0030] text-[#6B21A8] dark:text-[#d8b4fe]'

  return { catTextColor, catBorderColorHover, catBorderColorActive, bulletStyle }
}
