import { SignupForm } from './_components/SignupForm'

export default function KayitPage() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-bold text-gray-900">Hesap Oluştur</h2>
      <p className="mb-6 text-sm text-gray-500">Ekibini büyütmeye başla.</p>
      <SignupForm />
    </div>
  )
}
