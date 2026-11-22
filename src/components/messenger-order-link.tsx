import { MessageCircle } from 'lucide-react';
import { previewFacebook } from '@/lib/preview-copy';

export function MessengerOrderLink() {
  return (
    <a className="button button-yellow messenger-order-link" href={previewFacebook.messengerHref}>
      <MessageCircle size={18} aria-hidden="true" /> შეუკვეთე Messenger-ით
    </a>
  );
}
