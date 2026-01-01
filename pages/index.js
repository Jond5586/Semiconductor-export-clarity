import { useState } from 'react';
import dynamic from 'next/dynamic';
const Clock = dynamic(() => import('../components/Clock'), { ssr: false });

export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [requestText, setRequestText] = useState('');
  const [status, setStatus] = useState('');
  const [sentResult, setSentResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('Preparing...');
    setSentResult(null);

    try {
      let recaptchaToken = null;
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha) {
        setStatus('Verifying reCAPTCHA...');
        await new Promise((resolve) => window.grecaptcha.ready(resolve));
        recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'submit' });
      }

      setStatus('Sending request...');
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, requestText, recaptchaToken })
      });

      const json = await res.json();
      if (!res.ok) {
        setStatus('Error: ' + (json?.error || res.statusText));
        return;
      }

      setStatus('Request accepted. You will receive an email with results shortly.');
      setSentResult(json?.resultPreview || null);
      setName(''); setEmail(''); setRequestText('');
    } catch (err) {
      setStatus('Network error: ' + String(err));
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 920, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Semiconductor Export Clarity</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Current time in several zones</h2>
        <Clock />
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Submit a request</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8, maxWidth: 680 }}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <label>
            Describe your request
            <textarea value={requestText} onChange={(e) => setRequestText(e.target.value)} rows={6} required />
          </label>

          <button type="submit">Send request (AI will process & email results)</button>
        </form>
        <div style={{ marginTop: 12, color: '#333' }}>{status}</div>
        {sentResult && (
          <div style={{ marginTop: 12, background: '#f8f8f8', padding: 10, borderRadius: 6 }}>
            <strong>Preview of result:</strong>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{sentResult}</pre>
          </div>
        )}
      </section>

      <section>
        <h3>Notes</h3>
        <ul>
          <li>The server will verify reCAPTCHA, call an LLM to process the request, store the submission & result in Supabase, and then send an email via SendGrid.</li>
          <li>Set the required environment variables before deploy (see README).</li>
        </ul>
      </section>

      {/* Load reCAPTCHA script if site key is present */}
      {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
        <script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}></script>
      )}
    </main>
  );
}
