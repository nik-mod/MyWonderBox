'use client';

import { useState } from 'react';
import { Check, Copy, Phone } from 'lucide-react';
import { previewPhone } from '@/lib/preview-copy';

export function ContactPhone() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(previewPhone.href.slice(4));
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="contact-phone-actions">
      <a className="button button-outline contact-phone" href={previewPhone.href}>
        <Phone size={19} aria-hidden="true" /> {previewPhone.label}
      </a>
      <button type="button" className="contact-copy-phone" onClick={copyPhone}
        aria-label="ტელეფონის ნომრის კოპირება">
        {status === 'copied' ? <Check size={19} aria-hidden="true" /> : <Copy size={19} aria-hidden="true" />}
      </button>
      <span className="contact-copy-status" role="status">
        {status === 'copied' ? 'ნომერი დაკოპირდა.' : status === 'error' ? 'ნომერი ვერ დაკოპირდა. მონიშნე და დააკოპირე.' : ''}
      </span>
    </div>
  );
}
