import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Sparkles,
  FileText,
  History,
  Plus,
  Star,
  Copy,
  Check,
  Trash2,
  Search,
  Send,
  Users,
  Pencil,
  RefreshCw,
  ArrowUpRight,
  Shield,
  Clock3,
  Flame,
  Compass,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  useTemplates,
  useDeleteTemplate,
  useToggleTemplateFavorite,
  useAIMessages,
  useUpdateAIMessage,
  useDeleteAIMessage,
} from '@/hooks/useTemplates'
import { useFollowUpBuckets } from '@/hooks/useCalendar'
import { useContacts } from '@/hooks/useContacts'
import { AIMessageGeneratorModal } from '@/components/messages/AIMessageGeneratorModal'
import { TemplateFormModal } from '@/components/messages/TemplateFormModal'
import { StageBadge } from '@/components/contacts/StageBadge'
import { ROUTES } from '@/lib/constants'
import { DEFAULT_FILTERS } from '@/lib/contacts/types'
import { buildMessagePlaybooks } from '@/lib/messages/messagePlaybooks'
import type { AIMessage, MessageTemplate } from '@/lib/messages/types'
import type { ContactWithTags } from '@/lib/contacts/types'

type Tab = 'ai' | 'templates' | 'history' | 'bulk'

export function MessagesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('ai')
  const [showAIModal, setShowAIModal] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [templateFormStartsWithAI, setTemplateFormStartsWithAI] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingHistoryItem, setEditingHistoryItem] = useState<AIMessage | null>(null)
  const [historyDraft, setHistoryDraft] = useState('')

  const [bulkSearch, setBulkSearch] = useState('')
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkContact, setBulkContact] = useState<ContactWithTags | null>(null)
  const [aiPreset, setAIPreset] = useState<{
    category: AIMessage['category']
    tone: AIMessage['tone']
    channel: 'whatsapp'
    label: string
    reason: string
  } | null>(null)
  const currentLocale = i18n.language?.startsWith('en') ? 'en-US' : 'tr-TR'

  const { data: templates = [], isLoading: templatesLoading } = useTemplates(user?.id ?? '', {
    search: search.length >= 2 ? search : undefined,
  })
  const { data: aiMessages = [], isLoading: historyLoading } = useAIMessages(user?.id ?? '')
  const deleteTemplate = useDeleteTemplate(user?.id ?? '')
  const toggleFavorite = useToggleTemplateFavorite(user?.id ?? '')
  const updateAIMessage = useUpdateAIMessage(user?.id ?? '')
  const deleteAIMessage = useDeleteAIMessage(user?.id ?? '')
  const { data: followUpBuckets } = useFollowUpBuckets(user?.id ?? '')

  const { data: guideContactsResult } = useContacts({
    userId: user?.id ?? '',
    filters: DEFAULT_FILTERS,
    sort: { field: 'warmth_score', order: 'desc' },
    page: 1,
    pageSize: 500,
  })
  const guideContacts = guideContactsResult?.data ?? []

  const { data: contactsResult, isLoading: contactsLoading } = useContacts({
    userId: user?.id ?? '',
    filters: {
      stages: [], warmthMin: 0, warmthMax: 100, sources: [],
      tagIds: [], contactTypes: [], pendingFollowUp: false, archived: false,
      search: bulkSearch.length >= 2 ? bulkSearch : '',
    },
    sort: { field: 'warmth_score', order: 'desc' },
    page: 1,
    pageSize: 100,
  })
  const bulkContacts = contactsResult?.data ?? []

  const historyItems = useMemo(
    () =>
      aiMessages.map((item) => ({
        ...item,
        displayContent: item.final_content?.trim() || item.generated_content,
      })),
    [aiMessages]
  )

  const playbooks = useMemo(
    () => buildMessagePlaybooks({ contacts: guideContacts, followUpBuckets }),
    [followUpBuckets, guideContacts]
  )

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleBulkSelect = (id: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setBulkSelected(new Set(bulkContacts.map((c) => c.id)))
  const clearAll = () => setBulkSelected(new Set())

  const openNewTemplate = (startWithAI = false) => {
    setEditingTemplate(null)
    setTemplateFormStartsWithAI(startWithAI)
    setShowTemplateForm(true)
  }

  const openTemplateEditor = (template: MessageTemplate, startWithAI = false) => {
    setEditingTemplate(template)
    setTemplateFormStartsWithAI(startWithAI)
    setShowTemplateForm(true)
  }

  const openHistoryEditor = (message: AIMessage) => {
    setEditingHistoryItem(message)
    setHistoryDraft(message.final_content?.trim() || message.generated_content)
  }

  const handleSaveHistory = async () => {
    if (!editingHistoryItem || !historyDraft.trim()) return

    await updateAIMessage.mutateAsync({
      id: editingHistoryItem.id,
      data: {
        final_content: historyDraft.trim(),
        was_edited: historyDraft.trim() !== editingHistoryItem.generated_content.trim(),
      },
    })
    setEditingHistoryItem(null)
    setHistoryDraft('')
  }

  const openPlaybook = (playbook: (typeof playbooks)[number]) => {
    setBulkContact(playbook.contact)
    setAIPreset({
      category: playbook.category,
      tone: playbook.tone,
      channel: 'whatsapp',
      label: t(`messages.playbooks.items.${playbook.key}.title`),
      reason: t(`messages.playbooks.items.${playbook.key}.reason`),
    })
    setShowAIModal(true)
  }

  const TABS: { key: Tab; label: string; Icon: typeof Sparkles }[] = [
    { key: 'ai', label: t('messages.aiGenerator'), Icon: Sparkles },
    { key: 'templates', label: t('messages.templates'), Icon: FileText },
    { key: 'bulk', label: t('messages.bulk.title'), Icon: Users },
    { key: 'history', label: t('messages.history'), Icon: History },
  ]

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('messages.title')}</h1>
        <div className="flex gap-2">
          {tab === 'templates' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openNewTemplate()}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t('messages.template.new')}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowAIModal(true)} className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            {t('messages.generate')}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-primary/6 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/80">
              {t('messages.playbooks.label')}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t('messages.playbooks.subtitle')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(`${ROUTES.ACADEMY}/itirazlar`)}
          >
            <Shield className="h-4 w-4" />
            {t('messages.playbooks.openObjections')}
          </Button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {playbooks.map((playbook) => {
            const Icon = playbook.key === 'reconnect' ? Clock3 : playbook.key === 'decision' ? Flame : Compass

            return (
              <button
                key={playbook.key}
                type="button"
                onClick={() => openPlaybook(playbook)}
                className="rounded-2xl border border-border/70 bg-card/70 p-4 text-left transition-all hover:border-primary/25 hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-semibold tabular-nums">{playbook.count}</span>
                </div>

                <p className="mt-4 text-sm font-semibold">{t(`messages.playbooks.items.${playbook.key}.title`)}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {t(`messages.playbooks.items.${playbook.key}.body`, { count: playbook.count })}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t(`messages.categories.${playbook.category}`)}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t(`messages.tones.${playbook.tone}`)}
                  </span>
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t(`academy.objection.objCategories.${playbook.objectionCategory}`)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {t('messages.playbooks.bestLead')}
                    </p>
                    <p className="mt-1 truncate text-sm text-foreground">
                      {playbook.contact?.full_name ?? t('messages.playbooks.noLead')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-primary">
                    <span>{t('messages.playbooks.open')}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex border-b gap-1 overflow-x-auto">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'ai' && (
        <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{t('messages.ai.title')}</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md">
              {t('messages.ai.subtitle')}
            </p>
          </div>
          <Button onClick={() => setShowAIModal(true)} size="lg" className="gap-2">
            <Sparkles className="w-5 h-5" />
            {t('messages.ai.generate')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('messages.ai.contactHint')}
          </p>
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="pl-9"
            />
          </div>

          {templatesLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground">{t('messages.noTemplates')}</p>
              <p className="text-sm mt-2">{t('messages.noTemplatesDescription')}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => openNewTemplate(true)}>
                <Sparkles className="w-4 h-4 mr-1" />
                {t('messages.template.newFromAI')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="border rounded-lg bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{tmpl.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {t(`messages.categories.${tmpl.category}`)}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {t(`messages.channels.${tmpl.channel}`)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleFavorite.mutate({ id: tmpl.id, isFavorite: !tmpl.is_favorite })}
                        className={cn(
                          'p-1 rounded transition-colors',
                          tmpl.is_favorite ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500'
                        )}
                        title={t('messages.template.favorite')}
                      >
                        <Star className={cn('w-3.5 h-3.5', tmpl.is_favorite && 'fill-current')} />
                      </button>
                      <button
                        onClick={() => openTemplateEditor(tmpl, true)}
                        className="p-1 rounded text-muted-foreground hover:text-amber-500"
                        title={t('messages.template.regenerate')}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openTemplateEditor(tmpl)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                        title={t('common.edit')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t('messages.template.deleteConfirm'))) {
                            deleteTemplate.mutate(tmpl.id)
                          }
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-red-500"
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {tmpl.content}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleCopy(tmpl.content, tmpl.id)}
                    >
                      {copiedId === tmpl.id ? (
                        <><Check className="w-3 h-3" /> {t('messages.template.copied')}</>
                      ) : (
                        <><Copy className="w-3 h-3" /> {t('messages.ai.copyToClipboard')}</>
                      )}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openTemplateEditor(tmpl, true)}>
                      <RefreshCw className="w-3 h-3" />
                      {t('messages.template.regenerate')}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openTemplateEditor(tmpl)}>
                      <Pencil className="w-3 h-3" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm(t('messages.template.deleteConfirm'))) {
                          deleteTemplate.mutate(tmpl.id)
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                      {t('common.delete')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'bulk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">{t('messages.bulk.subtitle')}</p>
            <div className="flex gap-2">
              {bulkSelected.size > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={clearAll} className="gap-1.5 text-xs">
                    {t('messages.bulk.clearSelection')} ({bulkSelected.size})
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      const selected = bulkContacts.filter((c) => bulkSelected.has(c.id))
                      if (selected.length > 0) {
                        setBulkContact(selected[0])
                        setShowAIModal(true)
                      }
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    {t('messages.bulk.generateFor', { count: bulkSelected.size })}
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={bulkSearch}
              onChange={(e) => setBulkSearch(e.target.value)}
              placeholder={t('contacts.searchPlaceholder')}
              className="pl-9"
            />
          </div>

          {contactsLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b">
                <input
                  type="checkbox"
                  checked={bulkSelected.size === bulkContacts.length && bulkContacts.length > 0}
                  onChange={(e) => (e.target.checked ? selectAll() : clearAll())}
                  className="accent-primary"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {t('contacts.total', { count: bulkContacts.length })}
                  {bulkSelected.size > 0 && ` · ${t('contacts.selected', { count: bulkSelected.size })}`}
                </span>
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {bulkContacts.map((contact) => {
                  const initials = contact.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <div key={contact.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={bulkSelected.has(contact.id)}
                        onChange={() => toggleBulkSelect(contact.id)}
                        className="accent-primary shrink-0"
                      />
                      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contact.full_name}</p>
                        {contact.occupation && (
                          <p className="text-xs text-muted-foreground truncate">{contact.occupation}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StageBadge stage={contact.stage} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700"
                          onClick={() => {
                            setBulkContact(contact)
                            setShowAIModal(true)
                          }}
                        >
                          <Sparkles className="w-3 h-3" />
                          {t('messages.generate')}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {historyLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
          ) : historyItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground">{t('messages.noAIMessages')}</p>
              <p className="text-sm mt-2">{t('messages.noAIMessagesDescription')}</p>
            </div>
          ) : (
            historyItems.map((msg) => (
              <div key={msg.id} className="border rounded-lg bg-card p-4 space-y-3">
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {t(`messages.categories.${msg.category}`)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {t(`messages.channels.${msg.channel}`)}
                    </span>
                    {msg.was_edited && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {t('messages.historyItem.edited')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="hidden sm:inline text-xs text-muted-foreground mr-2">
                      {new Date(msg.created_at).toLocaleDateString(currentLocale)}
                    </span>
                    <button
                      onClick={() => openHistoryEditor(msg)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                      title={t('common.edit')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(t('messages.historyItem.deleteConfirm'))) {
                          deleteAIMessage.mutate(msg.id)
                        }
                      }}
                      className="p-1 rounded text-muted-foreground hover:text-red-500"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {msg.displayContent}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.created_at).toLocaleDateString(currentLocale)}
                  </span>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleCopy(msg.displayContent, msg.id)}>
                    {copiedId === msg.id ? (
                      <><Check className="w-3 h-3" /> {t('messages.template.copied')}</>
                    ) : (
                      <><Copy className="w-3 h-3" /> {t('messages.ai.copyToClipboard')}</>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => openHistoryEditor(msg)}>
                    <Pencil className="w-3 h-3" />
                    {t('common.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(t('messages.historyItem.deleteConfirm'))) {
                        deleteAIMessage.mutate(msg.id)
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AIMessageGeneratorModal
        open={showAIModal}
        onClose={() => {
          setShowAIModal(false)
          setBulkContact(null)
          setAIPreset(null)
        }}
        contact={bulkContact}
        initialCategory={aiPreset?.category}
        initialTone={aiPreset?.tone}
        initialChannel={aiPreset?.channel}
        presetLabel={aiPreset?.label}
        presetReason={aiPreset?.reason}
      />

      <TemplateFormModal
        open={showTemplateForm}
        onClose={() => {
          setShowTemplateForm(false)
          setEditingTemplate(null)
          setTemplateFormStartsWithAI(false)
        }}
        template={editingTemplate}
        userId={user?.id ?? ''}
        startWithAI={templateFormStartsWithAI}
      />

      <Dialog open={!!editingHistoryItem} onOpenChange={(open) => !open && setEditingHistoryItem(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('messages.historyItem.editTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={historyDraft}
              onChange={(event) => setHistoryDraft(event.target.value)}
              rows={8}
              className="resize-none"
              placeholder={t('messages.historyItem.contentPlaceholder')}
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveHistory} disabled={!historyDraft.trim() || updateAIMessage.isPending}>
                {updateAIMessage.isPending ? t('common.saving') : t('common.save')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingHistoryItem(null)
                  setHistoryDraft('')
                }}
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
