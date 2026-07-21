import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignUp, useClerk } from '@clerk/react'
import { REGIONS } from '../lib/mockData'

export default function Signup() {
  const [form, setForm] = useState({ email: '', password: '', pharmacyName: '', region: '', phone: '' })
  const [code, setCode] = useState('')
  const [awaitingCode, setAwaitingCode] = useState(false)
  const { signUp, errors, fetchStatus } = useSignUp()
  const clerk = useClerk()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Step 1: create the account, then Clerk emails a one-time code
  const handleSubmit = async (e) => {
    e.preventDefault()
    const { error } = await signUp.password({ emailAddress: form.email, password: form.password })
    if (error) return
    await signUp.verifications.sendEmailCode()
    setAwaitingCode(true)
  }

  // Step 2: confirm the code, then finish signup and sign the user in
  const handleVerify = async (e) => {
    e.preventDefault()
    await signUp.verifications.verifyEmailCode({ code })
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: async ({ decorateUrl }) => {
          // The session is active at this point, so `clerk.user` is
          // populated — save the pharmacy details collected on the form
          // above, otherwise they're silently lost and the user has to
          // re-enter them on the Account page.
          try {
            if (clerk.user) {
              await clerk.user.update({
                unsafeMetadata: {
                  pharmacyName: form.pharmacyName,
                  region: form.region,
                  phone: form.phone,
                },
              })
            }
          } catch (err) {
            console.error('Failed to save pharmacy profile after signup:', err)
          }
          navigate(decorateUrl('/marketplace'))
        },
      })
    }
  }

  const topError = errors?.fields?.emailAddress?.message || errors?.fields?.password?.message

  if (awaitingCode) return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="NanoTech Health" className="w-16 h-16 rounded-full object-cover border border-gray-200 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-500 mt-1">Enter the code we just sent to {form.email}</p>
        </div>
        <div className="card p-6">
          {errors?.fields?.code && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{errors.fields.code.message}</div>}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification code</label>
              <input className="input" placeholder="123456" value={code} onChange={e => setCode(e.target.value)} required />
            </div>
            <button type="submit" disabled={fetchStatus === 'fetching'} className="btn-primary w-full py-3 disabled:opacity-60">
              {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify & continue'}
            </button>
          </form>
          <button onClick={() => signUp.verifications.sendEmailCode()} className="text-xs text-gray-400 hover:text-gray-600 underline mt-4">
            Resend code
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="NanoTech Health" className="w-16 h-16 rounded-full object-cover border border-gray-200 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Join the pharmacy exchange network</p>
        </div>

        <div className="card p-6">
          {topError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{topError}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pharmacy name</label>
              <input className="input" placeholder="City Pharmacy" value={form.pharmacyName} onChange={e => set('pharmacyName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Region</label>
              <select className="input" value={form.region} onChange={e => set('region', e.target.value)}>
                <option value="">Select region...</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp number</label>
              <input className="input" placeholder="0821234567" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input className="input" type="email" placeholder="pharmacy@example.co.za" value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input className="input" type="password" placeholder="Min. 8 characters" value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <button type="submit" disabled={fetchStatus === 'fetching'} className="btn-primary w-full py-3 disabled:opacity-60">
              {fetchStatus === 'fetching' ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          {/* Required by Clerk's bot sign-up protection */}
          <div id="clerk-captcha" />
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account? <Link to="/login" className="text-nano-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
