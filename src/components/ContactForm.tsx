'use client';

import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

type EmailSendError = {
  text?: string;
  message?: string;
};

function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as EmailSendError;
    return candidate.text || candidate.message || 'Please try again later.';
  }

  return 'Please try again later.';
}

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  // Initialize EmailJS with public key when component mounts
  useEffect(() => {
    emailjs.init('_SrHHxPIUy05AU7dn');
    console.log('EmailJS initialized');
  }, []);

  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const templateParams = {
      name: formData.get('user_name'),
      user_email: formData.get('user_email'),
      title: formData.get('subject'),
      message: formData.get('message'),
    };

    console.log('Sending email with params:', templateParams);

    try {
      // 1. Send Notification to Admin (Parcel Point)
      console.log('Sending admin notification...');
      const adminResponse = await emailjs.send(
        'service_ldkowmp', 
        'template_piekyck', 
        templateParams
      );
      console.log('Admin email sent:', adminResponse);

      // 2. Send Auto-Reply to Customer
      console.log('Sending customer auto-reply...');
      const customerResponse = await emailjs.send(
        'service_ldkowmp', 
        'template_hn537xj', 
        templateParams
      );
      console.log('Customer email sent:', customerResponse);

      setStatus('Success! Your message has been sent and a confirmation email is on its way.');
      form.reset();
    } catch (error: unknown) {
      console.error('EmailJS Error:', error);
      const errorMessage = getErrorMessage(error);
      console.error('Error details:', errorMessage);
      setStatus(`Oops! Something went wrong: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl">
      <form onSubmit={handleSendEmail} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Full Name</label>
          <input 
            name="user_name" 
            type="text" 
            required 
            className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[#7C3AED] outline-none transition text-white placeholder-white/50" 
            placeholder="John Doe" 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Email Address</label>
          <input 
            name="user_email" 
            type="email" 
            required 
            className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[#7C3AED] outline-none transition text-white placeholder-white/50" 
            placeholder="john@example.com" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Subject</label>
          <input 
            name="subject" 
            type="text" 
            required 
            className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[#7C3AED] outline-none transition text-white placeholder-white/50" 
            placeholder="Shipping Inquiry" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Message</label>
          <textarea 
            name="message" 
            required 
            className="w-full p-3 h-32 rounded-lg bg-black/20 border border-white/10 focus:border-[#7C3AED] outline-none transition text-white placeholder-white/50" 
            placeholder="Tell us more about your logistics needs..." 
          />
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-3 px-6 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Send Message'}
        </button>

        {status && (
          <p className={`mt-4 text-center text-sm font-semibold ${status.includes('Success') ? 'text-[#7C3AED]' : 'text-red-400'}`}>
            {status}
          </p>
        )}
      </form>
    </section>
  );
}
