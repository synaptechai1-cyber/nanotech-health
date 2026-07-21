import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn } from '@clerk/react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const { signIn, errors, fetchStatus } = useSignIn()
  const navigate = useNavigate()

  const finalize = async () => {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => navigate(decorateUrl('/marketplace')),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { error } = await signIn.password({ emailAddress: email, password })
    if (error) return // error message renders below from `errors`

    if (signIn.status === 'complete') {
      await finalize()
    } else if (signIn.status === 'needs_client_trust') {
      // Clerk doesn't recognize this browser/device yet — it needs a
      // one-time email code before it'll complete the sign-in. This is
      // "Client Trust," on by default for apps created after Nov 2025.
      // See: https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
      const emailCodeFactor = signIn.supportedSecondFactors?.find(f => f.strategy === 'email_code')
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    } else if (signIn.status === 'needs_second_factor') {
      // MFA is enabled on this Clerk app but we don't have a UI for it yet.
      console.error('Sign-in needs a second factor, not yet supported here:', signIn)
    } else {
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    await signIn.mfa.verifyEmailCode({ code })
    if (signIn.status === 'complete') {
      await finalize()
    }
  }

  const topError = errors?.fields?.identifier?.message || errors?.fields?.password?.message || errors?.fields?.code?.message

  // Step 2: Client Trust verification code screen
  if (signIn?.status === 'needs_client_trust') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo.jpg" alt="NanoTech Health" className="w-16 h-16 rounded-full object-cover border border-gray-200 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900">Verify it's you</h1>
            <p className="text-sm text-gray-500 mt-1">We sent a code to {email} — this browser hasn't signed in before.</p>
          </div>

          <div className="card p-6">
            {topError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{topError}</div>}
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification code</label>
                <input className="input" type="text" inputMode="numeric" placeholder="123456" value={code} onChange={e => setCode(e.target.value)} required autoFocus />
              </div>
              <button type="submit" disabled={fetchStatus === 'fetching'} className="btn-primary w-full py-3 disabled:opacity-60">
                {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            <button onClick={() => signIn.mfa.sendEmailCode()} className="text-sm text-nano-600 hover:underline mt-3 block mx-auto">
              Send a new code
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 1: normal email/password screen
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.jpg" alt="NanoTech Health" className="w-16 h-16 rounded-full object-cover border border-gray-200 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back to NanoTech Health</p>
        </div>

        <div className="card p-6">
          {topError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{topError}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input className="input" type="email" placeholder="pharmacy@example.co.za" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={fetchStatus === 'fetching'} className="btn-primary w-full py-3 disabled:opacity-60">
              {fetchStatus === 'fetching' ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account? <Link to="/signup" className="text-nano-600 font-semibold hover:underline">Get started</Link>
        </p>
      </div>
    </div>
  )
}
