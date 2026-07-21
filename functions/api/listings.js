// GET  /api/listings  — public. Returns the live feed WITHOUT contact
//                        details (those only come from /api/listings/:id/contact,
//                        which checks the subscription server-side).
// POST /api/listings  — requires a signed-in, subscribed user. Pharmacy
//                        name/region/contact info are pulled from the
//                        user's own Clerk profile, not trusted from the
//                        browser, so nobody can post a listing under a
//                        pharmacy name that isn't theirs.
import { getAuthedUser } from '../_shared/auth.js'

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    `SELECT id, user_id, type, medicine, strength, category, quantity, expiry,
            pharmacy_name AS pharmacy, region, created_at
     FROM listings ORDER BY created_at DESC LIMIT 200`
  ).all()
  return json(results)
}

export async function onRequestPost({ request, env }) {
  const user = await getAuthedUser(request, env)
  if (!user) return json({ error: 'Not signed in' }, 401)
  if (!user.isSubscribed) return json({ error: 'Subscription required' }, 403)
  if (!user.pharmacyName || !user.region) {
    return json({ error: 'Please complete your pharmacy profile on the Account page first' }, 400)
  }

  const body = await request.json()
  const type = body.type === 'needed' ? 'needed' : 'available'
  const medicine = String(body.medicine || '').trim()
  if (!medicine) return json({ error: 'Medicine name is required' }, 400)

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  await env.DB.prepare(
    `INSERT INTO listings
     (id, user_id, type, medicine, strength, category, quantity, expiry,
      pharmacy_name, region, contact_whatsapp, contact_email, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, user.id, type, medicine,
    String(body.strength || ''), String(body.category || ''),
    Number(body.quantity) || 1, String(body.expiry || ''),
    user.pharmacyName, user.region, user.phone, user.email, createdAt
  ).run()

  return json({ id, user_id: user.id, type, medicine, strength: body.strength, category: body.category,
    quantity: Number(body.quantity) || 1, expiry: body.expiry,
    pharmacy: user.pharmacyName, region: user.region, created_at: createdAt }, 201)
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
