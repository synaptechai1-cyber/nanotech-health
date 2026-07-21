// POST /api/payfast-notify
// This is PayFast's server calling US — not the browser. It fires once
// for the first payment, then again automatically on every renewal.
// This is the ONLY place subscription status should be turned on/off;
// the return_url the browser sees after paying is just cosmetic.
import { createHash } from 'node:crypto'
import { createClerkClient } from '@clerk/backend'
import { buildSignature, PLAN_PRICING } from '../_shared/payfast.js'

// Logs every ITN outcome to D1 so it can be checked from the D1 Console
// without needing paid Cloudflare log access:
//   SELECT * FROM itn_log ORDER BY created_at DESC LIMIT 10;
async function logITN(env, outcome, detail) {
  try {
    await env.DB.prepare(
      `INSERT INTO itn_log (id, created_at, outcome, detail) VALUES (?, ?, ?, ?)`
    ).bind(crypto.randomUUID(), new Date().toISOString(), outcome, detail || '').run()
  } catch (e) {
    // Never let logging itself break ITN handling.
  }
}

export async function onRequestPost({ request, env }) {
  // Always read the body first so we can respond 200 even on rejection —
  // PayFast retries aggressively if it doesn't get a 200, which just
  // creates noise once we've already decided a notification is invalid.
  const raw = await request.text()
  const params = new URLSearchParams(raw)
  const pfData = Object.fromEntries(params.entries())

  await logITN(env, 'received', raw)

  try {
    // 1. Check the signature matches what we'd generate ourselves.
    const { signature: expectedSignature } = buildSignature(pfData, env.PAYFAST_PASSPHRASE, { createHash })
    if (expectedSignature !== pfData.signature) {
      await logITN(env, 'signature_mismatch', `expected=${expectedSignature} got=${pfData.signature}`)
      return new Response('invalid signature', { status: 200 })
    }

    // 2. Ask PayFast to confirm this notification is genuinely theirs
    // (protects against a spoofed request that happens to guess a
    // correct-looking signature).
    const host = env.PAYFAST_MODE === 'live' ? 'www.payfast.co.za' : 'sandbox.payfast.co.za'
    const validateRes = await fetch(`https://${host}/eng/query/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: raw,
    })
    const validateText = (await validateRes.text()).trim()
    if (validateText !== 'VALID') {
      await logITN(env, 'not_validated', `payfast responded: ${validateText}`)
      return new Response('not valid', { status: 200 })
    }

    // 3. Sanity-check the amount against what that plan should cost, so
    // a tampered notification can't grant access at the wrong price.
    const planId = pfData.custom_str2
    const plan = PLAN_PRICING[planId]
    const userId = pfData.custom_str1
    if (!plan || !userId) {
      await logITN(env, 'missing_reference', `planId=${planId} userId=${userId}`)
      return new Response('missing reference', { status: 200 })
    }
    if (Number(pfData.amount_gross || pfData.amount).toFixed(2) !== Number(plan.amount).toFixed(2)) {
      await logITN(env, 'amount_mismatch', `got=${pfData.amount_gross || pfData.amount} expected=${plan.amount}`)
      return new Response('amount mismatch', { status: 200 })
    }

    // 4. Update the user's subscription status in Clerk.
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY })
    const status = pfData.payment_status // COMPLETE | CANCELLED | FAILED | PENDING

    if (status === 'COMPLETE') {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          subscriptionStatus: 'active',
          subscriptionPlan: planId,
          subscriptionUpdatedAt: new Date().toISOString(),
        },
      })
      await logITN(env, 'activated', `userId=${userId} plan=${planId}`)
    } else if (status === 'CANCELLED' || status === 'FAILED') {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          subscriptionStatus: 'inactive',
          subscriptionPlan: planId,
          subscriptionUpdatedAt: new Date().toISOString(),
        },
      })
      await logITN(env, 'deactivated', `userId=${userId} status=${status}`)
    } else {
      await logITN(env, 'ignored_status', `status=${status}`)
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    await logITN(env, 'exception', String(err.stack || err))
    // Still 200 — PayFast will just keep retrying otherwise, and the
    // failure is already logged in itn_log for you to check.
    return new Response('error logged', { status: 200 })
  }
}
