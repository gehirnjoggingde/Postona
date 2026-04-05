import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <span className="font-bold text-white">Postona</span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed">
              LinkedIn-Posts im eigenen Stil – vollautomatisch generiert und geplant.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Produkt</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Preise</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Registrieren</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Rechtliches</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-white transition-colors">AGB</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 text-sm text-center">
          © {new Date().getFullYear()} Postona. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
