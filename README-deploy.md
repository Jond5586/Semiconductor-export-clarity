# Deploying to Vercel — AI processing, email, Supabase, reCAPTCHA

This branch adds:
- Multi-timezone clock with add/remove UI (persisted in localStorage)
- A form that is processed by an LLM and emailed via SendGrid
- Persistent storage of submissions & results in Supabase
- reCAPTCHA verification (v2 or v3 supported)

Required environment variables (set in Vercel Project → Settings → Environment Variables)
- OPENAI_API_KEY — OpenAI API key
- OPENAI_MODEL — optional, default 'gpt-4o-mini'
- SENDGRID_API_KEY — SendGrid API key
- SENDGRID_FROM — verified sender address in SendGrid
- EMAIL_SUBJECT — optional default subject for emails
- SUPABASE_URL — Supabase project URL
- SUPABASE_SERVICE_KEY — Supabase service role key (server-side only)
- NEXT_PUBLIC_RECAPTCHA_SITE_KEY — (optional) Google reCAPTCHA site key (v3 recommended)
- RECAPTCHA_SECRET — (optional) reCAPTCHA secret (server)

Supabase setup
1. Create a Supabase project.
2. Create a table `submissions` with at minimum these columns:
   - id (uuid or bigint) primary key
   - name text
   - email text
   - request_text text
   - ai_result text
   - status text
   - created_at timestamptz default now()
3. Copy SUPABASE_URL and SUPABASE_SERVICE_KEY into Vercel env vars.

reCAPTCHA
- This branch supports Google reCAPTCHA v3 (recommended) or v2 tokens. Set NEXT_PUBLIC_RECAPTCHA_SITE_KEY in Vercel to enable the client-side script; set RECAPTCHA_SECRET on the server to verify.
- The code checks for a score >= 0.5 for v3. Adjust as needed.

Deploy steps
1. Push branch `add/vercel-ai-email-clock` and open a PR to Main (the branch already exists in this repo).
2. In Vercel, add environment variables listed above.
3. Deploy and test the form. For local testing, create a `.env.local` with the same variables.

Security & production notes
- Use Supabase service role key only server-side (do not expose it in client). Vercel environment variables marked as "Environment Variable" will keep them secret.
- Add rate-limiting and stronger anti-abuse protections (e.g., recaptcha + request quotas) to protect from spam and AI cost abuse.
- Consider adding a background worker or queue for long-running AI tasks.

---
