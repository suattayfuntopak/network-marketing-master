import { UpdatePasswordForm } from './_components/UpdatePasswordForm'

export default function SifreGuncelePage() {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="mb-1 text-xl font-bold text-gray-900">Yeni Şifre Belirle</h2>
      <p className="mb-6 text-sm text-gray-500">En az 6 karakter gir.</p>
      <UpdatePasswordForm />
    </div>
  )
}
