import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('pawnet_token', data.token);
        localStorage.setItem('pawnet_user', JSON.stringify(data));
        alert('Registered successfully!');
        window.location.href = '/';
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream dark:bg-brand-dark py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-4xl w-full flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden z-10 relative">
        {/* Image Section */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <img 
            src="/auth_bg.png" 
            alt="Paw Rescue Register" 
            className="absolute inset-0 w-full h-full object-cover transform scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-cream/90 dark:from-brand-dark/90 to-transparent"></div>
          <div className="absolute bottom-10 left-10 right-10">
            <h1 className="text-4xl font-bold text-zinc-800 dark:text-white font-jakarta mb-4">Join PawNet Today</h1>
            <p className="text-slate-600 dark:text-slate-300">Become a part of a compassionate community dedicated to rescuing and caring for animals.</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold font-jakarta text-zinc-800 dark:text-white">Sign Up</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Create your PawNet account</p>
          </div>
          
          <form onSubmit={submitHandler} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-zinc-800 dark:text-white placeholder-slate-500 transition-all"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-zinc-800 dark:text-white placeholder-slate-500 transition-all"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-zinc-800 dark:text-white placeholder-slate-500 transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-zinc-800 dark:text-white placeholder-slate-500 transition-all"
                placeholder="Create a strong password"
                required
              />
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-0.5 mt-2">
              Create Account
            </button>
          </form>
          
          <p className="mt-6 text-center text-slate-500 dark:text-slate-400">
            Already have an account? <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium hover:underline transition-colors">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
