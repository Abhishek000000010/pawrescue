import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('pawnet_token', data.token);
        localStorage.setItem('pawnet_user', JSON.stringify(data));
        alert('Logged in successfully!');
        window.location.href = data.role === 'admin' ? '/admin' : '/';
      } else {
        alert(data.message || 'Login failed');
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
            alt="Paw Rescue Login" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-cream/90 dark:from-brand-dark/90 to-transparent"></div>
          <div className="absolute bottom-10 left-10 right-10">
            <h1 className="text-4xl font-bold text-zinc-800 dark:text-white font-jakarta mb-4">Welcome Back to PawNet</h1>
            <p className="text-slate-600 dark:text-slate-300">Join our community of animal lovers and make a difference in a pet's life today.</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-jakarta text-zinc-800 dark:text-white">Log In</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Access your PawNet account</p>
          </div>
          
          <form onSubmit={submitHandler} className="space-y-6" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-zinc-800 dark:text-white placeholder-slate-500 transition-all"
                placeholder="Enter your email"
                required
                autoComplete="off"
                data-lpignore="true"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-zinc-800 dark:text-white placeholder-slate-500 transition-all"
                placeholder="Enter your password"
                required
                autoComplete="new-password"
                data-lpignore="true"
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-slate-600 dark:text-slate-300">
                <input type="checkbox" className="mr-2 rounded border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-orange-500 focus:ring-orange-500" />
                Remember me
              </label>
              <a href="#" className="text-orange-400 hover:text-orange-300 transition-colors">Forgot Password?</a>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-0.5">
              Sign In
            </button>
          </form>
          
          <p className="mt-8 text-center text-slate-500 dark:text-slate-400">
            Don't have an account? <Link to="/register" className="text-orange-400 hover:text-orange-300 font-medium hover:underline transition-colors">Sign up now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
