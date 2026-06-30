import React from 'react';
import { MessageCircle } from 'lucide-react';
import './WhatsAppButton.css';

export default function WhatsAppButton() {
  const whatsappUrl = "https://wa.me/923013631555?text=Hi%20Ghousia%20Restaurant,%20I'd%20like%20to%20make%20an%20inquiry%20or%20place%20an%20order.";

  return (
    <a 
      href={whatsappUrl} 
      className="whatsapp-float" 
      target="_blank" 
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <div className="pulse-ring"></div>
      <div className="pulse-ring-two"></div>
      <MessageCircle size={28} className="whatsapp-icon" />
    </a>
  );
}
