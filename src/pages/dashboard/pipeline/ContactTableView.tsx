import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StageBadge } from '@/components/contacts/StageBadge'
import { WarmthScoreBadge } from '@/components/contacts/WarmthScoreBadge'
import { ROUTES } from '@/lib/constants'
import type { ContactWithTags } from '@/lib/contacts/types'

interface Props {
  contacts: ContactWithTags[]
}

export function ContactTableView({ contacts }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('contacts.columns.name')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('contacts.columns.stage')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('contacts.columns.warmth')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('contacts.detail.info')}</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('contacts.columns.tags')}</th>
          </tr>
        </thead>
        <tbody>
          {contacts.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-12 text-muted-foreground">
                {t('contacts.noContacts')}
              </td>
            </tr>
          ) : (
            contacts.map((contact) => (
              <tr
                key={contact.id}
                className="border-b last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {contact.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{contact.full_name}</p>
                      {contact.occupation && (
                        <p className="text-xs text-muted-foreground">{contact.occupation}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StageBadge stage={contact.stage} />
                </td>
                <td className="px-4 py-3">
                  <WarmthScoreBadge score={contact.warmth_score} />
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {t(`contactSources.${contact.source}`)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag.id}
                        className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
