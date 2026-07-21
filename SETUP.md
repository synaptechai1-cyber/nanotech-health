# NanoTech Health — Setup Guide (fresh build)

This is a clean rebuild. The app itself is unchanged — same design, same
pages. What's different: a hardened Payfast integration (correct field
order, ASCII-only values, no recurring-billing complexity), a fixed SPA
routing setup, and a debug mode that doesn't require a paid Cloudflare plan.

Stack: **Clerk** (sign in/up) + **Cloudflare D1** (stores marketplace
listings) + **Cloudflare Pages Functions** (the backend — lives in this same
repo) + **Payfast** (payment).

Go through this slowly, one step at a time, in order. Nothing here requires
touching code — it's all clicking through dashboards.

---

## Step 1 — Create the GitHub repo

1. Go to https://github.com/new
2. Name it whatever you like (e.g. `nanotech-health`), keep it Private or
   Public, don't add a README/gitignore (we already have files).
3. Unzip the file I gave you on your computer.
4. On your new repo's page: **Add file → Upload files** → drag in *all* the
   files and folders from the unzipped folder (not the zip itself) → commit.

---

## Step 2 — Clerk (sign in / sign up)

1. Go to https://dashboard.clerk.com → **Create application**.
2. Give it a name, leave the default sign-in options (email is enough).
3. Left sidebar → **API Keys** → you'll see two keys:
   - **Publishable key** (starts `pk_test_...`)
   - **Secret key** (starts `sk_test_...`)
   Keep this tab open — you'll copy these into Cloudflare in Step 5.
4. Left sidebar → look for **Paths** (sometimes under "Customize session" or
   "Account portal") → set:
   - Sign-in path: `/login`
   - Sign-up path: `/signup`
5. (Optional, nice to have) **User & Authentication → Restrictions** → turn
   on "Allow users to delete their own account."

---

## Step 3 — Cloudflare Pages project

1. Go to https://dash.cloudflare.com → **Workers & Pages** → **Create** →
   **Pages** tab → **Connect to Git**.
2. Choose the GitHub repo you created in Step 1.
3. Build settings:
   - Framework preset: **Vite** (or leave as "None" and set manually)
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Click **Save and Deploy**. It'll fail on this first attempt (no env vars
   or database yet) — that's expected, keep going.

---

## Step 4 — Cloudflare D1 (database)

The app only stores one thing in the database: marketplace **listings**.
Everything about the pharmacy's own profile and subscription status is
stored on the Clerk user itself, not in this database.

1. **Workers & Pages** left sidebar → **D1 SQL Database** → **Create database**.
2. Name it e.g. `nanotech-health-db` → Create.
3. Click into it → **Console** tab. Paste in the entire contents of
   `schema.sql` from this repo → **Execute**. This creates the `listings`
   table.
4. Go to your **Pages project** (from Step 3) → **Settings** → **Functions**
   → scroll to **D1 database bindings** → **Add binding**:
   - Variable name: `DB` (exactly this — the code expects `env.DB`)
   - D1 database: `nanotech-health-db`
5. Do this for **both** Production and Preview (separate lists).

---

## Step 5 — Environment variables

Still in your Pages project: **Settings → Environment variables**. Add each
of these, for **both** Production and Preview:

| Variable | Value | Mark as secret? |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | from Step 2 | No |
| `CLERK_SECRET_KEY` | from Step 2 | **Yes** |
| `PAYFAST_MERCHANT_ID` | `10000100` (sandbox test value) | **Yes** |
| `PAYFAST_MERCHANT_KEY` | `46f0cd694581a` (sandbox test value) | **Yes** |
| `PAYFAST_PASSPHRASE` | leave blank for now | **Yes** |
| `PAYFAST_MODE` | `sandbox` | No |
| `PAYFAST_DEBUG` | `true` | No |
| `SITE_URL` | your `*.pages.dev` URL (see below) | No |

**Type each value by hand rather than pasting where you can** — invisible
trailing spaces/newlines from copy-paste are a real, common cause of
Payfast signature mismatches, and this is the easiest way to rule that out
completely.

For `SITE_URL`: after Step 3's first deploy, Cloudflare gives your project a
URL like `https://nanotech-health-abc.pages.dev` — find it on the project's
overview page and use that (no trailing slash).

After saving all of these, go to **Deployments** → click the three dots on
the latest one → **Retry deployment** (env vars don't apply retroactively).

---

## Step 6 — First deploy check

Once it redeploys successfully, open the site. You should see the homepage.
Try:
1. **Sign up** with a real email (Clerk will send a verification code)
2. You'll land on the Account page — fill in pharmacy name, region, phone → Save
3. Go to **Marketplace** — should load (empty list, that's expected, no
   listings yet)
4. Go to **Subscription** → click **Upgrade to Monthly**

Because `PAYFAST_DEBUG=true`, step 4 will **pause** and show you a box with
a parameter string and signature instead of redirecting — this is
intentional, see Step 7.

---

## Step 7 — Confirming the Payfast signature is correct

1. With the debug box showing, copy the **parameter string** (click the
   text box, it auto-selects).
2. Go to https://developers.payfast.co.za → find their **Sandbox** docs →
   look for the **Signature Tool** section (lets you paste a parameter
   string and see what signature Payfast computes for it).
3. Paste the parameter string in. Compare the signature it gives you to the
   one shown in our debug box.
   - **They match?** The signing logic is correct. Click **Continue to
     PayFast checkout** in our debug box and complete a test payment with
     [Payfast's sandbox test card numbers](https://developers.payfast.co.za/docs#testing).
   - **They don't match?** Send me both signatures and the exact parameter
     string and I'll fix the precise issue — at that point we'd know for
     certain it's an encoding bug rather than a values/env-var issue.
4. Once a full test payment completes successfully (Payfast redirects you
   back and the Account page shows an active subscription), go back to
   Cloudflare env vars and either delete `PAYFAST_DEBUG` or set it to
   `false`, then redeploy. Checkout will go straight through after that.

---

## Step 8 — Going live (once everything above works)

1. Log into your real Payfast merchant account → **Settings** → copy your
   live Merchant ID and Merchant Key.
2. Optional but recommended: set a Passphrase there (Settings →
   Integration), and set the same value in `PAYFAST_PASSPHRASE` in
   Cloudflare — they must match exactly.
3. In Cloudflare, update `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`,
   `PAYFAST_PASSPHRASE` to your real values, and set `PAYFAST_MODE=live`.
4. Redeploy, do one small real test payment yourself to confirm end-to-end,
   then you're good to go live.

---

## If anything 404s or looks broken after deploy

Check that `npm run build` in your Cloudflare build log shows this exact
line near the end:
```
vite build && cp dist/index.html dist/404.html
```
That copy step is what makes page refreshes and Payfast's return redirect
work correctly. If it's missing, the `package.json` upload didn't take —
re-upload it.
