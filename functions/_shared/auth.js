// Shared helper: verifies the Clerk session token sent from the browser
// (Authorization: Bearer <token>) and returns the signed-in user's info.
// Returns null if the token is missing/invalid — callers should treat
// that as "not logged in" and respond 401.
import { verifyToken, createClerkClient } from '@clerk/backend'

export async function getAuthedUser(request, env) {
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return null

  let verified
  try {
    verified = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      authorizedParties: env.SITE_URL ? [env.SITE_URL] : undefined,
    })
  } catch (err) {
    return null // invalid/expired token — treat as not logged in
  }

  try {
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
    const user = await clerk.users.getUser(verified.sub)

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
      isSubscribed: user.publicMetadata?.subscriptionStatus === 'active',
      // Filled in on the Account page — see src/pages/Account.jsx
      pharmacyName: user.unsafeMetadata?.pharmacyName || '',
      region: user.unsafeMetadata?.region || '',
      phone: user.unsafeMetadata?.phone || '',
    }
  } catch (err) {
    // Something went wrong fetching the full user record from Clerk's API
    // (bad secret key, network hiccup, etc.). Log the real reason here —
    // Cloudflare dashboard -> your project -> Logs — instead of letting
    // it surface as an opaque crash to whichever function called us.
    console.error('getAuthedUser: failed to fetch Clerk user:', err.stack || err)
    return null
  }
}
