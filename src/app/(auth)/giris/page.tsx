import { LoginForm } from './_components/LoginForm'

export default function GirisPage() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-bold text-gray-900">Giriş Yap</h2>
      <p className="mb-6 text-sm text-gray-500">Hesabına giriş yap, ekibini yönet.</p>
      <LoginForm />
    </div>
  )
}
