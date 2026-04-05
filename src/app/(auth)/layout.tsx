// Layout für Auth-Seiten (Login / Register)
// Zentriertes Card-Layout ohne Dashboard-Navigation

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="font-bold text-2xl text-slate-900">Postona</span>
          </a>
        </div>
        {children}
      </div>
    </div>
  );
}
