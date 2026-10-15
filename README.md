# Platinum Landing Page

Editable HTML, CSS, and JavaScript assembled from Bilal's October 14 supplied build, meeting feedback, screen recording, and Platinum's September 2026 brand book.

## Files

- `index.html`: landing page and blank Google tag insertion comment.
- `styles.css`: responsive layout, brand colors, Anton and Inter typography.
- `app.js`: callback form, session-scoped campaign attribution, optional tracking events.
- `api/lead.js`: Vercel server function that emails callback requests.
- `thanks/`: confirmation page; direct visits show a neutral contact page.
- `assets/`: supplied imagery and logos, self-hosted fonts and licenses.
- `vercel.json`: static hosting, function routing, preview noindex headers.

No build command or npm dependencies are required. Deploy this folder to Vercel as an Other/static project. The Node function is required; opening the HTML file from disk or uploading only static files will not process leads.

## Lead emails

Jack specified **office@cleanmastercarpetcleaning.com** as the recipient for these Platinum leads. The fixed server-side destination is FormSubmit's AJAX endpoint for that inbox. The subject is **Platinum | New Water Damage Callback Request**. Visitors cannot override the recipient, subject, or add CC addresses.

Emails contain name, callback number, property ZIP, damage type, optional details, page URL, timestamp, submission ID, and available gclid/gbraid/wbraid/UTM values. The website's displayed contact number remains Platinum's real line: **817-929-4119**.

FormSubmit may require a one-time activation email to be confirmed in the receiving inbox. Before sending ad traffic, send an approved, clearly labeled test through the deployed page, confirm any activation email, submit again if requested, and verify the actual email arrived. No real email was sent during automated QA. An API acceptance response is not proof of inbox delivery.

The form reports success only after FormSubmit returns a successful acceptance response. Explicit activation messages, failed responses, and network errors retain the visitor's details and display a phone fallback. A retry after an uncertain network failure can produce a duplicate email; use the submission ID to identify duplicates. Spam protection includes validation and a honeypot; FormSubmit applies its own limits. Its AJAX integration does not show an interactive CAPTCHA.

Documentation: https://formsubmit.co/documentation and https://formsubmit.co/ajax-documentation

## Google tag: intentionally blank

No Google tag, GTM container, GA4 measurement ID, Google Ads ID, Meta pixel, Hyros script, or call-tracking number is installed. Add the correct approved tag at the comment in `index.html` and `thanks/index.html`.

Optional browser events are available for Bilal to connect:

- `platinum:cta-click`: `detail.type` and `detail.placement`. A phone tap is not a completed call.
- `platinum:lead-submitted`: emitted after server acceptance, with a submission ID and timestamp; no name, phone, or other customer details.

Prefer the confirmed form event over counting every thanks-page visit. The page retains campaign attribution in session storage for this tab and includes it with the form. It does not send Google analytics requests.

## Launch

1. Review the desktop and mobile preview.
2. Complete the inbox activation and approved delivery test described above.
3. Add Bilal's tracking and verify conversions. The phone links use the real Platinum line until an approved tracking setup is added.
4. Confirm the custom domain and DNS with Jack. This package does not change DNS, ads, or the live main website.
5. Review the privacy policy for the final form processing setup. Keep noindex for a paid-only landing page, or deliberately remove the HTML, header, and robots restrictions if indexing is desired.
6. Publish only after Jack approves the reviewed page.

The supplied imagery is illustrative. The Google review count and customer quote came from platinumsg.com on October 14, 2026; the quote is explicitly identified as a carpet-cleaning customer.

## Validation

Checked at 320, 390, 768, and 1440 pixels: no horizontal overflow or broken images, correct phone links, red CTAs, no page errors or tracking requests. Form validation, failure recovery, accepted submissions, campaign attribution, and direct confirmation-page visits were checked using mocked submissions. Backend tests verify the fixed email destination, subject, rejected inputs, provider failures, and activation handling. An actual inbox delivery test remains required.
