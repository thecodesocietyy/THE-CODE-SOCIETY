const INBOX = 'thecodesocietyoffical@gmail.com';
const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clean = value => typeof value === 'string' ? value.trim().slice(0, 4000) : '';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!process.env.RESEND_API_KEY) {
    return res.status(503).json({ error: 'The sponsorship form is temporarily unavailable. Please email anjanibeesu@gmail.com.' });
  }

  const body = req.body || {};
  if (clean(body.website)) return res.status(200).json({ ok: true });

  const name = clean(body.name);
  const sponsorType = clean(body.sponsorType);
  const sponsorshipType = clean(body.sponsorshipType);
  const otherDetails = clean(body.otherDetails);
  const extra = clean(body.extra);
  if (!name || !['Individual sponsorship', 'Company sponsorship'].includes(sponsorType) ||
      !['Financial contribution / cash sponsorship', 'Provide company services or products free to winners', 'Something else'].includes(sponsorshipType) ||
      (sponsorshipType === 'Something else' && !otherDetails)) {
    return res.status(400).json({ error: 'Please complete the required fields.' });
  }

  const rows = [
    ['Name', name],
    ['Sponsorship type', sponsorType],
    ['Proposed support', sponsorshipType],
    ['Other details', otherDetails || 'Not applicable'],
    ['Additional information', extra || 'Not provided']
  ];
  const html = '<h2>New sponsorship enquiry — The Code Society</h2><table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ddd">' +
    rows.map(([label, value]) => '<tr><th align="left">' + escapeHtml(label) + '</th><td>' + escapeHtml(value).replace(/\n/g, '<br>') + '</td></tr>').join('') +
    '</table>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'The Code Society <onboarding@resend.dev>',
        to: [INBOX],
        subject: 'Sponsorship enquiry: ' + name,
        html
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error('Resend rejected sponsorship enquiry:', detail);
      return res.status(502).json({ error: 'We could not send your enquiry right now. Please try again later, or email anjanibeesu@gmail.com.' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Sponsorship enquiry error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please email anjanibeesu@gmail.com.' });
  }
}