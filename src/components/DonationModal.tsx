import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, ShieldCheck } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const [amount, setAmount] = useState<number>(500);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleDonate = async () => {
    setIsProcessing(true);
    const token = localStorage.getItem('pawnet_token');
    
    if (!token) {
      alert("Please login first to make a donation and earn XP!");
      setIsProcessing(false);
      return;
    }

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your connection.');
        setIsProcessing(false);
        return;
      }

      // Create order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });

      const data = await response.json();

      if (!data.success) {
        alert('Failed to create order. Is Razorpay configured?');
        setIsProcessing(false);
        return;
      }

      // Hackathon Mock Mode: Bypass Razorpay SDK if using dummy keys
      if (data.keyId === 'rzp_test_mockkey123456') {
        alert(`Payment of ₹${amount} successful (Demo Mode)! Thank you for sponsoring PawNet! You've earned +${amount} XP!`);
        setIsProcessing(false);
        onClose();
        return;
      }

      // Initialize Razorpay
      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'PawNet Rescue',
        description: 'Sponsor a stray cat\'s medical expenses',
        order_id: data.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              alert(`Payment of ₹${amount} successful! Thank you for sponsoring PawNet! You've earned +${amount} XP!`);
              onClose();
            } else {
              alert('Payment verification failed.');
            }
          } catch (err) {
            console.error(err);
          }
        },
        theme: {
          color: '#fb923c' // Brand primary
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert('Payment Failed! ' + response.error.description);
      });
      rzp.open();

    } catch (err: any) {
      console.error(err);
      alert('Error initiating payment: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-zinc-200/50 dark:border-zinc-800"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-brand-dark dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary mb-2">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <h3 className="font-heading text-2xl font-black text-brand-dark dark:text-brand-light">
              Sponsor a Rescue
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium px-4">
              Your donation directly funds emergency vet bills, vaccinations, and daily food for our colonies.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[100, 500, 1000].map(val => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className={`py-3 rounded-2xl font-bold transition-all duration-200 ${
                  amount === val 
                    ? 'bg-brand-primary text-white shadow-md scale-[1.02]' 
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                ₹{val}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">
              Custom Amount (₹)
            </label>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-lg font-black text-brand-dark dark:text-brand-light focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <button
            onClick={handleDonate}
            disabled={isProcessing || amount < 10}
            className="w-full bg-brand-dark dark:bg-brand-primary hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary-hover text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {isProcessing ? 'Processing...' : `Donate ₹${amount}`}
          </button>

          <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Secure Payment via Razorpay
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
