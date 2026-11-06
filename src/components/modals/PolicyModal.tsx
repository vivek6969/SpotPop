import React, { useState } from 'react';
import { SpotPopLogo } from '../brand/SpotPopLogo';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy' | 'refund' | 'content';
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'refund' | 'content'>(initialTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#12141F] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto animate-fade-in">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <div className="flex items-center gap-2.5">
            <SpotPopLogo variant="icon" size={24} />
            <h3 className="font-outfit font-bold text-base text-white">SpotPop Policies & Transparency</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 py-2.5 bg-white/5 border-b border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'terms', label: 'Terms of Service' },
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'refund', label: 'Refund Policy' },
            { id: 'content', label: 'Content Guidelines' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body Text */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-slate-300 leading-relaxed no-scrollbar">
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Terms of Service</h4>
              <p>
                Welcome to SPOTPOP (&quot;spotpop.in&quot;). By creating or purchasing a space (&quot;SPOT&quot;) on the shared digital canvas, you agree to these Terms of Service.
              </p>
              <h5 className="font-bold text-white mt-2">1. The Public Canvas</h5>
              <p>
                All content placed on the SPOTPOP canvas is publicly visible to any internet visitor. You maintain ownership of your original artwork and text, while granting SpotPop a non-exclusive license to display, host, and render your spot on the canvas and in viral share kits.
              </p>
              <h5 className="font-bold text-white mt-2">2. Single Purchase & Perpetual Placement</h5>
              <p>
                Mini Pop (₹29) and Big Pop (₹99) are one-time payments for permanent canvas coordinate allocation. SpotPop does not charge recurring subscriptions.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Privacy Policy</h4>
              <p>
                We respect your personal privacy. We do not sell user data to advertising brokers or track personal activity outside of spotpop.in.
              </p>
              <h5 className="font-bold text-white mt-2">1. Data Collected</h5>
              <p>
                We store account credentials (email, username, display name), spot coordinates, uploaded images, and order status.
              </p>
              <h5 className="font-bold text-white mt-2">2. Payment Security</h5>
              <p>
                SpotPop never stores credit card, debit card, or UPI PIN numbers. All payment transactions are securely handled through Razorpay.
              </p>
            </div>
          )}

          {activeTab === 'refund' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Refund Policy</h4>
              <p>
                Because spots on the public canvas are allocated and published in real-time immediately upon payment verification, purchases are generally final.
              </p>
              <p>
                If a technical server failure occurs where payment was debited but coordinate allocation did not complete, our automated reconciliation will either complete the placement or issue an immediate refund within 3-5 business days. Contact support@spotpop.in for billing queries.
              </p>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-3">
              <h4 className="font-bold text-white text-sm">Content Guidelines & Prohibited Items</h4>
              <p>
                SpotPop is a creative public space. We strictly prohibit:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Hate speech, racism, threats, or harassment</li>
                <li>Non-consensual intimate imagery or nudity</li>
                <li>Child exploitation material</li>
                <li>Doxxing or revealing personal telephone/home numbers without consent</li>
                <li>Malware, phishing links, or executable exploits</li>
                <li>Direct copyright infringements</li>
              </ul>
              <p className="mt-2">
                Violating spots are subject to immediate removal by administrators without refund.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
