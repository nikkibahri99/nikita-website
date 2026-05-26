module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, message } = req.body || {};

  // 400 = missing fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  // 503 = key not configured
  if (!RESEND_API_KEY) {
    return res.status(503).json({ error: 'Email service not configured' });
  }

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#F7F4EE;border-radius:8px;">
      <h2 style="color:#1C3A2E;margin-top:0;">New message from your portfolio</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:#666;width:120px;">Name</td><td style="padding:8px 0;color:#1C3A2E;font-weight:600;">${escapeHtml(name)}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;color:#1C3A2E;"><a href="mailto:${escapeHtml(email)}" style="color:#C9A035;">${escapeHtml(email)}</a></td></tr>
        ${company ? `<tr><td style="padding:8px 0;color:#666;">Company</td><td style="padding:8px 0;color:#1C3A2E;">${escapeHtml(company)}</td></tr>` : ''}
      </table>
      <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;">
      <p style="color:#1C3A2E;white-space:pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `;

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <onboarding@resend.dev>',
        to: ['nikkibahri99@gmail.com'],
        reply_to: email,
        subject: `New message from ${name} — nikita-website`,
        html,
      }),
    });
  } catch (err) {
    // 504 = couldn't reach Resend at all (network error)
    return res.status(504).json({ error: 'Could not reach email provider', detail: err.message });
  }

  const data = await response.json();

  if (response.ok) {
    return res.status(200).json({ success: true });
  }

  // 502 = Resend reachable but rejected the request — include their error message
  return res.status(502).json({ error: 'Resend rejected request', resend: data });
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
