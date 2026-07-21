// POST /api/payfast-notify
// This is PayFast's server calling US — not the browser. It fires once
// for the first payment, then again automatically on every renewal.
// This is the ONLY place subscription status should be turned on/off;
// the return_url the browser sees after paying is just cosmetic.
import { createHash } from 'node:crypto'
import { createClerkClient } from '@clerk/backend'
import { buildSignature, PLAN_PRICING } from '../_shared/payfast.js'

export async function onRequestPost({ request, env }) {
  // Always read the body first so we can respond 200 even on rejection —
  // PayFast retries aggressively if it doesn't get a 200, which just
  // creates noise once we've already decided a notification is invalid.
  const raw = await request.text()
  const params = new URLSearchParams(raw)
  const pfData = Object.fromEntries(params.entries())

  try {
    // 1. Check the signature matches what we'd generate ourselves.
    const { signature: expectedSignature } = buildSignature(pfData, env.PAYFAST_PASSPHRASE, { createHash })
    if (expectedSignature !== pfData.signature) {
      console.error('PayFast ITN: signature mismatch')
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
      console.error('PayFast ITN: not confirmed by PayFast', validateText)
      return new Response('not valid', { status: 200 })
    }

    // 3. Sanity-check the amount against what that plan should cost, so
    // a tampered notification can't grant access at the wrong price.
    const planId = pfData.custom_str2
    const plan = PLAN_PRICING[planId]
    const userId = pfData.custom_str1
    if (!plan || !userId) {
      console.error('PayFast ITN: missing plan/user reference')
      return new Response('missing reference', { status: 200 })
    }
    if (Number(pfData.amount_gross || pfData.amount).toFixed(2) !== Number(plan.amount).toFixed(2)) {
      console.error('PayFast ITN: amount mismatch')
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
    } else if (status === 'CANCELLED' || status === 'FAILED') {
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          subscriptionStatus: 'inactive',
          subscriptionPlan: planId,
          subscriptionUpdatedAt: new Date().toISOString(),
        },
      })
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('PayFast ITN error', err)
    // Still 200 — PayFast will just keep retrying otherwise, and the
    // failure is already logged for you to check in Cloudflare.
    return new Response('error logged', { status: 200 })
  }
}
