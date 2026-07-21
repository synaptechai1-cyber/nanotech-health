import { useState } from 'react'
import { PLANS } from '../lib/mockData'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth as useClerkAuth } from '@clerk/react'

export default function Subscription() {
  const navigate = useNavigate()
  const { getToken } = useClerkAuth()
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)
  const [pendingSubmit, setPendingSubmit] = useState(null) // {action, fields} once debug is shown

  const submitToPayfast = ({ action, fields }) => {
    // Build a hidden form and submit it — PayFast expects a real
    // browser POST/redirect, not a fetch response.
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = action
    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = key
      input.value = value
      form.appendChild(input)
    })
    document.body.appendChild(form)
    form.submit()
  }

  const handleUpgrade = async (planId) => {
    setError('')
    setDebugInfo(null)
    setLoadingPlan(planId)
    try {
      const token = await getToken()
      const res = await fetch('/api/payfast-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.stack) console.error('payfast-checkout stack:', data.stack)
        throw new Error(data.error || 'Something went wrong')
      }

      if (data.debug) {
        // PAYFAST_DEBUG=true is set — show the parameter string instead
        // of immediately navigating away, so there's time to copy it.
        setDebugInfo(data.debug)
        setPendingSubmit({ action: data.action, fields: data.fields })
        setLoadingPlan(null)
        return
      }

      submitToPayfast({ action: data.action, fields: data.fields })
    } catch (err) {
      setError(err.message)
      setLoadingPlan(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade to unlock the marketplace</h1>
        <p className="text-gray-500">Viewing is always free. Posting and contacting requires a subscription.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 max-w-md mx-auto text-center">{error}</div>}

      {debugInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 max-w-xl mx-auto">
          <p className="text-xs font-semibold text-amber-800 mb-2">PAYFAST_DEBUG is on — checkout paused so you can copy this:</p>
          <p className="text-xs text-gray-600 mb-1">Parameter string (paste into PayFast's Sandbox Signature Tool):</p>
          <textarea readOnly className="w-full text-xs font-mono bg-white border border-gray-200 rounded p-2 mb-2" rows={3} value={debugInfo.paramString} onClick={e => e.target.select()} />
          <p className="text-xs text-gray-600 mb-1">Signature we computed:</p>
          <textarea readOnly className="w-full text-xs font-mono bg-white border border-gray-200 rounded p-2 mb-3" rows={1} value={debugInfo.signature} onClick={e => e.target.select()} />
          <button
            onClick={() => submitToPayfast(pendingSubmit)}
            className="btn-primary text-sm py-2 px-4"
          >
            Continue to PayFast checkout →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {PLANS.map(plan => (
          <div key={plan.id} className={`card p-6 relative ${plan.highlight ? 'border-2 border-nano-500' : ''}`}>
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-nano-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                {plan.badge}
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-4xl font-bold text-gray-900">R{plan.price.toLocaleString()}</span>
              <span className="text-gray-400 text-sm">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check size={16} className="text-nano-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={loadingPlan !== null}
              className={`w-full py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-60 ${plan.highlight ? 'btn-primary' : 'border border-nano-500 text-nano-600 hover:bg-nano-50'}`}
            >
              {loadingPlan === plan.id ? 'Redirecting to PayFast...' : `Upgrade to ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button onClick={() => navigate('/marketplace')} className="text-sm text-gray-400 hover:text-gray-600 underline">
          Continue browsing for free
        </button>
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Important notice</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          NanoTech Health is a communication and discovery platform for licensed pharmacy professionals. Your subscription covers platform access only. All medication exchanges, pricing agreements, and transactions occur directly between registered pharmacies. NanoTech Health does not facilitate the sale, transfer, or distribution of medication.
        </p>
      </div>
    </div>
  )
}
