import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import { REGIONS } from '../lib/mockData'
import { Check } from 'lucide-react'

export default function Account() {
  const { user, signOut } = useAuth()
  const { getToken } = useClerkAuth()
  const navigate = useNavigate()

  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({ pharmacyName: '', region: '', phone: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Pre-fill the form once Clerk has loaded the user's saved profile.
  useEffect(() => {
    if (user) {
      setForm({
        pharmacyName: user.unsafeMetadata?.pharmacyName || '',
        region: user.unsafeMetadata?.region || '',
        phone: user.unsafeMetadata?.phone || '',
      })
    }
  }, [user])

  const isSubscribed = user?.publicMetadata?.subscriptionStatus === 'active'
  const plan = user?.publicMetadata?.subscriptionPlan

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await user.update({ unsafeMetadata: { ...user.unsafeMetadata, ...form } })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('This permanently deletes your account and all your listings. This cannot be undone. Continue?')) return
    setDeleting(true)
    try {
      const token = await getToken()
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Could not delete account')
      await signOut()
      navigate('/')
    } catch (err) {
      alert(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account settings</h1>

      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input className="input bg-gray-50 cursor-not-allowed" value={user?.primaryEmailAddress?.emailAddress || ''} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pharmacy name</label>
          <input className="input" placeholder="City Pharmacy" value={form.pharmacyName} onChange={e => set('pharmacyName', e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">City / Region</label>
          <select className="input" value={form.region} onChange={e => set('region', e.target.value)}>
            <option value="">Select region...</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (WhatsApp)</label>
          <input className="input" placeholder="0821234567" value={form.phone} onChange={e => set('phone', e.target.value)} />
        </div>

        <div className="pt-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Subscription status</p>
              {isSubscribed ? (
                <p className="text-xs text-green-600 font-semibold mt-0.5">Active — {plan === 'annual' ? 'Annual plan' : 'Monthly plan'}</p>
              ) : (
                <p className="text-xs text-orange-500 font-semibold mt-0.5">
                  Inactive — <button onClick={() => navigate('/subscription')} className="underline">Upgrade now</button>
                </p>
              )}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className={`btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60 ${saved ? 'bg-green-600 hover:bg-green-700' : ''}`}>
            {saved ? <><Check size={16} /> Saved!</> : saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="mt-8 border border-red-200 rounded-xl p-5">
        <h3 className="font-semibold text-red-700 text-sm mb-1">Danger zone</h3>
        <p className="text-xs text-gray-500 mb-3">Once you delete your account, all your listings will be permanently removed.</p>
        <button onClick={handleDeleteAccount} disabled={deleting} className="text-xs font-semibold text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60">
          {deleting ? 'Deleting...' : 'Delete account'}
        </button>
      </div>
    </div>
  )
}
