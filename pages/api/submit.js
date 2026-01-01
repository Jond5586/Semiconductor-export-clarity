import fetch from 'node-fetch';
import { createSupabaseServerClient } from '../../lib/supabaseServer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name = '', email = '', requestText = '', recaptchaToken = '' } = req.body || {};
  if (!email || !requestText) return res.status(400).json({ error: 'Missing required fields' });

  // 1) Verify reCAPTCHA if configured
  const recaptchaSecret = process.env.RECAPTCHA_SECRET;
  if (recaptchaSecret) {
    if (!recaptchaToken) return res.status(400).json({ error: 'reCAPTCHA token missing' });
    try {
      const vRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(recaptchaSecret)}&response=${encodeURIComponent(recaptchaToken)}`
      });
      const vJson = await vRes.json();
      // If v3, check score; if v2, check success
      const scoreOk = ('score' in vJson) ? (vJson.score >= 0.5) : vJson.success;
      if (!scoreOk) {
        console.warn('reCAPTCHA failed', vJson);
        return res.status(403).json({ error: 'reCAPTCHA verification failed' });
      }
    } catch (err) {
      console.error('reCAPTCHA verification error', err);
      return res.status(502).json({ error: 'reCAPTCHA verification error' });
    }
  }

  // 2) Persist initial submission with status 'processing'
  const supa = createSupabaseServerClient();
  let submission = null;
  try {
    const insert = await supa.from('submissions').insert({ name, email, request_text: requestText, status: 'processing' }).select().single();
    submission = insert.data;
  } catch (err) {
    console.error('Supabase insert failed', err);
    // Continue; we still attempt to process but warn in logs
  }

  try {
    // 3) Call OpenAI
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a precise assistant that prepares a concise, actionable response to the user request.' },
          { role: 'user', content: `Name: ${name}\nEmail: ${email}\nRequest: ${requestText}\n\nProvide the requested information clearly and concisely.` }
        ],
        max_tokens: 800
      })
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      console.error('OpenAI call failed:', text);
      throw new Error('AI provider error');
    }

    const aiJson = await openaiRes.json();
    const aiResult = aiJson.choices?.[0]?.message?.content || JSON.stringify(aiJson);

    // 4) Update DB with result if record exists
    if (submission && submission.id) {
      try {
        await supa.from('submissions').update({ ai_result: aiResult, status: 'done' }).eq('id', submission.id);
      } catch (e) {
        console.error('Supabase update failed', e);
      }
    }

    // 5) Send email via SendGrid if configured
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM;
    if (sendgridApiKey && fromEmail) {
      const emailBody = {
        personalizations: [{ to: [{ email }], subject: process.env.EMAIL_SUBJECT || 'Your request results' }],
        from: { email: fromEmail },
        content: [{ type: 'text/plain', value: `Hello ${name || ''},\n\nHere are the results for your request:\n\n${aiResult}\n\n—\nPowered by Semiconductor-export-clarity` }]
      };

      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sendgridApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(emailBody)
      });

      if (!sgRes.ok) {
        const errText = await sgRes.text();
        console.error('SendGrid error:', errText);
      }
    } else {
      console.warn('SendGrid not configured; skipping email send');
    }

    const preview = aiResult.slice(0, 1000);
    return res.status(200).json({ ok: true, resultPreview: preview, submissionId: submission?.id || null });
  } catch (err) {
    console.error('Processing failed', err);
    // Mark submission as failed in DB
    if (submission && submission.id) {
      try { await supa.from('submissions').update({ status: 'failed' }).eq('id', submission.id); } catch (e) {}
    }
    return res.status(500).json({ error: 'Processing failed' });
  }
}
