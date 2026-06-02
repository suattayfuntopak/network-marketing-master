'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Presentation, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon'
import { useTranslation } from '@/providers/LanguageProvider'
import { useLogPresentationWhatsApp } from '@/hooks/useCandidates'
import { usePresentationMaterials, pickDefaultMaterial } from '@/hooks/usePresentationMaterials'
import { renderPresentationMessage } from '@/lib/domain/presentationMaterials'
import type { NmmCandidate } from '@/types/database.types'

interface Props {
  c: NmmCandidate
  workspaceId: string | undefined
  isSuperAdmin: boolean | undefined
  senderName: string
}

export function PresentationMaterialsCard({ c, workspaceId, isSuperAdmin, senderName }: Props) {
  const { lang, t } = useTranslation()
  const { data: presentationMaterials = [], isLoading: materialsLoading } = usePresentationMaterials(
    workspaceId,
    { isSuperAdmin, lang, includeFallback: true }
  )
  const logPresentationWhatsApp = useLogPresentationWhatsApp(workspaceId ?? '')
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const candidatePhoneClean = c?.phone?.replace(/\D/g, '') ?? ''

  const activeMaterial = useMemo(() => {
    if (presentationMaterials.length === 0) return null
    if (selectedMaterialId) {
      return presentationMaterials.find(m => m.id === selectedMaterialId) ?? pickDefaultMaterial(presentationMaterials)
    }
    return pickDefaultMaterial(presentationMaterials)
  }, [presentationMaterials, selectedMaterialId])

  useEffect(() => {
    const defaultMaterial = pickDefaultMaterial(presentationMaterials)
    if (defaultMaterial && !selectedMaterialId) {
      setSelectedMaterialId(defaultMaterial.id)
    }
  }, [presentationMaterials, selectedMaterialId])

  const getPresentationMessage = useCallback(() => {
    const name = c?.full_name?.trim() || t('pipelinePage.customer')
    if (!activeMaterial) return ''
    return renderPresentationMessage(activeMaterial.whatsapp_template, {
      name,
      url: activeMaterial.url,
      sender: senderName,
    })
  }, [c, activeMaterial, senderName, t])

  const handleSendWhatsApp = useCallback(() => {
    if (!candidatePhoneClean || !activeMaterial || !c) return
    const msg = getPresentationMessage()
    navigator.clipboard.writeText(msg).then(() => toast.success(t('pipeline.presentationCopied'))).catch(() => {})
    window.open(`https://wa.me/${candidatePhoneClean}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
    logPresentationWhatsApp.mutate({
      candidateId: c.id,
      materialTitle: activeMaterial.title,
    })
  }, [candidatePhoneClean, activeMaterial, c, getPresentationMessage, t, logPresentationWhatsApp])

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-[var(--text-3)]">
          <Presentation className="h-3.5 w-3.5 text-[#534AB7]" />
          {t('pipeline.presentationMaterials')}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/pipeline/sunum-materyalleri"
            className="text-xs font-semibold text-[#534AB7] hover:underline whitespace-nowrap dark:text-[#F5F0E8] dark:hover:text-[#FFF8DC]"
          >
            {t('presentationMaterialsPage.manageLink')}
          </Link>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Kapat' : 'Aç'}
            className="flex h-6 w-6 items-center justify-center rounded-lg text-[var(--text-3)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-1)] transition"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-3)]">
            {t('pipeline.presentationMaterialsDesc')}
          </p>

      {materialsLoading ? (
        <div className="mt-4 h-10 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />
      ) : presentationMaterials.length === 0 ? (
        <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm leading-relaxed text-amber-900 dark:text-amber-200">
          <p className="font-semibold">{t('presentationMaterialsPage.addFirst')}</p>
        </div>
      ) : (
        <>
          <label className="mt-4 block space-y-1.5">
            <span className="text-xs font-semibold text-[var(--text-2)]">
              {t('presentationMaterialsPage.selectMaterial')}
            </span>
            <select
              value={activeMaterial?.id ?? ''}
              onChange={e => setSelectedMaterialId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-base text-[var(--text-1)] outline-none focus:border-[#534AB7] focus:ring-2 focus:ring-[#534AB7]/15"
            >
              {presentationMaterials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.title}
                  {material.is_default ? ` ★` : ''}
                </option>
              ))}
            </select>
          </label>

          {activeMaterial && (
            <p className="mt-3 rounded-xl bg-[var(--bg-subtle)] px-3 py-2.5 text-xs leading-relaxed text-[var(--text-2)] whitespace-pre-wrap">
              <span className="font-semibold text-[var(--text-1)]">
                {t('presentationMaterialsPage.previewLabel')}:
              </span>{' '}
              {getPresentationMessage()}
            </p>
          )}
        </>
      )}

      {!candidatePhoneClean && (
        <p className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/30 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          {t('pipeline.presentationWarning')}
        </p>
      )}

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          disabled={!candidatePhoneClean || !activeMaterial}
          onClick={handleSendWhatsApp}
          className="flex w-1/3 items-center justify-center gap-1.5 rounded-2xl bg-[#25D366] py-4 text-sm font-semibold text-white transition hover:opacity-90 animate-all duration-200 active:scale-95 text-center disabled:pointer-events-none disabled:opacity-40 cursor-pointer shadow-md hover:shadow-green-500/20"
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0" />
          WhatsApp
        </button>
      </div>
        </>
      )}
    </div>
  )
}
