'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ContactForm() {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (data: FormData): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!String(data.get('name') ?? '').trim()) errs.name = 'Name is required.';
    const email = String(data.get('email') ?? '').trim();
    if (!email) errs.email = 'Email is required.';
    else if (!isValidEmail(email)) errs.email = 'Enter a valid email address.';
    if (!String(data.get('message') ?? '').trim()) errs.message = 'Message is required.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const errs = validate(data);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          phone: String(data.get('phone') ?? '').trim(),
          subject: String(data.get('subject') ?? '').trim(),
          message: String(data.get('message') ?? '').trim(),
        }),
      });

      if (res.ok) {
        setStatus('success');
        form.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const inputClass =
    'w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[#7C3AED] outline-none transition text-white placeholder-white/50';
  const errorClass = 'mt-1 text-xs text-red-400';

  return (
    <section className="max-w-2xl mx-auto p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Full Name <span className="text-red-400">*</span></label>
            <input
              name="name"
              type="text"
              autoComplete="name"
              className={inputClass}
              placeholder="John Doe"
              onChange={() => errors.name && setErrors((p) => ({ ...p, name: '' }))}
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-white">Phone <span className="text-white/40 font-normal">(optional)</span></label>
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              className={inputClass}
              placeholder="+1 555 000 0000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Email Address <span className="text-red-400">*</span></label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            placeholder="john@example.com"
            onChange={() => errors.email && setErrors((p) => ({ ...p, email: '' }))}
          />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Subject</label>
          <input
            name="subject"
            type="text"
            className={inputClass}
            placeholder="Shipping Inquiry"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Message <span className="text-red-400">*</span></label>
          <textarea
            name="message"
            className={`${inputClass} h-32`}
            placeholder="Tell us more about your logistics needs..."
            onChange={() => errors.message && setErrors((p) => ({ ...p, message: '' }))}
          />
          {errors.message && <p className={errorClass}>{errors.message}</p>}
        </div>

        <p className="text-xs text-white/40 leading-relaxed">
          By submitting this form you agree to our{' '}
          <Link href="/privacy" className="text-[#A855F7]/80 hover:text-[#A855F7] underline transition-colors">
            Privacy Policy
          </Link>
          . We will only use your details to respond to your enquiry and will never share them with third parties.
        </p>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-3 px-6 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'submitting' ? 'Sending…' : 'Send Message'}
        </button>

        {status === 'success' && (
          <p className="mt-2 text-center text-sm font-semibold text-green-400">
            Thank you. Your message has been sent successfully.
          </p>
        )}
        {status === 'error' && (
          <p className="mt-2 text-center text-sm font-semibold text-red-400">
            Sorry, your message could not be sent. Please try again.
          </p>
        )}
      </form>
    </section>
  );
}
