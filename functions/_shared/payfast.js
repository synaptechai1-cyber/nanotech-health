// Shared PayFast helpers used by both the checkout and notify functions.
//
// IMPORTANT: PayFast's backend is PHP, and it builds its signature string
// using PHP's urlencode() — which is NOT the same as JavaScript's
// encodeURIComponent(). If you don't correct for this, signatures will
// randomly fail the moment a field contains a space, apostrophe, or a
// few other punctuation characters. phpUrlEncode() below patches those
// differences. Do not "simplify" this back to encodeURIComponent().
function phpUrlEncode(value) {
  return encodeURIComponent(String(value))
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E')
    .replace(/%20/g, '+')
}

// Builds the MD5 signature PayFast expects, and returns BOTH the
// signature and the exact parameter string it was built from — so
// callers can surface the parameter string for debugging without
// needing Cloudflare's (paid-tier) log streaming.
//
// `fields` must be a plain object (not FormData) with keys in the exact
// order they'll be sent — PayFast is order-sensitive, not alphabetical.
//
// Use this for the OUTGOING checkout request only. Fields we don't
// explicitly set (empty/undefined) are correctly left out entirely,
// since we control exactly what gets sent to PayFast in the first place.
export function buildSignature(fields, passphrase, cryptoModule) {
  let paramString = ''
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'signature') continue
    if (value !== undefined && value !== null && value !== '') {
      paramString += `${key}=${phpUrlEncode(String(value).trim())}&`
    }
  }
  paramString = paramString.slice(0, -1)
  if (passphrase) {
    paramString += `&passphrase=${phpUrlEncode(passphrase.trim())}`
  }
  const signature = cryptoModule.createHash('md5').update(paramString).digest('hex')
  return { signature, paramString }
}

// Use this for verifying an INCOMING ITN notification instead —
// PayFast's own reference validation script includes every field it
// sent, even ones that are empty strings (e.g. custom_str3, name_last),
// because it already baked them into the signature it's sending us.
// Skipping empty fields here (like the outgoing function correctly
// does) silently produces a different string and a mismatched hash.
// This matches PayFast's official PHP example line for line.
export function buildIncomingSignature(fields, passphrase, cryptoModule) {
  let paramString = ''
  for (const [key, value] of Object.entries(fields)) {
    if (key === 'signature') continue
    paramString += `${key}=${phpUrlEncode(String(value ?? ''))}&`
  }
  paramString = paramString.slice(0, -1)
  if (passphrase) {
    paramString += `&passphrase=${phpUrlEncode(passphrase.trim())}`
  }
  const signature = cryptoModule.createHash('md5').update(paramString).digest('hex')
  return { signature, paramString }
}

// Server-side source of truth for plan pricing — never trust a price
// sent from the browser. One-time payment (no recurring/ad-hoc billing
// fields) — simpler to test, and avoids PayFast's extra account
// requirements (mandatory passphrase, Ad Hoc billing enabled) for
// recurring subscriptions. Renewal is manual for now; can revisit later.
//
// Plain ASCII only in `name` — special characters like em-dashes are a
// common, easy-to-miss source of signature mismatches between JS and
// PHP encoding, so we just avoid them entirely here.
export const PLAN_PRICING = {
  monthly: { amount: '299.00', name: 'NanoTech Health Monthly Subscription' },
  annual: { amount: '2900.00', name: 'NanoTech Health Annual Subscription' },
}
