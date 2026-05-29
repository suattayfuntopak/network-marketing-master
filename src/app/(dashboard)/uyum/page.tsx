'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
  Shield, CheckCircle2, AlertTriangle, XCircle, Copy, Info,
  Sparkles, Check, RefreshCw, ChevronRight, HelpCircle, ArrowRight
} from 'lucide-react'
import { useTranslation } from '@/providers/LanguageProvider'
import { auditComplianceMessageAction, type ComplianceAuditState } from './actions'
import { toast } from 'sonner'
import { useAIUsage } from '@/hooks/useAIUsage'
import { useQueryClient } from '@tanstack/react-query'
import { useWorkspace } from '@/hooks/useWorkspace'
import { invalidateTeamAndAIUsage } from '@/lib/query/invalidateTeamAndAI'
import { useAILimits } from '@/hooks/useAILimits'
import { formatCreditButtonLabel } from '@/lib/domain/aiUsage'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'

const APPROVED_CLAIMS = {
  tr: [
    { id: 'c1', text: '"Bu ürünü kendim kullanıyorum ve memnunum." — Kişisel deneyim ifadesi, doğrulanabilir.' },
    { id: 'c2', text: '"Şirketin resmi sunum materyalinde belirtildiğine göre..." — Onaylı kaynak atıfı.' },
    { id: 'c3', text: '"Ürün içeriği/formülü şunları içerir: ..." — Etiket veya ürün açıklamasından direkt alıntı.' },
    { id: 'c4', text: '"İş fırsatı hakkında daha fazla bilgi almak istersen konuşabiliriz." — Davet değil, bilgi teklifi.' },
    { id: 'c5', text: '"Şirketin Gelir Beyan Formu\'nda yayınlanan ortalama kazanç..." — Resmi veriyle desteklenen kazanç ifadesi.' },
    { id: 'c6', text: '"Ürün gıda takviyesidir; hastalık tedavisi için kullanılmaz." — Yasal zorunlu uyarı, paylaşımda mutlaka yer almalı.' },
  ],
  en: [
    { id: 'c1', text: '"I use this product myself and I\'m satisfied." — Personal experience, verifiable.' },
    { id: 'c2', text: '"According to the company\'s official presentation materials..." — Approved source citation.' },
    { id: 'c3', text: '"The product contains the following ingredients: ..." — Direct quote from label or product sheet.' },
    { id: 'c4', text: '"If you\'d like more information about the opportunity, we can talk." — Information offer, not a pitch.' },
    { id: 'c5', text: '"Based on the average earnings published in the company\'s Income Disclosure Statement..." — Data-backed income statement.' },
    { id: 'c6', text: '"This product is a dietary supplement and is not intended to treat any disease." — Legally required disclaimer.' },
  ],
}

const AVOID_CLAIMS = {
  tr: [
    {
      id: 'a1',
      category: 'Gelir İddiaları',
      items: [
        '"Ayda X TL garantili kazanırsın." — Kesin rakam vaat etmek yasaktır.',
        '"Yarı zamanlı çalışarak tam maaş." — Yanıltıcı gelir karşılaştırması.',
        '"Pasif gelir" veya "uyurken para kazan." — Desteklenmeden kullanılamaz.',
        '"Bu işle zengin oldum." — Kişisel deneyimi genel sonuç olarak sunmak yasaktır.'
      ],
    },
    {
      id: 'a2',
      category: 'Sağlık İddiaları',
      items: [
        '"Bu ürün hastalığı iyileştirir/tedavi eder/önler." — Hastalık iddiası kesinlikle yasaktır.',
        '"İlacımı bıraktım, bu ürünü kullanıyorum." — Tıbbi tedavinin yerine geçtiği izlenimi yaratmak yasaktır.',
        '"Doktorum bu ürünü önerdi." — Doğrulanmamış tıbbi onay iddiası.'
      ],
    },
    {
      id: 'a3',
      category: 'Yanıltıcı Görseller',
      items: [
        'Onaylanmamış banka dekontları veya çek fotoğrafları.',
        'Şirket logosu veya markasının izinsiz düzenlenmesi.',
        'Gerçek dışı "öncesi/sonrası" görselleri.'
      ],
    },
  ],
  en: [
    {
      id: 'a1',
      category: 'Income Claims',
      items: [
        '"You will earn X per month guaranteed." — Promising specific figures is prohibited.',
        '"Full-time income on part-time hours." — Misleading income comparison.',
        '"Passive income" or "earn while you sleep." — Cannot be used without substantiation.'
      ],
    },
    {
      id: 'a2',
      category: 'Health Claims',
      items: [
        '"This product cures/treats/prevents disease." — Disease claims are strictly prohibited.',
        '"I stopped my medication and use this product." — Implying a substitute for medical treatment is prohibited.'
      ],
    },
    {
      id: 'a3',
      category: 'Misleading Visuals',
      items: [
        'Unapproved bank statements or check photos.',
        'Unauthorized editing of company logo.',
        'False before/after imagery.'
      ],
    },
  ],
}

const SHARE_CHECKLIST = {
  tr: [
    { id: 'sc1', label: 'İçerik şirket tarafından onaylı materyalden alındı.' },
    { id: 'sc2', label: 'Gelir iddiası varsa, resmi Gelir Beyan Formu referans gösterildi.' },
    { id: 'sc3', label: 'Sağlık iddiası yoktur veya "gıda takviyesi/kozmetik" uyarısı var.' },
    { id: 'sc4', label: 'Kişisel deneyim, genel ve herkes için geçerli sonuç gibi sunulmadı.' },
    { id: 'sc5', label: 'Kesin rakam (garantili kilo kaybı, garantili maaş vb.) kullanılmadı.' },
    { id: 'sc6', label: 'Şirket logosu ve marka standartlarına uygun şekilde paylaşıldı.' },
    { id: 'sc7', label: 'Reklam içerikse #reklam veya #sponsorlu etiketi eklendi.' },
  ],
  en: [
    { id: 'sc1', label: 'Content sourced from company-approved materials.' },
    { id: 'sc2', label: 'If an income claim is present, linked to the Income Disclosure Statement.' },
    { id: 'sc3', label: 'No health claims made, or dietary supplement disclaimer included.' },
    { id: 'sc4', label: 'Personal experience not presented as a typical result.' },
    { id: 'sc5', label: 'No specific guarantees (guaranteed earnings, weight loss) used.' },
    { id: 'sc6', label: 'Company logo/brand used according to brand standards.' },
    { id: 'sc7', label: 'If advertising, #ad or #sponsored tag included.' },
  ],
}

const CHECKLIST_KEY = 'nmm_compliance_checklist_v1'

export default function CompliancePage() {
  const { lang, t } = useTranslation()
  const currentLang = lang === 'en' ? 'en' : 'tr'

  const [inputText, setInputText] = useState('')
  const [isAuditing, setIsAuditing] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedImproved, setCopiedImproved] = useState(false)
  const [activeTab, setActiveTab] = useState<'auditor' | 'library'>('auditor')

  const { data: usage } = useAIUsage()
  const { data: ws } = useWorkspace()
  const qc = useQueryClient()

  const [auditResult, setAuditResult] = useState<ComplianceAuditState | null>(null)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CHECKLIST_KEY)
      if (stored) setCheckedItems(JSON.parse(stored))
    } catch {}
  }, [])

  function toggleCheck(id: string) {
    setCheckedItems(prev => {
      const next = { ...prev, [id]: !prev[id] }
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  function resetChecklist() {
    setCheckedItems({})
    try {
      localStorage.removeItem(CHECKLIST_KEY)
    } catch {}
  }

  async function handleCopyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success(t('compliancePage.copiedToClipboard'))
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  async function handleCopyImproved(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedImproved(true)
      toast.success(t('compliancePage.copiedImprovedText'))
      setTimeout(() => setCopiedImproved(false), 2000)
    } catch {}
  }

  async function handleAuditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!inputText.trim() || isAuditing) return

    setIsAuditing(true)
    setAuditResult(null)
    try {
      const res = await auditComplianceMessageAction(inputText, currentLang)
      if (res.error) {
        toast.error(res.error)
      } else {
        setAuditResult(res)
        invalidateTeamAndAIUsage(qc, ws?.workspaceId)
        toast.success(t('compliancePage.auditCompleted'))
      }
    } catch {
      toast.error(t('compliancePage.unexpectedError'))
    } finally {
      setIsAuditing(false)
    }
  }

  const checklist = SHARE_CHECKLIST[currentLang]
  const checkedCount = checklist.filter(item => checkedItems[item.id]).length
  const isAllChecked = checkedCount === checklist.length

  const {
    limits: { complianceLimit },
    complianceRemaining,
    isSuperAdmin: limitsSuperAdmin,
  } = useAILimits()

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[var(--bg)] px-4 pb-28 pt-6 md:pb-8 animate-in fade-in duration-300">
      <div className="w-full space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF0EC] dark:bg-[#3d1409]">
            <Shield className="h-5 w-5 text-[#C03E1F]" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">
              {t('compliancePage.complianceCenter')}
            </h1>
            <p className="text-sm text-[var(--text-3)]">
              {t('compliancePage.complianceSubtitle')}
            </p>
          </div>
        </header>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-[var(--bg-subtle)] p-1 border border-[var(--border)] max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('auditor')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'auditor'
                ? 'bg-[var(--bg-card)] text-[#C03E1F] shadow-sm border border-[var(--border)]'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            {t('compliancePage.aiComplianceAuditor')}
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-[var(--bg-card)] text-[#C03E1F] shadow-sm border border-[var(--border)]'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            {t('compliancePage.guidelinesLibrary')}
          </button>
        </div>

        {/* Page Content */}
        <div className="space-y-6">
          {activeTab === 'auditor' && (
            <>
              {/* YZ Uyum Denetleyicisi Formu */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#C03E1F]" />
                    {t('compliancePage.auditYourMessage')}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                    {t('compliancePage.auditYourMessageDesc')}
                  </p>
                </div>

                <form onSubmit={handleAuditSubmit} className="space-y-3">
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    required
                    placeholder={t('compliancePage.auditPlaceholder')}
                    className="w-full h-32 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#C03E1F] transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={
                        isAuditing ||
                        !inputText.trim() ||
                        (!limitsSuperAdmin && complianceLimit === 0) ||
                        (!limitsSuperAdmin && complianceRemaining <= 0)
                      }
                      className="flex max-w-full items-center justify-center gap-2 rounded-xl bg-[#C03E1F] hover:bg-[#a03117] text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer whitespace-nowrap"
                    >
                      {isAuditing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          {t('compliancePage.auditing')}
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4" />
                          {formatCreditButtonLabel(
                            t('compliancePage.startAiAudit'),
                            complianceRemaining,
                            complianceLimit,
                            limitsSuperAdmin,
                            lang
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </section>

              {/* AI Audit Results */}
              {auditResult && (
                <section className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4">
                    {/* Gauge / Score Card */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 flex flex-col items-center justify-center text-center space-y-3">
                      <span className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">
                        {t('compliancePage.complianceScore')}
                      </span>
                      
                      {/* Custom Circular SVG Gauge */}
                      <div className="relative h-28 w-28 flex items-center justify-center">
                        <svg className="absolute transform -rotate-90" width="112" height="112">
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke="var(--border)"
                            strokeWidth="8"
                            fill="transparent"
                          />
                          <circle
                            cx="56"
                            cy="56"
                            r="48"
                            stroke={
                              auditResult.safety_level === 'safe'
                                ? '#10b981'
                                : auditResult.safety_level === 'warning'
                                  ? '#f59e0b'
                                  : '#ef4444'
                            }
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray="301.6"
                            strokeDashoffset={301.6 - (301.6 * (auditResult.score ?? 0)) / 100}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="text-center">
                          <span className="text-3xl font-black text-[var(--text-1)]">{auditResult.score}</span>
                          <span className="text-xs text-[var(--text-3)] font-bold block">/100</span>
                        </div>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        auditResult.safety_level === 'safe'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : auditResult.safety_level === 'warning'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      }`}>
                        {auditResult.safety_level === 'safe' && t('compliancePage.safeToShare')}
                        {auditResult.safety_level === 'warning' && t('compliancePage.needsWarnings')}
                        {auditResult.safety_level === 'danger' && t('compliancePage.highRisk')}
                      </span>
                    </div>

                    {/* Violations List */}
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-3 justify-center flex flex-col">
                      <h3 className="text-xs font-bold text-[var(--text-3)] uppercase tracking-wider">
                        {t('compliancePage.detectedRisks')}
                      </h3>
                      {(!auditResult.violations || auditResult.violations.length === 0) ? (
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 py-3">
                          <CheckCircle2 className="h-5 w-5 shrink-0" />
                          <span className="text-sm font-semibold">
                            {t('compliancePage.noRisksDetected')}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
                          {auditResult.violations.map((v, i) => (
                            <div key={i} className="rounded-xl border border-red-100 dark:border-red-950/20 bg-red-50/20 dark:bg-red-950/5 p-3 flex gap-2.5 items-start">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                              <div className="text-xs space-y-0.5">
                                <p className="font-bold text-[var(--text-1)]">
                                  "{v.phrase}" <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold px-1.5 py-0.5 rounded-full uppercase ml-1.5">{v.category}</span>
                                </p>
                                <p className="text-[var(--text-2)] leading-relaxed">{v.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Improved Text Panel */}
                  {auditResult.improved_text && (
                    <div className="rounded-2xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/5 p-5 space-y-3 relative overflow-hidden">
                      <div className="absolute right-4 top-4 flex items-center gap-2">
                        <button
                          onClick={() => handleCopyImproved(auditResult.improved_text!)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 transition active:scale-95 cursor-pointer"
                          title={t('compliancePage.copyText')}
                        >
                          {copiedImproved ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(auditResult.improved_text!)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366] text-white transition active:scale-95 hover:scale-105 hover:shadow-md cursor-pointer"
                          title={t('compliancePage.shareViaWhatsApp')}
                        >
                          <WhatsAppIcon className="h-4.5 w-4.5" />
                        </a>
                      </div>
                      <div className="pr-20">
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="h-4 w-4" />
                          {t('compliancePage.recommendedVersion')}
                        </h4>
                        <p className="text-sm leading-relaxed text-[var(--text-1)] italic whitespace-pre-wrap font-medium">
                          {auditResult.improved_text}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Paylaşım Öncesi Kontrol Listesi */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-[#C03E1F]" />
                      {t('compliancePage.preShareChecklist')}
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                      {t('compliancePage.preShareChecklistDesc')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-[var(--text-3)] shrink-0">
                    <span>{checkedCount}/{checklist.length}</span>
                    {checkedCount > 0 && (
                      <button
                        onClick={resetChecklist}
                        className="font-bold hover:text-[var(--text-1)] transition cursor-pointer"
                      >
                        {t('compliancePage.reset')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {checklist.map(ci => (
                    <button
                      key={ci.id}
                      onClick={() => toggleCheck(ci.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all active:scale-[0.99] cursor-pointer ${
                        checkedItems[ci.id]
                          ? 'border-emerald-200/50 bg-emerald-50/5 text-[var(--text-1)] font-semibold'
                          : 'border-[var(--border)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] text-[var(--text-2)] hover:border-[var(--text-3)]'
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        checkedItems[ci.id] ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--text-3)] bg-transparent'
                      }`}>
                        {checkedItems[ci.id] && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      <span className="text-xs sm:text-sm leading-tight">{ci.label}</span>
                    </button>
                  ))}

                  {isAllChecked && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500 text-white px-4 py-3 shadow-md mt-3 animate-in fade-in zoom-in-95 duration-200">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold">
                        {t('compliancePage.allChecksPassed')}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'library' && (
            <>
              {/* Onaylı İfadeler Paneli */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {t('compliancePage.approvedTemplates')}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                    {t('compliancePage.approvedTemplatesDesc')}
                  </p>
                </div>

                <div className="space-y-2">
                  {APPROVED_CLAIMS[currentLang].map(claim => (
                    <div key={claim.id} className="flex items-start justify-between gap-4 rounded-xl border border-emerald-100/30 bg-emerald-50/5 dark:bg-emerald-950/5 px-4 py-3">
                      <div className="text-xs sm:text-sm leading-relaxed text-[var(--text-1)]">
                        {claim.text}
                      </div>
                      <button
                        onClick={() => handleCopyText(claim.id, claim.text.split(' — ')[0].replace(/^"|"$/g, ''))}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-emerald-100 hover:text-emerald-800 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 transition active:scale-95 cursor-pointer"
                        title={t('compliancePage.copyTemplate')}
                      >
                        {copiedId === claim.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Kaçınılacak İfadeler Örnekleri */}
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-500" />
                    {t('compliancePage.prohibitedClaims')}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-3)] leading-relaxed">
                    {t('compliancePage.prohibitedClaimsDesc')}
                  </p>
                </div>

                <div className="space-y-4">
                  {AVOID_CLAIMS[currentLang].map(category => (
                    <div key={category.id} className="space-y-2">
                      <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {category.category}
                      </h3>
                      <div className="space-y-2">
                        {category.items.map((item, idx) => (
                          <div key={idx} className="rounded-xl border border-red-100/20 bg-red-50/5 dark:bg-red-950/5 p-3 flex items-start gap-2.5">
                            <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                            <p className="text-xs sm:text-sm text-[var(--text-2)] leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Uyum Denetimi kutusu — Pano'dan taşındı. Free: ödeme upsell, ücretli/super: bilgi */}
          {(() => {
            const content = (
              <>
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    complianceLimit === 0
                      ? 'bg-[#C03E1F]/10 text-[#C03E1F]'
                      : 'bg-[#1A56DB]/10 text-[#1A56DB] dark:text-[#93c5fd]'
                  )}>
                    <Shield className="h-4.5 w-4.5" strokeWidth={2} />
                  </div>
                  <div>
                    <p className={clsx(
                      'text-xs font-bold',
                      complianceLimit === 0 ? 'text-[#C03E1F]' : 'text-[#1A56DB] dark:text-[#93c5fd]'
                    )}>
                      {complianceLimit === 0
                        ? t('compliancePage.unlockComplianceAudit')
                        : t('compliancePage.complianceAudit')}
                    </p>
                    <p className={clsx(
                      'text-[11px] mt-0.5',
                      complianceLimit === 0 ? 'text-[#C03E1F]/70' : 'text-[#1A56DB]/70 dark:text-[#93c5fd]/70'
                    )}>
                      {complianceLimit === 0
                        ? t('compliancePage.complianceAuditUpsell')
                        : complianceLimit === Infinity
                          ? t('compliancePage.complianceAuditUnlimited')
                          : t('compliancePage.creditsInfo', { count: complianceLimit })}
                    </p>
                  </div>
                </div>
                {complianceLimit === 0 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#C03E1F]/60" />
                )}
              </>
            )
            const boxClass = clsx(
              'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5',
              complianceLimit === 0
                ? 'border-[#C03E1F]/30 bg-[#FEF0EC] dark:bg-[#47221A]/40 dark:border-[#C03E1F]/20 transition-all hover:opacity-90 active:scale-[0.99]'
                : 'border-[#E8F0FE] bg-[#E8F0FE] dark:bg-[#222E4D]/60 dark:border-[#1e3a5f]'
            )
            return complianceLimit === 0 ? (
              <Link href="/odeme" className={boxClass}>{content}</Link>
            ) : (
              <div className={boxClass}>{content}</div>
            )
          })()}

          {/* Yasal Sorumluluk Reddi (Disclaimer) */}
          <section className="flex gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
            <Info className="h-4 w-4 shrink-0 text-[var(--text-3)] mt-0.5" />
            <p className="text-[11px] leading-relaxed text-[var(--text-3)] font-semibold">
              {t('compliancePage.disclaimer')}
            </p>
          </section>

        </div>
      </div>
    </main>
  )
}
