import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn } from '@clerk/react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, errors, fetchStatus } = useSignIn()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { error } = await signIn.password({ emailAddress: email, password })
    if (error) return // error message renders below from `errors`

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => navigate(decorateUrl('/marketplace')),
      })
    }
    // If your Clerk dashboard has extra verification steps (MFA, client
    // trust) turned on, signIn.status won't be 'complete' here yet —
    // see https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
  }

  const topError = errors?.fields?.identifier?.message || errors?.fields?.password?.message

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
