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
        window.location.href = '/';
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl">
      <h2 className="text-3xl font-bold font-jakarta mb-6 text-white text-center">Log In</h2>
      <form onSubmit={submitHandler} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg focus:outline-none focus:border-orange-500 text-white"
            required
          />
        </div>
        <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors mt-4">
          Sign In
        </button>
      </form>
      <p className="mt-6 text-center text-slate-400">
        Don't have an account? <Link to="/register" className="text-orange-500 hover:underline">Sign up</Link>
      </p>
    </div>
  );
};

export default Login;
