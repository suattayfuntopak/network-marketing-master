import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Edit, Archive, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StageBadge } from './StageBadge'
import { WarmthScoreBar } from './WarmthScoreBar'
import { ChannelButtons } from './ChannelButtons'
import { TagChip } from './TagChip'
import type { ContactWithTags } from '@/lib/contacts/types'
import type { ContactSort, SortField } from '@/lib/contacts/types'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ContactTableProps {
  contacts: ContactWithTags[]
  selectedIds: string[]
  sort: ContactSort
  onSort: (field: SortField) => void
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
  onEdit: (id: string) => void
  onArchive: (id: string, archived: boolean) => void
  onDelete: (id: string) => void
}

function SortIcon({ field, sort }: { field: SortField; sort: ContactSort }) {
  if (sort.field !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/60" />
  return sort.order === 'asc'
    ? <ArrowUp className="w-3.5 h-3.5" />
    : <ArrowDown className="w-3.5 h-3.5" />
}

function SortHeader({
  field,
  sort,
  onSort,
  children,
}: {
  field: SortField
  sort: ContactSort
  onSort: (f: SortField) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 font-medium hover:text-foreground transition-colors"
    >
      {children}
      <SortIcon field={field} sort={sort} />
    </button>
  )
}

export function ContactTable({
  contacts,
  selectedIds,
  sort,
  onSort,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onArchive,
  onDelete,
}: ContactTableProps) {
  const navigate = useNavigate()
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.includes(c.id))
  const someSelected = contacts.some((c) => selectedIds.includes(c.id))

  const handleSort = (field: SortField) => {
    if (sort.field === field) {
      onSort(field) // triggers toggle in parent
    } else {
      onSort(field)
    }
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-3 py-3 text-left">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'mixed' : false}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="px-3 py-3 text-left text-muted-foreground">
                <SortHeader field="full_name" sort={sort} onSort={handleSort}>İsim</SortHeader>
              </th>
              <th className="px-3 py-3 text-left text-muted-foreground">Kanallar</th>
              <th className="px-3 py-3 text-left text-muted-foreground">Aşama</th>
              <th className="px-3 py-3 text-left text-muted-foreground min-w-32">
                <SortHeader field="warmth_score" sort={sort} onSort={handleSort}>Sıcaklık</SortHeader>
              </th>
              <th className="px-3 py-3 text-left text-muted-foreground">Etiketler</th>
              <th className="px-3 py-3 text-left text-muted-foreground">
                <SortHeader field="last_contact_at" sort={sort} onSort={handleSort}>Son Temas</SortHeader>
              </th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                onClick={() => navigate(`${ROUTES.CONTACTS}/${contact.id}`)}
                className={cn(
                  'border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-muted/30',
                  selectedIds.includes(contact.id) && 'bg-primary/5'
                )}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.includes(contact.id)}
                    onCheckedChange={() => onToggleSelect(contact.id)}
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center shrink-0">
                      {contact.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{contact.full_name}</p>
                      {contact.nickname && (
                        <p className="text-xs text-muted-foreground">"{contact.nickname}"</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <ChannelButtons contact={contact} size="sm" />
                </td>
                <td className="px-3 py-3">
                  <StageBadge stage={contact.stage} />
                </td>
                <td className="px-3 py-3 min-w-32">
                  <WarmthScoreBar score={contact.warmth_score} showLabel={false} />
                  <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{contact.warmth_score}</p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.slice(0, 2).map((tag) => (
                      <TagChip key={tag.id} tag={tag} />
                    ))}
                    {contact.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">+{contact.tags.length - 2}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {contact.last_contact_at
                    ? formatDistanceToNow(new Date(contact.last_contact_at), {
                        addSuffix: true,
                        locale: tr,
                      })
                    : '—'}
                </td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-accent transition-colors outline-none">
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(contact.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onArchive(contact.id, !contact.is_archived)}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        {contact.is_archived ? 'Arşivden Çıkar' : 'Arşivle'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(contact.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
