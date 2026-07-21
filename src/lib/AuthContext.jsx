import { createContext, useContext } from 'react'
import { useUser, useClerk } from '@clerk/react'

const AuthContext = createContext({})

// Thin wrapper around Clerk so the rest of the app can keep using
// useAuth() -> { user, loading, signOut } same as it did with Supabase.
// Sign-in and sign-up are handled directly on their own pages with
// useSignIn()/useSignUp(), since Clerk's rules require those hooks to
// be called from the component that renders the form.
export function AuthProvider({ children }) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  return (
    <AuthContext.Provider value={{
      user,
      loading: !isLoaded,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
