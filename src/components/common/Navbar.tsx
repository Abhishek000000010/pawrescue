import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <PawPrint className="text-orange-500 w-8 h-8" />
            <span className="text-xl font-bold font-jakarta text-white">PawNet India</span>
          </Link>
          <div className="flex gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white px-3 py-2 rounded-md font-medium transition-colors">
              Log In
            </Link>
            <Link to="/register" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
