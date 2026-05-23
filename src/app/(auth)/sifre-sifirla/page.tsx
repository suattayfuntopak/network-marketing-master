import { ResetForm } from './_components/ResetForm'

export default function SifreSifirlaPage() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-bold text-gray-900">Şifreni Sıfırla</h2>
      <p className="mb-6 text-sm text-gray-500">
        E-postanı gir, sana sıfırlama bağlantısı gönderelim.
      </p>
      <ResetForm />
    </div>
  )
}
