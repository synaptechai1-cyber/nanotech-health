// GET /api/listings/:id/contact — the real subscription gate. Only
// returns WhatsApp/email if the requesting user is signed in AND has
// an active subscription, checked server-side against Clerk — not just
// hidden in the UI, since anyone can read the network tab.
import { getAuthedUser } from '../../../_shared/auth.js'

export async function onRequestGet({ request, env, params }) {
  const user = await getAuthedUser(request, env)
  if (!user) return json({ error: 'Not signed in' }, 401)
  if (!user.isSubscribed) return json({ error: 'Subscription required' }, 403)

  const listing = await env.DB.prepare(
    'SELECT contact_whatsapp, contact_email, medicine, pharmacy_name FROM listings WHERE id = ?'
  ).bind(params.id).first()
  if (!listing) return json({ error: 'Not found' }, 404)

  return json({
    contact_whatsapp: listing.contact_whatsapp,
    contact_email: listing.contact_email,
    medicine: listing.medicine,
    pharmacy: listing.pharmacy_name,
  })
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
