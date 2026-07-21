import { useState, useEffect, useCallback } from 'react'
import { REGIONS, CATEGORIES } from '../lib/mockData'
import { Plus, Search, Phone, Mail, Lock, X, Loader2, Trash2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useNavigate } from 'react-router-dom'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ContactModal({ listing, contact, loading, error, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Contact {contact?.pharmacy || listing.pharmacy}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        {loading && <p className="text-sm text-gray-400 flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading contact details...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {contact && (
          <>
            <p className="text-sm text-gray-500 mb-5">Reach out directly about <strong>{listing.medicine}</strong>.</p>
            <div className="space-y-3">
              {contact.contact_whatsapp && (
                <a href={`https://wa.me/27${contact.contact_whatsapp.replace(/^0/, '')}?text=Hi, I saw your listing for ${listing.medicine} on NanoTech Health marketplace.`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-xl transition-all">
                  <Phone size={18} /> Contact via WhatsApp
                </a>
              )}
              <a href={`mailto:${contact.contact_email}?subject=NanoTech Health — ${listing.medicine} listing&body=Hi, I saw your listing for ${listing.medicine} on NanoTech Health marketplace.`}
                className="flex items-center gap-3 w-full border border-gray-300 hover:border-nano-500 text-gray-700 font-semibold px-4 py-3 rounded-xl transition-all">
                <Mail size={18} /> Send Email
              </a>
            </div>
          </>
        )}
        <p className="text-xs text-gray-400 text-center mt-4">All transactions are between pharmacies directly. NanoTech Health facilitates communication only.</p>
      </div>
    </div>
  )
}

function CreateListingModal({ onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState({ type: 'available', medicine: '', strength: '', quantity: 1, expiry: '', category: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Create Listing</h3>
            <p className="text-xs text-gray-400">Takes less than 30 seconds.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing type</label>
            <select className="input" value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="available">🟢 Stock Available</option>
              <option value="needed">🟠 Stock Needed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Medicine name</label>
            <input className="input" placeholder="e.g. Amoxicillin" value={form.medicine} onChange={e => set('medicine', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Strength (optional)</label>
            <input className="input" placeholder="e.g. 500mg" value={form.strength} onChange={e => set('strength', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity (units/packs)</label>
            <input className="input" type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
          </div>
          {form.type === 'available' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiry date (optional)</label>
              <input className="input" type="month" value={form.expiry} onChange={e => set('expiry', e.target.value)} />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5">Cancel</button>
          <button onClick={() => onSubmit(form)} className="btn-primary flex-1 py-2.5 disabled:opacity-60" disabled={!form.medicine || submitting}>
            {submitting ? 'Posting...' : 'Submit Listing'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Marketplace() {
  const { user } = useAuth()
  const { getToken } = useClerkAuth()
  const SUBSCRIBED = user?.publicMetadata?.subscriptionStatus === 'active'
  const profileComplete = !!(user?.unsafeMetadata?.pharmacyName && user?.unsafeMetadata?.region)
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterRegion, setFilterRegion] = useState('')
  const [listings, setListings] = useState([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [listError, setListError] = useState('')

  const [contactListing, setContactListing] = useState(null)
  const [contactData, setContactData] = useState(null)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const loadListings = useCallback(async () => {
    setLoadingListings(true)
    setListError('')
    try {
      const res = await fetch('/api/listings')
      if (!res.ok) throw new Error('Could not load listings')
      setListings(await res.json())
    } catch (err) {
      setListError(err.message)
    } finally {
      setLoadingListings(false)
    }
  }, [])

  useEffect(() => { loadListings() }, [loadListings])

  const filtered = listings.filter(l => {
    const matchSearch = !search || l.medicine.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || l.type === filterType
    const matchRegion = !filterRegion || l.region === filterRegion
    return matchSearch && matchType && matchRegion
  })

  const handleContact = async (listing) => {
    if (!SUBSCRIBED) { navigate('/subscription'); return }
    setContactListing(listing)
    setContactData(null)
    setContactError('')
    setContactLoading(true)
    try {
      const token = await getToken()
      const res = await fetch(`/api/listings/${listing.id}/contact`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load contact details')
      setContactData(data)
    } catch (err) {
      setContactError(err.message)
    } finally {
      setContactLoading(false)
    }
  }

  const handleCreate = () => {
    if (!SUBSCRIBED) { navigate('/subscription'); return }
    if (!profileComplete) {
      alert('Please complete your pharmacy name and region on the Account page first — this is what other pharmacies will see on your listings.')
      navigate('/account')
      return
    }
    setCreateError('')
    setShowCreate(true)
  }

  const handleSubmitListing = async (form) => {
    setCreating(true)
    setCreateError('')
    try {
      const token = await getToken()
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create listing')
      setListings(l => [data, ...l])
      setShowCreate(false)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this listing?')) return
    const token = await getToken()
    const res = await fetch(`/api/listings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setListings(l => l.filter(x => x.id !== id))
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">Live feed of stock available and needed.</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus size={18} /> Create Listing
        </button>
      </div>

      {/* Subscription banner */}
      {!SUBSCRIBED && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">You're viewing as a guest. Subscribe to post listings and contact pharmacies.</p>
          </div>
          <button onClick={() => navigate('/subscription')} className="text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors flex-shrink-0">
            View plans →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search medicine..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All listings</option>
          <option value="available">Stock Available</option>
          <option value="needed">Stock Needed</option>
        </select>
        <select className="input sm:w-44" value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
          <option value="">All regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Listings */}
      {loadingListings ? (
        <div className="card p-12 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading listings...
        </div>
      ) : listError ? (
        <div className="card p-12 text-center text-red-500 text-sm">{listError}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-400 text-sm">No listings found. {filterType !== 'all' || search ? 'Try clearing your filters.' : 'Be the first to post!'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(listing => (
            <div key={listing.id} className="card p-5 hover:border-nano-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={listing.type === 'available' ? 'badge-available' : 'badge-needed'}>
                      <span className={`w-1.5 h-1.5 rounded-full ${listing.type === 'available' ? 'bg-green-500' : 'bg-orange-500'}`} />
                      {listing.type === 'available' ? 'Stock Available' : 'Stock Needed'}
                    </span>
                    {listing.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{listing.category}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base">{listing.medicine}</h3>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    {listing.strength && <span className="text-sm text-gray-500">{listing.strength}</span>}
                    <span className="text-sm text-gray-500">{listing.quantity} units</span>
                    {listing.expiry && <span className="text-sm text-gray-500">Exp: {listing.expiry}</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-gray-400">📍 {listing.region}</span>
                    <span className="text-xs text-gray-400">🏥 {listing.pharmacy}</span>
                    <span className="text-xs text-gray-400">{timeAgo(listing.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleContact(listing)}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg transition-all ${SUBSCRIBED ? 'btn-primary' : 'border border-gray-200 text-gray-400 hover:border-nano-400 hover:text-nano-600'}`}
                  >
                    {!SUBSCRIBED && <Lock size={14} />}
                    Contact
                  </button>
                  {user && listing.user_id === user.id && (
                    <button onClick={() => handleDelete(listing.id)} className="p-2.5 text-gray-300 hover:text-red-500 transition-colors" title="Remove listing">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {contactListing && (
        <ContactModal
          listing={contactListing}
          contact={contactData}
          loading={contactLoading}
          error={contactError}
          onClose={() => setContactListing(null)}
        />
      )}
      {showCreate && (
        <CreateListingModal
          onClose={() => setShowCreate(false)}
          onSubmit={handleSubmitListing}
          submitting={creating}
          error={createError}
        />
      )}
    </div>
  )
}
