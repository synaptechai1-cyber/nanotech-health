// POST /api/delete-account — removes the user's listings from D1, then
// deletes their Clerk account entirely. Irreversible.
import { createClerkClient } from '@clerk/backend'
import { getAuthedUser } from '../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  const user = await getAuthedUser(request, env)
  if (!user) return json({ error: 'Not signed in' }, 401)

  await env.DB.prepare('DELETE FROM listings WHERE user_id = ?').bind(user.id).run()

  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
  await clerk.users.deleteUser(user.id)

  return json({ deleted: true })
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
