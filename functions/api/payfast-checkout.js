// POST /api/payfast-checkout
// Called by the logged-in user's browser when they click "Upgrade".
// Verifies their Clerk session, then returns a set of signed PayFast
// fields for the browser to auto-submit as a form POST to PayFast.
import { createHash } from 'node:crypto'
import { buildSignature, PLAN_PRICING } from '../_shared/payfast.js'
import { getAuthedUser } from '../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  try {
    const user = await getAuthedUser(request, env)
    if (!user) return json({ error: 'Not signed in' }, 401)
    if (!user.email) return json({ error: 'No email on account' }, 400)

    const { planId } = await request.json()
    const plan = PLAN_PRICING[planId]
    if (!plan) {
      return json({ error: 'Unknown plan' }, 400)
    }

    const siteUrl = (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
    const mPaymentId = `${user.id}-${planId}-${Date.now()}`

    // PayFast requires fields to appear in THEIR documented order when
    // building the signature — not just "any order, as long as it's
    // consistent." Mismatching this order is the #1 cause of "signature
    // does not match" errors. Official order: merchant details, buyer
    // details, then transaction details (incl. custom_str/int).
    //
    // One-time payment (no recurring/ad-hoc billing fields) — simpler to
    // test and doesn't require a passphrase or "Ad Hoc" billing enabled
    // on the PayFast account. Renewal is manual for now.
    const fields = {
      merchant_id: env.PAYFAST_MERCHANT_ID,
      merchant_key: env.PAYFAST_MERCHANT_KEY,
      return_url: `${siteUrl}/account?payment=success`,
      cancel_url: `${siteUrl}/subscription?payment=cancelled`,
      notify_url: `${siteUrl}/api/payfast-notify`,
      email_address: user.email,
      m_payment_id: mPaymentId,
      amount: plan.amount,
      item_name: plan.name,
      custom_str1: user.id, // lets the notify webhook know who paid
      custom_str2: planId,
    }

    const { signature, paramString } = buildSignature(fields, env.PAYFAST_PASSPHRASE, { createHash })
    fields.signature = signature

    const action = env.PAYFAST_MODE === 'live'
      ? 'https://www.payfast.co.za/eng/process'
      : 'https://sandbox.payfast.co.za/eng/process'

    const response = { action, fields }

    // Set PAYFAST_DEBUG=true as a Cloudflare env var to include the raw
    // parameter string in the response — lets you cross-check it against
    // PayFast's own Signature Tool (in their Sandbox docs) straight from
    // the browser Network tab, no paid log access required. Turn this
    // back off (delete the env var, or set it to anything else) once
    // checkout is confirmed working.
    if (env.PAYFAST_DEBUG === 'true') {
      response.debug = { paramString, signature }
    }

    return json(response)
  } catch (err) {
    const body = { error: 'Checkout failed', detail: String(err) }
    if (env.PAYFAST_DEBUG === 'true') body.stack = err.stack
    return json(body, 500)
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
