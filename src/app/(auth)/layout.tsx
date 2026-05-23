export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EEEDFE] px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#534AB7]">
            <span className="text-2xl font-black text-white">N</span>
          </div>
          <h1 className="text-xl font-bold text-[#534AB7]">Network Marketing Master</h1>
        </div>
        {children}
      </div>
    </div>
  )
}
