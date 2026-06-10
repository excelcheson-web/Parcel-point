export const runtime = 'edge'

import { NextResponse } from 'next/server'

const RECIPIENT = 'hello@parcelpointlogistics.com'
const SENDER    = 'Parcel Point <hello@parcelpointlogistics.com>'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>')
}

function buildEmailHtml(fields: {
  name: string; email: string; phone: string; subject: string; message: string
}) {
  const { name, email, phone, subject, message } = fields
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
  <div style="background:#7C3AED;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:20px">New Contact Form Submission</h2>
    <p style="color:#e9d5ff;margin:4px 0 0;font-size:14px">Parcel Point Website</p>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px">
    <table style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:8px 0;font-weight:bold;width:110px;vertical-align:top;color:#374151">Name</td>
        <td style="padding:8px 0;color:#1f2937">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:bold;vertical-align:top;color:#374151">Email</td>
        <td style="padding:8px 0"><a href="mailto:${escapeHtml(email)}" style="color:#7C3AED">${escapeHtml(email)}</a></td>
      </tr>
      ${phone ? `<tr>
        <td style="padding:8px 0;font-weight:bold;vertical-align:top;color:#374151">Phone</td>
        <td style="padding:8px 0;color:#1f2937">${escapeHtml(phone)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:8px 0;font-weight:bold;vertical-align:top;color:#374151">Subject</td>
        <td style="padding:8px 0;color:#1f2937">${escapeHtml(subject || '(none)')}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:bold;vertical-align:top;color:#374151">Message</td>
        <td style="padding:8px 0;color:#1f2937;line-height:1.6">${escapeHtml(message)}</td>
      </tr>
    </table>
  </div>
  <p style="color:#9ca3af;font-size:12px;margin-top:16px">Reply directly to this email to respond to the customer.</p>
</body>
</html>`
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const name    = String(body.name    ?? '').trim()
  const email   = String(body.email   ?? '').trim()
  const phone   = String(body.phone   ?? '').trim()
  const subject = String(body.subject ?? '').trim()
  const message = String(body.message ?? '').trim()

  if (!name)                return NextResponse.json({ error: 'Name is required.'                    }, { status: 422 })
  if (!email)               return NextResponse.json({ error: 'Email is required.'                   }, { status: 422 })
  if (!isValidEmail(email)) return NextResponse.json({ error: 'A valid email address is required.'  }, { status: 422 })
  if (!message)             return NextResponse.json({ error: 'Message is required.'                 }, { status: 422 })
  if ([name, email, message].join('').length < 15)
    return NextResponse.json({ error: 'Submission appears to be empty or spam.' }, { status: 422 })

  let resendRes: Response
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SENDER,
        to: [RECIPIENT],
        reply_to: email,
        subject: subject ? `Contact: ${subject}` : `Contact from ${name}`,
        html: buildEmailHtml({ name, email, phone, subject, message }),
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Network error sending email.' }, { status: 502 })
  }

  if (!resendRes.ok) {
    const detail = await resendRes.text().catch(() => '')
    console.error('[contact] Resend error', resendRes.status, detail)
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
