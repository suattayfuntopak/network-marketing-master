import { Users, TrendingUp, MessageSquare, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

const stats = [
  { title: 'Toplam Kontak', value: '0', icon: Users, change: 'Henüz kontak yok' },
  { title: 'Aktif Pipeline', value: '0', icon: TrendingUp, change: 'Henüz pipeline yok' },
  { title: 'Bu Haftaki Mesaj', value: '0', icon: MessageSquare, change: 'Henüz mesaj yok' },
  { title: 'Aylık Hedef', value: '%0', icon: Target, change: 'Henüz hedef belirlenmedi' },
]

export function DashboardHome() {
  const { profile } = useAuth()

  return (
    <div className="p-6 pb-20 lg:pb-6 space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Hoş geldin, {profile?.full_name?.split(' ')[0] ?? 'Distribütör'} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Network Marketing Master kontrol panelinize hoş geldiniz.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ title, value, icon: Icon, change }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title}
              </CardTitle>
              <Icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground mt-1">{change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Onboarding CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Başlamaya hazır mısın?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                İlk kontaklarını ekleyerek Network Marketing Master'ı kullanmaya başla.
                AI destekli araçlarla ekibini büyüt.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
