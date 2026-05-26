module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' });
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

  try {
    const response = await fetch('https://api.resend.com/emails', {
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

    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json();
    console.error('Resend error:', data);
    return res.status(500).json({ error: 'Failed to send email' });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
