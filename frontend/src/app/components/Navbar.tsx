import { Link, useLocation } from 'react-router-dom';
import { Database } from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="bg-zinc-900/80 backdrop-blur-sm border-b border-yellow-500/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-yellow-500 p-2 rounded-lg group-hover:bg-yellow-400 transition-colors">
              <Database className="h-6 w-6 text-zinc-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-yellow-500 group-hover:text-yellow-400 transition-colors">
                Redis Architecture Research
              </h1>
              <p className="text-xs text-zinc-400">Persistence, Performance & Scalability Analysis</p>
            </div>
          </Link>
          
          {!isHome && (
            <Link
              to="/"
              className="px-4 py-2 bg-zinc-800 text-yellow-500 rounded-lg hover:bg-zinc-700 transition-colors border border-yellow-500/20"
            >
              ← Back to Projects
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
