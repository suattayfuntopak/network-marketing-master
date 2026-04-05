import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { importContacts } from '@/lib/contacts/mutations'
import { CSV_COLUMN_MAP } from '@/lib/contacts/constants'
import type { ContactInsert } from '@/types/database'

const CONTACT_FIELDS: { value: string; label: string }[] = [
  { value: 'skip', label: '— Atla —' },
  { value: 'full_name', label: 'Ad Soyad' },
  { value: 'phone', label: 'Telefon' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'Email' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'city', label: 'Şehir' },
  { value: 'occupation', label: 'Meslek' },
  { value: 'relationship', label: 'İlişki Türü' },
  { value: 'notes', label: 'Notlar' },
  { value: 'source', label: 'Kaynak' },
]

interface ContactImportModalProps {
  open: boolean
  onClose: () => void
  userId: string
  onSuccess: (count: number) => void
}

type Step = 'upload' | 'map' | 'preview' | 'result'

export function ContactImportModal({ open, onClose, userId, onSuccess }: ContactImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setHeaders([])
    setRows([])
    setMapping({})
    setResult(null)
    setLoading(false)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFile = (file: File) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (parsed) => {
        const data = parsed.data
        if (data.length < 2) return

        const rawHeaders = data[0] as string[]
        const dataRows = data.slice(1) as string[][]

        setHeaders(rawHeaders)
        setRows(dataRows)

        // Auto-map headers
        const autoMap: Record<string, string> = {}
        rawHeaders.forEach((h) => {
          const mapped = CSV_COLUMN_MAP[h.toLowerCase().trim()]
          autoMap[h] = mapped ?? 'skip'
        })
        setMapping(autoMap)
        setStep('map')
      },
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      handleFile(file)
    }
  }

  const handleImport = async () => {
    const nameCol = Object.entries(mapping).find(([, v]) => v === 'full_name')?.[0]
    if (!nameCol) {
      alert('"Ad Soyad" sütununu eşleştirmeniz gerekiyor.')
      return
    }

    setLoading(true)
    try {
      const contacts: ContactInsert[] = rows.map((row) => {
        const contact: Partial<ContactInsert> = {
          user_id: userId,
          source: 'import',
          contact_type: 'prospect',
          stage: 'new',
          warmth_score: 50,
        }

        headers.forEach((header, idx) => {
          const field = mapping[header]
          if (field && field !== 'skip' && row[idx]) {
            ;(contact as Record<string, string>)[field] = row[idx].trim()
          }
        })

        return contact as ContactInsert
      }).filter((c) => c.full_name)

      const res = await importContacts(contacts)
      setResult(res)
      setStep('result')
      if (res.inserted > 0) onSuccess(res.inserted)
    } finally {
      setLoading(false)
    }
  }

  const previewRows = rows.slice(0, 5)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>CSV İçe Aktar</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-sm">CSV dosyasını buraya sürükle veya tıkla</p>
            <p className="text-xs text-muted-foreground mt-1">
              İlk satır sütun başlıkları olmalı
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              CSV sütunlarını uygulama alanlarıyla eşleştirin.
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-3">
                  <span className="text-sm w-1/2 truncate font-medium">{header}</span>
                  <Select
                    value={mapping[header] ?? 'skip'}
                    onValueChange={(v) => setMapping((prev) => ({ ...prev, [header]: v }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_FIELDS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('upload')}>Geri</Button>
              <Button onClick={() => setStep('preview')}>Önizle ({rows.length} satır)</Button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              İlk 5 satırın önizlemesi:
            </p>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {headers
                      .filter((h) => mapping[h] && mapping[h] !== 'skip')
                      .map((h) => (
                        <th key={h} className="px-2 py-2 text-left font-medium whitespace-nowrap">
                          {CONTACT_FIELDS.find((f) => f.value === mapping[h])?.label ?? mapping[h]}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border last:border-0">
                      {headers
                        .filter((h) => mapping[h] && mapping[h] !== 'skip')
                        .map((h, ci) => (
                          <td key={ci} className="px-2 py-1.5 truncate max-w-[150px]">
                            {row[headers.indexOf(h)] ?? ''}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStep('map')}>Geri</Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? 'İçe aktarılıyor...' : `${rows.length} Kaydı İçe Aktar`}
              </Button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            {result.inserted > 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p className="font-medium">{result.inserted} kontak başarıyla içe aktarıldı!</p>
              </div>
            ) : null}

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-destructive text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {result.errors.length} hata oluştu:
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{err}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Kapat</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
