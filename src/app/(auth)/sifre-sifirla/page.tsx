import { ResetForm } from './_components/ResetForm'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function SifreSifirlaPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-bold text-gray-900">Şifreni Sıfırla</h2>
      <p className="mb-6 text-sm text-gray-500">
        E-postanı gir, sana sıfırlama bağlantısı gönderelim.
      </p>
      {error && (
        <div className="mb-4 rounded-xl bg-[#FBEAF0] px-4 py-2.5 text-sm text-[#72243E]">
          {error === 'link_gecersiz'
            ? 'Bağlantı süresi dolmuş veya geçersiz. Yeni bir sıfırlama isteği gönder.'
            : decodeURIComponent(error)}
        </div>
      )}
      <ResetForm />
    </div>
  )
}
