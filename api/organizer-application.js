import { formidable } from 'formidable';
import { readFile } from 'node:fs/promises';

export const config = { api: { bodyParser: false } };

const INBOX = 'thecodesocietyofficial@gmail.com';
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const first = value => Array.isArray(value) ? value[0] : value;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return res.status(503).json({ error: 'The application form is not configured yet. Please contact us by email instead.' });
  }

  const form = formidable({
    multiples: false,
    maxFileSize: 8 * 1024 * 1024,
    maxTotalFileSize: 8 * 1024 * 1024,
    allowEmptyFiles: false,
  });

  let fields, files;
  try {
    [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (error, parsedFields, parsedFiles) => error ? reject(error) : resolve([parsedFields, parsedFiles]));
    });
  } catch (error) {
    const tooLarge = error?.code === 1009 || /maxFileSize|maxTotalFileSize/i.test(error?.message || '');
    return res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? 'Resume must be 8 MB or smaller.' : 'We could not read your application. Check the file and try again.' });
  }

  if (first(fields.website)) return res.status(200).json({ ok: true });
  const required = ['fullName', 'email', 'phone', 'university', 'year', 'department', 'linkedin', 'role', 'fit'];
  for (const key of required) {
    if (!String(first(fields[key]) || '').trim()) return res.status(400).json({ error: 'Please complete all required fields.' });
  }

  const resume = first(files.resume);
  if (!resume?.filepath || !resume.originalFilename) return res.status(400).json({ error: 'Please attach your resume.' });
  const allowed = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
  if (!allowed.has(resume.mimetype)) return res.status(400).json({ error: 'Resume must be a PDF, DOC, or DOCX file.' });

  try {
    const attachment = (await readFile(resume.filepath)).toString('base64');
    const value = key => String(first(fields[key]) || '').trim();
    const rows = [
      ['Full name', value('fullName')],
      ['Email', value('email')],
      ['Phone', value('phone')],
      ['University', value('university')],
      ['Year of study', value('year')],
      ['Department', value('department')],
      ['LinkedIn', value('linkedin')],
      ['Portfolio', value('portfolio') || 'Not provided'],
      ['Role', value('role')],
      ['Why they fit', value('fit')]
    ];
    const html = '<h2>New organizer application — The Code Society</h2><table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ddd">' +
      rows.map(([label, content]) => '<tr><th align="left">' + escapeHtml(label) + '</th><td>' + escapeHtml(content).replace(/\n/g, '<br>') + '</td></tr>').join('') +
      '</table><p>Resume attached: ' + escapeHtml(resume.originalFilename) + '</p>';

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [INBOX],
        reply_to: value('email'),
        subject: 'Organizer application: ' + value('fullName') + ' — ' + value('role'),
        html,
        attachments: [{ filename: resume.originalFilename.replace(/[\r\n"]/g, '_'), content: attachment }]
      })
    });
    if (!emailResponse.ok) {
      const detail = await emailResponse.text();
      console.error('Resend rejected organizer application:', detail);
      return res.status(502).json({ error: 'We could not send your application right now. Please try again later.' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Organizer application error:', error);
    return res.status(500).json({ error: 'Something went wrong while sending your application. Please try again.' });
  }
}
