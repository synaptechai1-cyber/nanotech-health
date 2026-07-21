// DELETE /api/listings/:id — only the pharmacy that created a listing
// can remove it.
import { getAuthedUser } from '../../_shared/auth.js'

export async function onRequestDelete({ request, env, params }) {
  const user = await getAuthedUser(request, env)
  if (!user) return json({ error: 'Not signed in' }, 401)

  const listing = await env.DB.prepare('SELECT user_id FROM listings WHERE id = ?')
    .bind(params.id).first()
  if (!listing) return json({ error: 'Not found' }, 404)
  if (listing.user_id !== user.id) return json({ error: 'Not your listing' }, 403)

  await env.DB.prepare('DELETE FROM listings WHERE id = ?').bind(params.id).run()
  return json({ deleted: true })
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
