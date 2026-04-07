import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, FileText, History, Plus, Star, Copy, Check, Trash2, Search, Send, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useTemplates, useDeleteTemplate, useToggleTemplateFavorite, useAIMessages } from '@/hooks/useTemplates'
import { useContacts } from '@/hooks/useContacts'
import { AIMessageGeneratorModal } from '@/components/messages/AIMessageGeneratorModal'
import { TemplateFormModal } from '@/components/messages/TemplateFormModal'
import { StageBadge } from '@/components/contacts/StageBadge'
import type { MessageTemplate } from '@/lib/messages/types'
import type { ContactWithTags } from '@/lib/contacts/types'

type Tab = 'ai' | 'templates' | 'history' | 'bulk'

export function MessagesPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('ai')
  const [showAIModal, setShowAIModal] = useState(false)
  const [showTemplateForm, setShowTemplateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Bulk tab state
  const [bulkSearch, setBulkSearch] = useState('')
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())
  const [bulkContact, setBulkContact] = useState<ContactWithTags | null>(null)

  const { data: templates = [], isLoading: templatesLoading } = useTemplates(user?.id ?? '', {
    search: search.length >= 2 ? search : undefined,
  })
  const { data: aiMessages = [], isLoading: historyLoading } = useAIMessages(user?.id ?? '')
  const deleteTemplate = useDeleteTemplate(user?.id ?? '')
  const toggleFavorite = useToggleTemplateFavorite(user?.id ?? '')

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

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleBulkSelect = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setBulkSelected(new Set(bulkContacts.map(c => c.id)))
  const clearAll = () => setBulkSelected(new Set())

  const TABS: { key: Tab; label: string; Icon: typeof Sparkles }[] = [
    { key: 'ai', label: t('messages.aiGenerator'), Icon: Sparkles },
    { key: 'templates', label: t('messages.templates'), Icon: FileText },
    { key: 'bulk', label: t('messages.bulk.title'), Icon: Users },
    { key: 'history', label: t('messages.history'), Icon: History },
  ]

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('messages.title')}</h1>
        <div className="flex gap-2">
          {tab === 'templates' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setEditingTemplate(null); setShowTemplateForm(true) }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t('messages.template.new')}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setShowAIModal(true)}
            className="gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            {t('messages.generate')}
          </Button>
        </div>
      </div>

      {/* Tab bar */}
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

      {/* AI tab */}
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

      {/* Templates tab */}
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
              <p>{t('messages.noTemplates')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => { setEditingTemplate(null); setShowTemplateForm(true) }}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('messages.template.new')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="border rounded-lg bg-card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
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
                        className={cn('p-1 rounded', tmpl.is_favorite ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500')}
                      >
                        <Star className={cn('w-3.5 h-3.5', tmpl.is_favorite && 'fill-current')} />
                      </button>
                      <button
                        onClick={() => { setEditingTemplate(tmpl); setShowTemplateForm(true) }}
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bu şablonu silmek istediğine emin misin?')) {
                            deleteTemplate.mutate(tmpl.id)
                          }
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {tmpl.content}
                  </p>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleCopy(tmpl.content, tmpl.id)}
                  >
                    {copiedId === tmpl.id ? (
                      <><Check className="w-3 h-3" /> Kopyalandı</>
                    ) : (
                      <><Copy className="w-3 h-3" /> {t('messages.ai.copyToClipboard')}</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk tab */}
      {tab === 'bulk' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">{t('messages.bulk.subtitle')}</p>
            <div className="flex gap-2">
              {bulkSelected.size > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAll}
                    className="gap-1.5 text-xs"
                  >
                    {t('messages.bulk.clearSelection')} ({bulkSelected.size})
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      const selected = bulkContacts.filter(c => bulkSelected.has(c.id))
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
                  onChange={(e) => e.target.checked ? selectAll() : clearAll()}
                  className="accent-primary"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {bulkContacts.length} {t('contacts.title').toLowerCase()}
                  {bulkSelected.size > 0 && ` · ${bulkSelected.size} ${t('contacts.selected')}`}
                </span>
              </div>
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {bulkContacts.map((contact) => {
                  const initials = contact.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  return (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                    >
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

      {/* History tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {historyLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t('common.loading')}</div>
          ) : aiMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{t('messages.noAIMessages')}</p>
            </div>
          ) : (
            aiMessages.map((msg) => (
              <div key={msg.id} className="border rounded-lg bg-card p-4 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {t(`messages.categories.${msg.category}`)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {t(`messages.channels.${msg.channel}`)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(msg.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {msg.generated_content}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <AIMessageGeneratorModal
        open={showAIModal}
        onClose={() => { setShowAIModal(false); setBulkContact(null) }}
        contact={bulkContact}
      />
      <TemplateFormModal
        open={showTemplateForm}
        onClose={() => { setShowTemplateForm(false); setEditingTemplate(null) }}
        template={editingTemplate}
        userId={user?.id ?? ''}
      />
    </div>
  )
}
