// Jack's requested recipient. Keep routing server-side so a visitor cannot change it.
// FormSubmit requires the receiving inbox to confirm activation before live use.
// No Google tag or analytics ID is installed.
const RECIPIENT = 'office@cleanmastercarpetcleaning.com';
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const reply = (status, error) => res.status(status).json({ ok: false, error });
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST'); return reply(405, 'method_not_allowed');
  }
  if (!(req.headers['content-type'] || '').startsWith('application/json')) return reply(415, 'json_required');
  if (req.headers.origin) {
    try {
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      if (new URL(req.headers.origin).host !== host) return reply(403, 'origin_not_allowed');
    } catch (_) { return reply(403, 'origin_not_allowed'); }
  }
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch (_) { return reply(400, 'invalid_request'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return reply(400, 'invalid_request');
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 16000) return reply(413, 'request_too_large');
  const clean = (key, max) => typeof body[key] === 'string' ? body[key].trim().slice(0, max) : '';
  if (clean('website', 200)) return reply(422, 'invalid_request');
  const name = clean('name', 100), phone = clean('phone', 25), zip = clean('zip', 20), damage = clean('damage', 100);
  const digits = phone.replace(/\D/g, '');
  const issues = ['Burst pipe or plumbing leak', 'Appliance or water heater leak', 'Storm or flood damage', 'Ceiling or roof leak', 'Sewage backup or overflow', 'Other / not sure'];
  if (!name || !/^(?:1)?\d{10}$/.test(digits) || !/^\d{5}$/.test(zip) || !issues.includes(damage)) return reply(422, 'invalid_fields');
  const id = clean('submission_id', 36);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)) return reply(422, 'invalid_submission_id');
  const endpoint = new URL('https://formsubmit.co/ajax/' + RECIPIENT);
  const payload = {
    submission_id: id, name, phone, zip, damage, message: clean('message', 2000),
    service: 'Water damage restoration', brand: 'Platinum Service Group',
    page: clean('page', 1000), consent: clean('consent', 200), received_at: new Date().toISOString(),
    _subject: 'Platinum | New Water Damage Callback Request',
    _template: 'table', _captcha: 'false'
  };
  for (const key of ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    payload[key] = clean(key, 500);
  }
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const upstream = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload), signal: controller.signal, redirect: 'error' });
    const receipt = await upstream.json();
    const accepted = receipt.success === true || receipt.success === 'true';
    // Activation emails are not customer-lead delivery. Do not report them as success.
    if (/activat|confirm.*email|verify.*email/i.test(String(receipt.message || ''))) return reply(503, 'inbox_activation_required');
    if (!upstream.ok || !accepted) return reply(502, 'intake_not_confirmed');
    return res.status(200).json({ ok: true });
  } catch (_) { return reply(502, 'intake_unavailable'); }
  finally { clearTimeout(timer); }
};
