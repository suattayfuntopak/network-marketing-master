'use client'

import { useState, useEffect } from 'react'
import { X, Settings, Layout, Sun, Moon, Monitor, Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Z } from '@/lib/zIndex'

interface SettingsModalProps {
  workspaceId: string
  onClose: () => void
}

export function SettingsModal({ workspaceId, onClose }: SettingsModalProps) {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [workspaceName, setWorkspaceName] = useState('')

  useEffect(() => {
    // Escape key
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)

    // Load workspace info
    async function loadWorkspace() {
      try {
        const { data, error } = await supabase
          .from('nmm_workspaces')
          .select('name')
          .eq('id', workspaceId)
          .single()

        if (error) throw error
        if (data) setWorkspaceName(data.name)
      } catch (err) {
        console.error('Workspace yüklenirken hata:', err)
      } finally {
        setFetching(false)
      }
    }

    if (workspaceId) {
      loadWorkspace()
    } else {
      setFetching(false)
    }

    return () => document.removeEventListener('keydown', onKey)
  }, [workspaceId, onClose, supabase])

  async function handleSaveWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    if (!workspaceName.trim()) {
      toast.error('Grup / Ekip adı boş olamaz!')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('nmm_workspaces')
        .update({ name: workspaceName.trim() })
        .eq('id', workspaceId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['workspace'] })
      toast.success('Grup adı başarıyla güncellendi')
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Güncellenirken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`fixed inset-0 ${Z.sheet} flex items-center justify-center p-4`}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-[var(--bg-card)] p-6 shadow-2xl border border-[var(--border)] transition-all" style={{ maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' }}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-1)]">Sistem Ayarları</h2>
            <p className="text-xs text-[var(--text-3)]">Çalışma alanı ve görünüm ayarlarını düzenleyin</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text-2)] hover:bg-[var(--border)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {fetching ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-[#534AB7]" />
            <p className="text-sm text-[var(--text-2)]">Yükleniyor...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tema Ayarı */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-1)]">Görünüm Teması</h3>
                <p className="text-xs text-[var(--text-3)]">Uygulamanın renk paletini değiştirin</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Light Theme */}
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 border text-sm transition-all ${theme === 'light' ? 'bg-[#EEEDFE]/50 border-[#534AB7] text-[#534AB7] font-semibold' : 'bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--border)]'}`}
                >
                  <Sun className="h-5 w-5" />
                  Açık
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 border text-sm transition-all ${theme === 'dark' ? 'bg-[#EEEDFE]/50 border-[#534AB7] text-[#534AB7] font-semibold' : 'bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--border)]'}`}
                >
                  <Moon className="h-5 w-5" />
                  Koyu
                </button>

                {/* System Theme */}
                <button
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl p-3 border text-sm transition-all ${theme === 'system' ? 'bg-[#EEEDFE]/50 border-[#534AB7] text-[#534AB7] font-semibold' : 'bg-[var(--bg-subtle)] border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--border)]'}`}
                >
                  <Monitor className="h-5 w-5" />
                  Sistem
                </button>
              </div>
            </div>

            {/* Çalışma Alanı Ayarı */}
            <div className="border-t border-[var(--border)] pt-5 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-1)]">Çalışma Alanı (Workspace)</h3>
                <p className="text-xs text-[var(--text-3)]">Ekibinizin / Grubunuzun adını düzenleyin</p>
              </div>

              <form onSubmit={handleSaveWorkspace} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-2)]">Ekip / Grup Adı</label>
                  <div className="relative">
                    <Layout className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
                    <input
                      type="text"
                      required
                      value={workspaceName}
                      onChange={e => setWorkspaceName(e.target.value)}
                      placeholder="Örn: Benim Ekibim"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3 pl-10 pr-4 text-sm text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[#534AB7] focus:ring-1 focus:ring-[#534AB7] transition-all"
                    />
                  </div>
                </div>

                {/* Kaydet Butonu */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#534AB7] py-3 text-sm font-semibold text-white transition hover:bg-[#433a9f] active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Güncelleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
