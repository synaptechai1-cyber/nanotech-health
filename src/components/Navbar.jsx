import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navLinks = user
    ? [
        { to: '/marketplace', label: 'Marketplace' },
        { to: '/subscription', label: 'Subscription' },
        { to: '/account', label: 'Account' },
      ]
    : []

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/marketplace' : '/'} className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="NanoTech Health" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
            <span className="font-bold text-gray-900 text-base hidden sm:block">NanoTech Health</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={`text-sm font-medium transition-colors ${location.pathname === l.to ? 'text-nano-600' : 'text-gray-600 hover:text-gray-900'}`}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <button onClick={handleSignOut} className="btn-outline text-sm py-2 px-4">Sign out</button>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</Link>
                <Link to="/signup" className="btn-primary text-sm py-2 px-4">Get started</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-gray-500" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                {l.label}
              </Link>
            ))}
            {user ? (
              <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Sign in</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-nano-600 hover:bg-nano-50 rounded-lg">Get started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
