import { Link } from 'react-router-dom'
import { ArrowRight, Search, Bell, ShieldCheck, Users } from 'lucide-react'

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-nano-50 text-nano-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-nano-200">
            🏥 For Licensed Pharmacies Only
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-tight">
            Connecting pharmacies.<br />
            <span className="text-nano-600">Reducing shortages.</span>
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            NanoTech Health is a secure marketplace where South African pharmacies trade surplus stock and source needed medication — fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="btn-primary flex items-center justify-center gap-2 text-base py-3 px-8">
              Get started free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-outline flex items-center justify-center gap-2 text-base py-3 px-8">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Users, title: 'Create your pharmacy profile', desc: 'Sign up and add your pharmacy details — name, region, and contact info.' },
            { icon: Search, title: 'Browse the marketplace', desc: 'View all available and needed stock listings from pharmacies across South Africa.' },
            { icon: Bell, title: 'Post & connect', desc: 'Subscribe to post your own listings and contact other pharmacies directly via WhatsApp or email.' },
          ].map((s, i) => (
            <div key={i} className="card p-6">
              <div className="w-11 h-11 rounded-xl bg-nano-100 flex items-center justify-center mb-4">
                <s.icon size={22} className="text-nano-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="bg-nano-600 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck size={36} className="text-white mx-auto mb-3 opacity-90" />
          <h2 className="text-2xl font-bold text-white mb-2">Built for licensed healthcare providers</h2>
          <p className="text-nano-100 text-sm max-w-lg mx-auto">
            NanoTech Health is a communication platform only. We do not facilitate the sale of medication, set prices, or make clinical decisions. All transactions occur directly between pharmacies.
          </p>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Simple, transparent pricing</h2>
        <p className="text-gray-500 text-sm mb-8">Viewing is always free. Posting and contacting requires a subscription.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {[
            { name: 'Monthly', price: 'R299', period: '/month', badge: null },
            { name: 'Annual', price: 'R2,900', period: '/year', badge: 'Save 17%' },
          ].map((p, i) => (
            <div key={i} className={`card p-6 text-left ${i === 1 ? 'border-nano-400 border-2' : ''}`}>
              {p.badge && <span className="text-xs font-bold bg-nano-600 text-white px-2 py-1 rounded-full mb-3 inline-block">{p.badge}</span>}
              <p className="font-semibold text-gray-900 mb-1">{p.name}</p>
              <p className="text-3xl font-bold text-gray-900 mb-0.5">{p.price}<span className="text-sm text-gray-400 font-normal">{p.period}</span></p>
              <Link to="/signup" className="mt-4 btn-primary w-full text-center text-sm block py-2.5">Get started</Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
