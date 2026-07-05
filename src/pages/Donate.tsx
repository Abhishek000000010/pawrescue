import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, X, ShieldCheck, CheckCircle2, User, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Donate() {
  const [step, setStep] = useState<'amount' | 'details' | 'processing' | 'success'>('amount');
  const [amount, setAmount] = useState<number>(500);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    handleDonate();
  };

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
    const token = localStorage.getItem('pawnet_token');
    if (!token) {
      alert("Please login first to make a donation and earn XP!");
      navigate('/login');
      return;
    }

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your connection.');
        setStep('amount');
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

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text || 'Empty response'}`);
      }

      const data = await response.json();

      if (!data.success) {
        alert('Failed to create order. Is Razorpay configured?');
        setStep('amount');
        return;
      }

      // Hackathon Mock Mode: Bypass Razorpay SDK if using dummy keys
      if (data.keyId === 'rzp_test_mockkey123456') {
        setStep('processing');
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            isMock: true,
            amount, name, email, address, message
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          setStep('success');
        } else {
          alert('Failed to process mock payment.');
          setStep('amount');
        }
        return;
      }

      // Initialize Razorpay
      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'PawNet Rescue',
        description: "Sponsor a stray cat's medical expenses",
        order_id: data.order.id,
        prefill: {
          name: name,
          email: email
        },
        handler: async function (response: any) {
          setStep('processing');
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
                razorpay_signature: response.razorpay_signature,
                amount, name, email, address, message
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setStep('success');
            } else {
              alert('Payment verification failed.');
              setStep('amount');
            }
          } catch (err) {
            console.error(err);
            setStep('amount');
          }
        },
        modal: {
          ondismiss: function() {
            setStep('details');
          }
        },
        theme: {
          color: '#fb923c' // Brand primary
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert('Payment Failed! ' + response.error.description);
        setStep('details');
      });
      rzp.open();

    } catch (err: any) {
      console.error(err);
      alert('Error initiating payment: ' + (err.message || 'Unknown error'));
      setStep('amount');
    }
  };

  const renderContent = () => {
    if (step === 'processing') {
      return (
        <div className="text-center space-y-4 py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-brand-primary mx-auto"></div>
          <h3 className="font-heading text-xl font-black text-brand-dark dark:text-brand-light">Processing Payment</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Securely connecting to banking gateway...</p>
        </div>
      );
    }

    if (step === 'success') {
      return (
        <div className="text-center space-y-6">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
            <CheckCircle2 className="h-12 w-12 fill-current" />
          </div>
          <div>
            <h3 className="font-heading text-3xl font-black text-brand-dark dark:text-brand-light">Payment Successful!</h3>
            <p className="text-base text-zinc-500 dark:text-zinc-400 mt-3 font-medium">Thank you for sponsoring PawNet. You've earned +{amount} XP points!</p>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-700/50 text-left space-y-4 max-w-sm mx-auto">
            <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-700 pb-3">Donation Receipt Overview</h4>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 font-medium">Amount</span>
              <span className="font-black text-brand-dark dark:text-brand-light">₹{amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 font-medium">Date</span>
              <span className="font-black text-brand-dark dark:text-brand-light">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500 font-medium">Sponsor</span>
              <span className="font-black text-brand-dark dark:text-brand-light">{name || 'Anonymous'}</span>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="py-4 px-8 rounded-xl font-black bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors shadow-lg shadow-brand-primary/20 text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <User className="h-5 w-5" /> View Profile & Download PDF
            </button>
          </div>
        </div>
      );
    }

    if (step === 'details') {
      return (
        <form onSubmit={handleDetailsSubmit} className="space-y-6">
          <div className="text-center space-y-3 mb-8">
            <h3 className="font-heading text-3xl font-black text-brand-dark dark:text-brand-light">
              Billing Details
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">
              We need a few details to generate your tax receipt.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Full Name</label>
              <input 
                type="text" required value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-base font-medium text-brand-dark dark:text-brand-light focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Email Address</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-base font-medium text-brand-dark dark:text-brand-light focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Billing Address</label>
              <input 
                type="text" required value={address} onChange={e => setAddress(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-base font-medium text-brand-dark dark:text-brand-light focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all"
                placeholder="123 Rescue St, City, Country"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 block">Optional Message</label>
              <textarea 
                value={message} onChange={e => setMessage(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-5 py-3 text-base font-medium text-brand-dark dark:text-brand-light focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:outline-none transition-all resize-none h-24"
                placeholder="Leave a note for the community..."
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={() => setStep('amount')} className="px-6 py-4 rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              Back
            </button>
            <button type="submit" className="flex-1 bg-brand-dark dark:bg-brand-primary hover:bg-brand-primary hover:text-white dark:hover:bg-brand-primary-hover text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-primary/20">
              Proceed to Pay ₹{amount}
            </button>
          </div>
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Secure Payment via Razorpay
          </p>
        </form>
      );
    }

    // Default amount step
    return (
      <>
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand-primary/10 text-brand-primary mb-2 shadow-inner">
            <Heart className="h-8 w-8 fill-current" />
          </div>
          <h3 className="font-heading text-3xl font-black text-brand-dark dark:text-brand-light">
            Sponsor a Rescue
          </h3>
          <p className="text-base text-zinc-500 dark:text-zinc-400 font-medium px-4 max-w-md mx-auto">
            Your donation directly funds emergency vet bills, vaccinations, and daily food for our colonies.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[100, 500, 1000].map(val => (
            <button
              key={val}
              onClick={() => setAmount(val)}
              className={`py-4 rounded-2xl font-black text-lg transition-all duration-300 ${
                amount === val 
                  ? 'bg-brand-primary text-white shadow-xl shadow-brand-primary/30 scale-[1.02] border-transparent' 
                  : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/50'
              }`}
            >
              ₹{val}
            </button>
          ))}
        </div>

        <div className="mb-8 relative">
          <label className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 block">
            Custom Amount (₹)
          </label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-400">₹</span>
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl pl-12 pr-6 py-4 text-2xl font-black text-brand-dark dark:text-brand-light focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (amount < 10) return;
            const token = localStorage.getItem('pawnet_token');
            if (!token) {
              alert("Please login first to make a donation and earn XP!");
              navigate('/login');
            } else {
              setStep('details');
            }
          }}
          disabled={amount < 10}
          className="w-full bg-brand-dark dark:bg-brand-primary hover:bg-brand-primary hover:text-white dark:text-white dark:hover:bg-brand-primary-hover text-white py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-dark/20 dark:shadow-brand-primary/20 flex items-center justify-center gap-2 text-lg"
        >
          Continue
        </button>
      </>
    );
  };

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 lg:px-8 flex items-center justify-center relative overflow-hidden bg-zinc-50/50 dark:bg-brand-dark">
      {/* Background blobs for a premium feel */}
      <div className="absolute top-40 left-20 w-72 h-72 bg-brand-primary/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten opacity-70"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left Column: Visuals & Impact */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col space-y-10"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary font-black text-sm uppercase tracking-widest border border-brand-primary/20">
              <Heart className="w-4 h-4 fill-brand-primary" /> 100% goes to rescue efforts
            </div>
            <h1 className="font-heading text-5xl xl:text-6xl font-black text-brand-dark dark:text-brand-light leading-[1.1] tracking-tight">
              Your compassion <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">saves lives.</span>
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md font-medium leading-relaxed">
              Join thousands of heroes providing emergency medical care, food, and safe shelters for vulnerable street animals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
              <h4 className="font-black text-4xl text-brand-dark dark:text-brand-light">10k+</h4>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Animals Rescued</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-black text-4xl text-brand-dark dark:text-brand-light">50+</h4>
              <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Partner Clinics</p>
            </div>
          </div>
          
          <div className="relative h-72 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl mt-4 border border-zinc-200 dark:border-zinc-800">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/20 to-transparent z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=1000" 
              alt="Rescue Cat" 
              className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute bottom-8 left-8 right-8 z-20">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-brand-primary" />)}
              </div>
              <p className="text-white/90 font-medium text-base leading-relaxed">"Thanks to donors like you, Luna received life-saving surgery after being found alone on the streets."</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Donation Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl mx-auto lg:ml-auto lg:mr-0"
        >
          <div className="glass rounded-[2.5rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-2xl dark:shadow-brand-primary/5 border border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-bl-[100px] -z-10"></div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
